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
import { readSignatureStorage, writeSignatureStorage } from "./signatures.ts";
import { defaultSignatureContent } from "./default.ts";
import { options } from "../options.ts";
import { head, missingIssueComment } from "./comment.ts";
import { createSignatureLabel } from "./labels.ts";
import type { Form } from "./types.ts";

export function isForm(): boolean {
  const labels: { name: string }[] = context.payload.issue!.labels;
  return context.payload.action === "labeled" &&
    labels.some((label) => label.name === options.labels.form);
}

export async function readForm(): Promise<github.RawContent> {
  try {
    const content = await github.getFile(octokit, {
      ...context.repo,
      path: `.github/ISSUE_TEMPLATE/${options.storage.form}`,
    });
    return content;
  } catch (error) {
    if (error.status === 404) {
      action.warning(
        "Issue form doesn't exist. Creating a form from template...",
      );
      const template = await github.getFile(octokit, {
        owner: "cla-assistant",
        repo: "contributor-assistant",
        path: "actions/signatures/examples/template.yml",
      });
      const [content] = await Promise.all([
        github.createOrUpdateFile(octokit, {
          ...context.repo,
          path: `.github/ISSUE_TEMPLATE/${options.storage.form}`,
        }, {
          message: options.message.commit.setup,
          content: template.content,
        }),
        createSignatureLabel(),
      ]);
      await missingIssueComment();
      return content;
    } else {
      action.fail(
        `Could not retrieve form content: ${error.message}. Status: ${error
          .status || "unknown"}`,
      );
    }
  }
}

/** Parse the form, check for signature, save signature and close the associated issue */
export async function processForm() {
  action.debug("Processing issue form");

  const body = context.payload.issue!.body ?? "";
  const { content } = await readForm();

  const form = parseYaml(content) as Form;
  const markdown = marked.lexer(body);
  const { fields, signature } = parseIssue(form, markdown);

  action.debug("Form", form);
  action.debug("Parsed issue", fields);

  if (signature === null) {
    action.fail("No signature field found. Can't proceed.");
  }

  if (Array.isArray(signature)) {
    if (!signature[0]) {
      await issue.createComment(`${head}The document has not been signed.`);
      action.fail("The document has not been signed.");
    }
  } else {
    // TODO: accept text signatures
    await issue.createComment(`${head}Text signatures are not implemented.`);
    action.fail("Unimplemented");
  }

  const file = await readSignatureStorage();
  storage.checkContent(file.content, defaultSignatureContent);
  const databaseId: number = context.payload.issue!.user.id;

  const { current, previous, invalidated } = file.content.data;
  const currentFormSHA = new Sha256().update(content).toString();

  if (currentFormSHA !== current.formSHA) {
    action.debug("Form SHA has changed, updating signature storage");
    if (current.formSHA !== "") {
      invalidated.push({
        ...current,
        endDate: new Date().toJSON(),
      });
      current.signatures = [];
    }
    current.form = form;
    current.formSHA = currentFormSHA;
  }

  const previousSignatureIndex = current.signatures.findIndex((
    signature,
  ) => signature.user.databaseId === databaseId);

  if (previousSignatureIndex !== -1) {
    action.debug("New signature found: supersede the previous one");
    previous.push({
      ...current.signatures[previousSignatureIndex],
      endDate: new Date().toJSON(),
      formSHA: currentFormSHA,
    });
    current.signatures.splice(previousSignatureIndex, 1);
  }

  action.debug("Adding new signature");
  current.signatures.push({
    user: {
      databaseId,
      login: context.payload.issue!.user.login,
    },
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue: context.issue.number,
    date: new Date().toJSON(),
    fields,
  });

  const writeSignature = writeSignatureStorage(file);
  const { content: reRunContent } = await readReRunStorage();

  const reRuns: Promise<void>[] = [];

  await writeSignature;
  for (const { unsigned, runId } of reRunContent.data) {
    if (unsigned.includes(databaseId)) {
      reRuns.push(action.reRun(runId));
    }
  }
  await Promise.all([...reRuns]);
  await issue.lock();
}

type TextField = string;
type ItemList = boolean[];
type Dropdown = number;
type NoResponse = null;

export type CustomField = TextField | ItemList | Dropdown | NoResponse;

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
      } else {
        fields.push(null);
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

export function extractIDs(form: Form): string[] {
  return form.body
    .map((input) => input.id)
    .filter((id) => id !== undefined && id !== "signature") as string[];
}
