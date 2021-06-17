import { context, normalizeText, pr, action } from "../../utils.ts";
import { options } from "../options.ts";

export function reRunRequired(): boolean {
  if (context.eventName !== "issue_comment") return false;
  const body = normalizeText(context.payload.comment?.body ?? "");
  return !!body.match(normalizeText(options.message.comment.signature)) ||
    body === normalizeText(options.message.comment.retrigger);
}

export async function reRun() {
  const branch = await pr.branch();
  const workflowId = await action.workflowId();
  const runs = await action.workflowRuns(branch, workflowId, "pull_request_target");

  if (runs.total_count > 0) {
    const runId = runs.workflow_runs[0].id;

    const lastWorkflow = await action.getWorkflow(runId);
    if (lastWorkflow.conclusion === "failure") {
      action.debug(`Rerunning build runId ${runId}`);
      await action.reRun(runId).catch((error) =>
        action.error(`Error occurred when re-running the workflow: ${error}`)
      );
    }
  }
}
