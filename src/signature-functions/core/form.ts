import {
  action,
  context,
  github,
  issue,
  octokit,
  spliceArray,
  storage,
} from "../../utils.ts";
import { marked, parseYaml } from "../../deps.ts";
import { readReRunStorage } from "./re_run.ts";
import {
  defaultSignatureContent,
  readSignatureStorage,
  writeSignatureStorage,
} from "./signatures.ts";
import { options } from "../options.ts";
import type { Form } from "./types.ts";

export function isForm(): boolean {
  const labels: { name: string }[] = context.payload.issue!.labels;
  return context.payload.action === "opened" &&
    labels.some((label) => label.name === options.labels.form);
}

export async function processForm() {
  const body = context.payload.issue!.body ?? "";
  const { content } = await github.getFile(octokit, {
    ...context.repo,
    path: options.storage.form.path,
    ref: options.storage.form.branch,
  });

  const form = parseYaml(content) as Form;
  const markdown = marked.lexer(body);
  const metadata = parseIssue(form, markdown);

  const isSignature = (data: CustomField) => data.id === "signature";

  const signature = metadata.find(isSignature);
  if (signature === undefined) {
    action.fail("No signature field found. Can't proceed.");
  }

  if (signature.type === "items") {
    if (!signature.items[0].checked) {
      action.fail("The CLA has not been signed.");
    }
  } else {
    // TODO: accept text signatures
    action.fail("Unimplemented");
  }

  spliceArray(metadata, isSignature);

  const file = await readSignatureStorage();
  storage.checkContent(file.content, defaultSignatureContent);
  const databaseId: number = context.payload.issue!.user.id;

  file.content.data.signatures.push({
    user: {
      databaseId,
      login: context.payload.issue!.user.login,
    },
    issue: context.issue.number,
    date: Date.now(),
    customFields: metadata,
  });

  const writeSignature = writeSignatureStorage(file);
  const { content: reRunContent } = await readReRunStorage();

  const reRuns: Promise<void>[] = [];

  await writeSignature;
  for (const run of reRunContent.data) {
    if (run.unsigned.includes(databaseId)) {
      reRuns.push(action.reRun(run.workflow));
    }
  }
  await Promise.all([...reRuns]);
  await issue.lock();
}

interface QA {
  type: "q/a";
  id?: string;
  question: string;
  answer: string;
}

interface ItemList {
  type: "items";
  id?: string;
  items: {
    value: string;
    checked: boolean;
  }[];
}

export type CustomField = QA | ItemList;

const noResponse = "_No response_";

export function parseIssue(
  form: Form,
  issue: marked.TokensList,
): CustomField[] {
  const iterator = issue.values();
  let token = iterator.next();

  const result: CustomField[] = [];

  for (const input of form.body) {
    if (input.type === "markdown") continue;
    if (token.done) break;
    if (
      token.value.type !== "heading" ||
      token.value.text !== input.attributes.label
    ) {
      break;
    }
    token = iterator.next();
    if (token.done) break;
    if (token.value.type === "paragraph") {
      if (
        input.type !== "input" && input.type !== "textarea" &&
        input.type !== "dropdown"
      ) {
        break;
      }
      const text = token.value.text;
      if (text !== noResponse) {
        result.push({
          type: "q/a",
          id: input.id,
          question: input.attributes.label,
          answer: text,
        });
      }
    } else if (token.value.type === "list") {
      if (input.type !== "checkboxes") break;
      result.push({
        type: "items",
        id: input.id,
        items: token.value.items.map((item) => ({
          value: item.text,
          checked: item.checked,
        })),
      });
    } else break;
    token = iterator.next();
    if (token.done) break;
    if (token.value.type === "space") token = iterator.next();
  }

  if (!token.done) throw new Error("Error while parsing issue form");
  return result;
}
