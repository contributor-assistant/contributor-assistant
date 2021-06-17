import { octokit } from "./octokit.ts";
import * as action from "./action.ts";
import { context } from "./context.ts";
import { RestEndpointMethodTypes } from "../deps.ts";

export async function lock() {
  const prNumber = context.issue.number;
  await octokit.issues.lock({
    ...context.repo,
    issue_number: prNumber,
  }).catch((error) => {
    throw new Error(
      `Error occurred when locking the pull request #${prNumber}: ${error.message}`,
    );
  });
  action.info(`Successfully locked the pull request #${prNumber}`);
}

export async function branch(): Promise<string> {
  const prNumber = context.issue.number;
  const pr = await octokit.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  }).catch((error) => {
    throw new Error(
      `Error occurred when fetching pull request (#${prNumber}) branch: ${error.message}`,
    );
  });
  return pr.data.head.ref;
}

export async function createComment(body: string) {
  const prNumber = context.issue.number;
  await octokit.issues.createComment({
    ...context.repo,
    issue_number: prNumber,
    body,
  }).catch((error) => {
    throw new Error(
      `Error occurred when creating a pull request (#${prNumber}) comment: ${error.message}`,
    );
  });
  action.debug(
    `Successfully created a pull request (#${prNumber}) comment: ${body}`,
  );
}

export async function updateComment(id: number, body: string) {
  const prNumber = context.issue.number;
  await octokit.issues.updateComment({
    ...context.repo,
    comment_id: id,
    body,
  }).catch((error) => {
    throw new Error(
      `Error occurred when updating the pull request (#${prNumber}) comment #${id}: ${error.message}`,
    );
  });
  action.debug(
    `Successfully updated the pull request (#${prNumber}) comment #${id}: ${body}`,
  );
}

export type Comments =
  RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"];

export async function listComments(): Promise<Comments> {
  const comments: Comments = [];
  const prNumber = context.issue.number;
  const iterator = octokit.paginate.iterator(
    octokit.issues.listComments,
    {
      ...context.repo,
      issue_number: prNumber,
      per_page: 100,
    },
  );
  try {
    for await (const response of iterator) {
      comments.push(...response.data);
    }
    return comments;
  } catch (error) {
    throw new Error(
      `Error occurred when fetching pull request (#${prNumber}) comments: ${error.message}`,
    );
  }
}
