import { action, context, github, octokit, spliceArray, checkStorageContent, issue } from "../../utils.ts";
import { marked, parseYaml } from "../../deps.ts";
import { writeStorage, readStorage, defaultContent } from "./storage.ts";
import type { Form } from "./types.ts";

export function isForm(): boolean {
  const labels: { name: string }[] = context.payload.issue!.labels;
  return context.payload.action === "opened" &&
    labels.some((label) => label.name === "CLA");
}

export async function processForm() {
  const lock = issue.lock();
  const body = context.payload.issue!.body ?? "";
  const { content } = await github.getContent(octokit, {
    ...context.repo,
    path: ".github/ISSUE_TEMPLATE/cla.yml",
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

  const storage = await readStorage();
  checkStorageContent(storage.content, defaultContent);

  storage.content.data.signatures.push({
    user: {
      databaseId: context.payload.issue!.user.id,
      login: context.payload.issue!.user.login,
    },
    issueNumber: context.issue.number,
    date: Date.now(),
    customFields: metadata,
  })

  await writeStorage(storage);
  await lock;

  // TODO: re_run linked PR
}

interface QA {
  type: "q/a"
  id?: string;
  question: string;
  answer: string;
}

interface ItemList {
  type: "items"
  id?: string;
  items: {
    value: string;
    checked: boolean;
  }[];
}

export type CustomField = QA | ItemList;

const noResponse = "_No response_";

export function parseIssue(form: Form, issue: marked.TokensList): CustomField[] {
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
