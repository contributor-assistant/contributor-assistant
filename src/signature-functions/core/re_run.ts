import { action, context, normalizeText, pr } from "../../utils.ts";
import { ignoreLabelEvent } from "./labels.ts";
import { options } from "../options.ts";
import { readGithubStorage, writeGithubStorage } from "./storage.ts";
import type { ReRunData } from "./types.ts";
import { applicationType, storageVersion } from "../meta.ts";

/** re-run only if
 * - "recheck" or the signature are in comments
 * - ignore label has been updated */
export function reRunRequired(): boolean {
  if (ignoreLabelEvent()) return true;
  if (context.eventName !== "issue_comment") return false;
  const signatureText = normalizeText(options.message.input.signature);
  const body = normalizeText(context.payload.comment?.body ?? "");
  // edited comment
  const from = normalizeText(context.payload.changes?.body?.from ?? "");
  return !!body.startsWith(signatureText) || !!from.startsWith(signatureText) ||
    body === normalizeText(options.message.input.reTrigger);
}

/** A re-run is needed to change the status of the workflow triggered by "pull_request_target"
 * https://github.com/cla-assistant/github-action/issues/39 */
export async function reRun() {
  const branch = await pr.branch();
  const workflowId = await action.workflowId();
  const runs = await action.workflowRuns(
    branch,
    workflowId,
    "pull_request_target",
  );

  if (runs.total_count > 0) {
    const runId = runs.workflow_runs[0].id;

    action.info(`Re-running build run ${runId}`);
    await action.reRun(runId).catch((error) =>
      action.error(`Error occurred when re-running the workflow: ${error}`)
    );
  }
}

export const defaultReRunContent = {
  type: `${applicationType}/re-run`,
  version: storageVersion,
  data: [],
};

export interface ReRunContent {
  content: ReRunData;
  sha: string;
}

export async function readReRunStorage(): Promise<ReRunContent> {
  const { content, sha } = await readGithubStorage({
    type: "local",
    ...options.reRun,
  }, JSON.stringify(defaultReRunContent));

  return { content: JSON.parse(content), sha };
}

export async function writeReRunStorage(file: ReRunContent) {
  await writeGithubStorage({
    content: JSON.stringify(file.content),
    sha: file.sha,
  }, {
    type: "local",
    ...options.reRun,
  });
}
