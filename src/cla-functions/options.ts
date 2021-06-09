import {
  action,
  context,
  initOctokit,
  octokit,
  personalOctokit,
} from "../utils.ts";

export interface CLAOptions {
  githubToken: string;
  personalAccessToken: string;
  lockPullRequestAfterMerge?: boolean;
  allowList?: string[];
  remoteRepoName?: string;
  remoteOrgName?: string;
  signaturesPath?: string;
  branch?: string;
  commitMessage?: string;
  signedCommitMessage?: string;
  allSignedPrComment?: string;
  notSignedPrComment?: string;
  prSignComment?: string;
}

export type ParsedCLAOptions = Omit<
  Required<CLAOptions>,
  "githubToken" | "personalAccessToken"
>;
export let options: ParsedCLAOptions;
export let remoteRepo: boolean;

export async function setupOptions(opts: CLAOptions) {
  initOctokit(opts.githubToken, opts.personalAccessToken);
  if (opts.remoteOrgName !== undefined) {
    if (opts.remoteRepoName === undefined) {
      action.fatal("Please provide a repository name.", -1);
    }
    remoteRepo = true;
  }

  opts.lockPullRequestAfterMerge ??= false;
  opts.allowList ??= [];
  opts.remoteRepoName ??= context.repo.repo;
  opts.remoteOrgName ??= context.repo.owner;
  opts.signaturesPath ??= "signatures/cla.json";
  if (opts.branch === undefined) {
    const repo = await (remoteRepo ? personalOctokit : octokit).repos.get({
      repo: opts.remoteRepoName,
      owner: opts.remoteOrgName,
    });
    opts.branch = repo.data.default_branch;
  }
  opts.commitMessage ??= "Creating file for storing CLA Signatures";
  opts.signedCommitMessage ??=
    "@$contributorName has signed the CLA from Pull Request #$pullRequestNo";
  opts.allSignedPrComment ??= "All contributors have signed the CLA  ✍️ ✅";
  opts.notSignedPrComment ??=
    "<br/>Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that $you sign our [Contributor License Agreement](${input.getPathToDocument()}) before we can accept your contribution. You can sign the CLA by just posting a Pull Request Comment same as the below format.<br/>";
  opts.prSignComment ??=
    "I have read the CLA Document and I hereby sign the CLA";

  options = opts as ParsedCLAOptions;
}
