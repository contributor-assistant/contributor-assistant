import {
  action,
  context,
  github,
  issue,
  octokit,
  storage,
} from "../../utils.ts";
import { marked, parseYaml, Sha256 } from "../../deps.ts";
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
  const { fields, signature } = parseIssue(form, markdown);

  if (signature === null) {
    action.fail("No signature field found. Can't proceed.");
  }

  if (Array.isArray(signature)) {
    if (!signature[0]) {
      action.fail("The document has not been signed.");
    }
  } else {
    // TODO: accept text signatures
    action.fail("Unimplemented");
  }

  const file = await readSignatureStorage();
  storage.checkContent(file.content, defaultSignatureContent);
  const databaseId: number = context.payload.issue!.user.id;

  const signatureStorage = file.content.data;
  const currentFormSHA = new Sha256().update(content).toString();

  if (currentFormSHA !== signatureStorage.formSHA) {
    if (signatureStorage.formSHA !== "") {
      signatureStorage.invalidated.push({
        form: signatureStorage.form,
        formSHA: signatureStorage.formSHA,
        endDate: Date.now(),
        signatures: signatureStorage.signatures,
      });
    }
    signatureStorage.signatures = [];
    signatureStorage.form = form;
    signatureStorage.formSHA = currentFormSHA;
  }

  const previousSignatureIndex = signatureStorage.signatures.findIndex((
    signature,
  ) => signature.user.databaseId === databaseId);

  if (previousSignatureIndex !== -1) {
    signatureStorage.superseded.push({
      ...signatureStorage.signatures[previousSignatureIndex],
      endDate: Date.now(),
      formSHA: currentFormSHA,
    });
    signatureStorage.signatures.splice(previousSignatureIndex, 1);
  }

  file.content.data.signatures.push({
    user: {
      databaseId,
      login: context.payload.issue!.user.login,
    },
    issue: context.issue.number,
    date: Date.now(),
    fields,
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

type TextField = string;
type ItemList = boolean[];
type Dropdown = number;

export type CustomField = TextField | ItemList | Dropdown;

const noResponse = "_No response_";

function parseIssue(
  form: Form,
  issue: marked.TokensList,
): { fields: CustomField[]; signature: CustomField | null } {
  const iterator = issue.values();
  let token = iterator.next();

  const fields: CustomField[] = [];
  let signature: CustomField | null = null;

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
        switch (input.type) {
          case "input":
          case "textarea":
            fields.push(text);
            break;
          case "dropdown":
            fields.push(input.attributes.options.indexOf(text));
            break;
        }
      }
    } else if (token.value.type === "list") {
      if (input.type !== "checkboxes") break;
      fields.push(token.value.items.map((item) => item.checked));
    } else break;
    if (input.id === "signature") {
      signature = fields[fields.length - 1];
    }
    token = iterator.next();
    if (token.done) break;
    if (token.value.type === "space") token = iterator.next();
  }

  if (!token.done) throw new Error("Error while parsing issue form"); // TODO: explicit error
  return { fields, signature };
}
