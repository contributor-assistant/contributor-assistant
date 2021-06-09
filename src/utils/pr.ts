import { octokit } from "./octokit.ts";
import * as action from "./action.ts";
import { context } from "./context.ts";

export async function lock() {
  action.info(
    "Locking the Pull Request to safe guard the Pull Request CLA Signatures",
  );
  const prNumber = context.issue.number;
  try {
    await octokit.issues.lock({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
    });
    action.info(`successfully locked the pull request ${prNumber}`);
  } catch {
    action.error(`failed when locking the pull request ${prNumber}`);
  }
}
