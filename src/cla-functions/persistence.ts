import { context, octokit, personalOctokit } from "../utils.ts";
import { CLAFile, ReactedCommitterMap } from "./interfaces.ts";
import { options, remoteRepo } from "./options.ts";
import type { RestEndpointMethodTypes } from "../deps.ts";

export async function getFileContent(): Promise<
  RestEndpointMethodTypes["repos"]["getContent"]["response"]
> {
  return (remoteRepo ? personalOctokit : octokit).repos.getContent({
    owner: options.remoteOrgName,
    repo: options.remoteRepoName,
    path: options.signaturesPath,
    ref: options.branch,
  });
}

export async function createFile(content: string) {
  await (remoteRepo ? personalOctokit : octokit).repos
    .createOrUpdateFileContents({
      owner: options.remoteOrgName,
      repo: options.remoteRepoName,
      path: options.signaturesPath,
      message: options.commitMessage,
      content: btoa(content),
      branch: options.branch,
    });
}

export async function updateFile(
  sha: string,
  content: CLAFile,
  reactedCommitters: ReactedCommitterMap,
) {
  const prNumber = context.issue.number;
  content.signedContributors.push(...reactedCommitters.newSigned);
  await (remoteRepo ? personalOctokit : octokit).repos
    .createOrUpdateFileContents({
      owner: options.remoteOrgName,
      repo: options.remoteRepoName,
      path: options.signaturesPath,
      sha,
      message: options.signedCommitMessage
        .replace("$contributorName", context.actor).replace(
          "$pullRequestNo",
          prNumber.toString(),
        ),
      content: btoa(JSON.stringify(content, null, 2)),
      branch: options.branch,
    });
}
