import { octokit, personalOctokit } from "./octokit.ts";
import { context } from "./context.ts";
import type { RestEndpointMethodTypes } from "../deps.ts";

/* /!\ @actions/core is not available yet under Deno
https://cdn.skypack.dev/error/node:node:os?from=@actions/core */

/* ------ logging ------ */

export function debug(message: string, object?: unknown) {
  issue("debug", message);
  if (object !== undefined) issue("debug", Deno.inspect(object));
}

export function info(message: string) {
  console.log(escapeData(message));
}

export function warning(message: string) {
  issue("warning", message);
}

export function error(message: string) {
  issue("error", message);
}

export function fail(message: string): never {
  error(message);
  Deno.exit(1);
}

const CMD_STRING = "::";

function issue(command: string, message = "") {
  command ||= "missing.command";
  console.log(`${CMD_STRING}${command}${CMD_STRING}${escapeData(message)}`);
}

function escapeData(s: string): string {
  return s
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
}

/* ------ octokit ------ */

export async function workflowId(): Promise<number> {
  const workflowList = await octokit.rest.actions.listRepoWorkflows(
    context.repo,
  ).catch((error) => {
    throw new Error(
      `Error occurred when fetching action workflow id: ${error.message}`,
    );
  });

  const workflow = workflowList.data.workflows
    .find((w) => w.name === context.workflow);

  if (workflow === undefined) {
    throw new Error("Unable to locate this workflow's ID in this repository");
  }
  debug(`Successfully fetched action workflow id: ${workflow.id}`);
  return workflow.id;
}

export async function workflowRuns(
  workflowId: number,
  event: string,
  branch?: string,
): Promise<
  RestEndpointMethodTypes["actions"]["listWorkflowRuns"]["response"]["data"]
> {
  const runs = await octokit.rest.actions.listWorkflowRuns({
    ...context.repo,
    branch,
    workflow_id: workflowId,
    event,
  }).catch((error) => {
    throw new Error(
      `Error occurred when fetching action workflow runs: ${error.message}`,
    );
  });
  debug("Successfully fetched action workflow runs");
  return runs.data;
}

export async function reRun(runId: number) {
  // Personal Access Token with repo scope is required to access this api
  // https://github.community/t/bug-rerun-workflow-api-not-working/126742
  await personalOctokit.rest.actions.reRunWorkflow({
    ...context.repo,
    run_id: runId,
  }).catch((error) => {
    if (
      !error?.message.match(/This workflow is already re-running/)
    ) {
      throw new Error(
        `Error occurred while re-running run ${runId}: ${error.message}`,
      );
    }
  });
  debug(`Successfully re-ran run ${runId}`);
}

export async function getWorkflow(
  runId: number,
): Promise<
  RestEndpointMethodTypes["actions"]["getWorkflowRun"]["response"]["data"]
> {
  const run = await octokit.rest.actions.getWorkflowRun({
    ...context.repo,
    run_id: runId,
  }).catch((error) => {
    throw new Error(
      `Error occurred when fetching workflow run ${runId}: ${error.message}`,
    );
  });
  debug(`Successfully fetched workflow run ${runId}`);
  return run.data;
}

export async function repo(): Promise<
  RestEndpointMethodTypes["repos"]["get"]["response"]["data"]
> {
  const repo = await octokit.rest.repos.get(context.repo).catch((error) => {
    throw new Error(
      `Error occurred when fetching repository: ${error.message}`,
    );
  });
  debug("Successfully fetched action workflow repo");
  return repo.data;
}
