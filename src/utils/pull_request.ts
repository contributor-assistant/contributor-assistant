import { octokit } from "./octokit.ts";
import { context } from "./context.ts";
import * as action from "./action.ts";

export {
  addLabels,
  createComment,
  deleteComment,
  getLabels,
  listComments,
  lock,
  removeLabel,
  updateComment,
} from "./issue.ts";
export type { Comments } from "./issue.ts";

export async function branch(): Promise<string> {
  const prNumber = context.issue.number;
  const pr = await octokit.rest.pulls.get({
    ...context.repo,
    pull_number: prNumber,
  }).catch((error) => {
    throw new Error(
      `Error occurred when fetching pull request (#${prNumber}) branch: ${error.message}`,
    );
  });
  action.debug(`Successfully fetched pull request (#${prNumber}) branch`);
  return pr.data.head.ref;
}
