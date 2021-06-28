import { octokit } from "./octokit.ts";
import * as action from "./action.ts";
import { context } from "./context.ts";

export async function lock() {
  const prNumber = context.issue.number;
  await octokit.issues.lock({
    ...context.repo,
    issue_number: prNumber,
  }).catch((error) => {
    throw new Error(
      `Error occurred when locking the issue #${prNumber}: ${error.message}`,
    );
  });
  action.info(`Successfully locked the issue #${prNumber}`);
}
