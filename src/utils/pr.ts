import { octokit } from "./octokit.ts";
import * as action from "./action.ts";
import { context } from "./context.ts";
import { RestEndpointMethodTypes } from "../deps.ts";

export { lock } from "./issue.ts";

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

export async function deleteComment(id: number) {
  const prNumber = context.issue.number;
  await octokit.issues.deleteComment({
    ...context.repo,
    comment_id: id,
  }).catch((error) => {
    throw new Error(
      `Error occurred when deleting the pull request (#${prNumber}) comment #${id}: ${error.message}`,
    );
  });
  action.debug(
    `Successfully deleted the pull request (#${prNumber}) comment #${id}`,
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

export async function addLabels(...labels: string[]) {
  const prNumber = context.issue.number;
  await octokit.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels,
  }).catch((error) => {
    throw new Error(
      `Error occurred when adding pull request (#${prNumber}) labels: ${error.message}`,
    );
  });
}

export async function removeLabel(name: string) {
  const prNumber = context.issue.number;
  await octokit.issues.removeLabel({
    ...context.repo,
    issue_number: prNumber,
    name,
  }).catch((error) => {
    throw new Error(
      `Error occurred when removing pull request (#${prNumber}) label: ${error.message}`,
    );
  });
}

export async function getLabels(): Promise<string[]> {
  const prNumber = context.issue.number;
  const labels: string[] = [];
  const iterator = octokit.paginate.iterator(
    octokit.issues.listLabelsOnIssue,
    {
      ...context.repo,
      issue_number: prNumber,
      per_page: 100,
    },
  );
  try {
    for await (const response of iterator) {
      for (const label of response.data) {
        labels.push(label.name);
      }
    }
    return labels;
  } catch (error) {
    throw new Error(
      `Error occurred when fetching pull request (#${prNumber}) labels: ${error.message}`,
    );
  }
}
