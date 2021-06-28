import { action, context, github, octokit, spliceArray, checkStorageContent } from "../../utils.ts";
import { marked, parseYaml } from "../../deps.ts";
import { Metadata, parseIssue } from "./parser.ts";
import { writeStorage, readStorage, defaultContent } from "./storage.ts";
import type { Form } from "./types.ts";

export function isForm(): boolean {
  const labels: { name: string }[] = context.payload.issue!.labels;
  return context.payload.action === "opened" &&
    labels.some((label) => label.name === "CLA");
}

export async function processForm() {
  const body = context.payload.issue!.body ?? "";
  const { content } = await github.getContent(octokit, {
    ...context.repo,
    path: ".github/ISSUE_TEMPLATE/cla.yml",
  });

  const form = parseYaml(content) as Form;
  const issue = marked.lexer(body);
  const metadata = parseIssue(form, issue);

  const isSignature = (data: Metadata) => data.id === "signature";

  const signature = metadata.find(isSignature);
  if (signature === undefined) {
    action.fail("No signature field found. Can't proceed.");
  }

  if (signature.type === "item-list") {
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
    customFields: metadata,
  })

  await writeStorage(storage);

  // TODO: re_run linked PR
}
