import { octokit } from "./octokit.ts";
import * as action from "./action.ts";
import { context } from "./context.ts";
import { RestEndpointMethodTypes } from "../deps.ts";

export async function lock() {
  const prNumber = context.issue.number;
  await octokit.rest.issues.lock({
    ...context.repo,
    issue_number: prNumber,
  }).catch((error) => {
    throw new Error(
      `Error occurred when locking the issue #${prNumber}: ${error.message}`,
    );
  });
  action.debug(`Successfully locked the issue #${prNumber}`);
}

export async function createComment(body: string) {
  const prNumber = context.issue.number;
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: prNumber,
    body,
  }).catch((error) => {
    throw new Error(
      `Error occurred when creating an issue (#${prNumber}) comment: ${error.message}`,
    );
  });
  action.debug(
    `Successfully created an issue (#${prNumber}) comment: ${body}`,
  );
}

export async function updateComment(id: number, body: string) {
  const prNumber = context.issue.number;
  await octokit.rest.issues.updateComment({
    ...context.repo,
    comment_id: id,
    body,
  }).catch((error) => {
    throw new Error(
      `Error occurred when updating the issue (#${prNumber}) comment #${id}: ${error.message}`,
    );
  });
  action.debug(
    `Successfully updated the issue (#${prNumber}) comment #${id}: ${body}`,
  );
}

export async function deleteComment(id: number) {
  const prNumber = context.issue.number;
  await octokit.rest.issues.deleteComment({
    ...context.repo,
    comment_id: id,
  }).catch((error) => {
    throw new Error(
      `Error occurred when deleting the issue (#${prNumber}) comment #${id}: ${error.message}`,
    );
  });
  action.debug(
    `Successfully deleted the issue (#${prNumber}) comment #${id}`,
  );
}

export type Comments =
  RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"];

export async function listComments(): Promise<Comments> {
  const comments: Comments = [];
  const prNumber = context.issue.number;
  const iterator = octokit.paginate.iterator(
    octokit.rest.issues.listComments,
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
    action.debug(`Successfully fetched issue (#${prNumber}) comments`);
    return comments;
  } catch (error) {
    throw new Error(
      `Error occurred when fetching issue (#${prNumber}) comments: ${error.message}`,
    );
  }
}

export async function addLabels(...labels: string[]) {
  const prNumber = context.issue.number;
  await octokit.rest.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels,
  }).catch((error) => {
    throw new Error(
      `Error occurred when adding issue (#${prNumber}) labels: ${error.message}`,
    );
  });
  action.debug(`Successfully added issue (#${prNumber}) labels: ${labels}`);
}

export async function removeLabel(name: string) {
  const prNumber = context.issue.number;
  await octokit.rest.issues.removeLabel({
    ...context.repo,
    issue_number: prNumber,
    name,
  }).catch((error) => {
    throw new Error(
      `Error occurred when removing issue (#${prNumber}) label: ${error.message}`,
    );
  });
  action.debug(`Successfully removed issue (#${prNumber}) label: ${name}`);
}

export async function getLabels(): Promise<string[]> {
  const prNumber = context.issue.number;
  const labels: string[] = [];
  const iterator = octokit.paginate.iterator(
    octokit.rest.issues.listLabelsOnIssue,
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
    action.debug(`Successfully fetched issue (#${prNumber}) labels`);
    return labels;
  } catch (error) {
    throw new Error(
      `Error occurred when fetching issue (#${prNumber}) labels: ${error.message}`,
    );
  }
}
