import {
  action,
  context,
  initOctokit,
} from "../utils.ts";
import type { DeepRequired } from "../utils.ts";

export interface LocalStorage {
  type: "local";
  branch?: string;
  path?: string;
}

export interface RemoteGithubStorage extends Omit<LocalStorage, "type"> {
  type: "remote-github";
  owner?: string;
  repo: string;
}

export interface CLAOptions {
  githubToken: string;
  personalAccessToken: string;
  CLAPath: string;
  storage?: LocalStorage | RemoteGithubStorage;
  message?: {
    commit?: {
      setup?: string;
      signed?: string;
    };
    comment?: {
      allSigned?: string;
      header?: string;
      signature?: string;
      retrigger?: string;
    };
  };
  ignoreList?: string[];
  lockPRAfterMerge?: boolean;
}

export type ParsedCLAOptions = Omit<
  DeepRequired<CLAOptions>,
  "githubToken" | "personalAccessToken"
>;
export let options: ParsedCLAOptions;

export function setupOptions(opts: CLAOptions) {
  opts.githubToken ||= Deno.env.get("GITHUB_TOKEN") ?? "";
  opts.personalAccessToken ||= Deno.env.get("PERSONAL_ACCESS_TOKEN") ?? "";

  action.debug("Raw options", opts);

  if (opts.githubToken === "") {
    action.fail(
      "Missing github token. Please provide one as an environment variable.",
    );
  }
  if (opts.personalAccessToken === "") {
    action.fail(
      "Missing personal access token (https://github.com/settings/tokens/new). Please provide one as an environment variable.",
    );
  }
  if (opts.CLAPath === "") {
    action.fail("Missing CLA path.");
  }
  initOctokit(opts.githubToken, opts.personalAccessToken);

  opts.storage ??= { type: "local" };
  if (opts.storage.type === "remote-github") {
    opts.storage.owner ??= context.repo.owner;
  }
  opts.storage.path ??= ".github/contributor-assistant/cla.json";
  // storage.branch will defaults to the repository's default branch thanks to github API

  opts.message = {
    commit: {
      setup: "Creating file for storing CLA Signatures",
      signed:
        "@${contributor-name} has signed the CLA from Pull Request #${pull-request-number}",
      ...opts.message?.commit,
    },
    comment: {
      allSigned: "All contributors have signed the CLA  ✍️ ✅",
      header:
        "Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that ${you} signature our [Contributor License Agreement](${cla-path}) before we can accept your contribution. You can signature the CLA by just posting a Pull Request Comment same as the below format.",
      signature: "I have read the CLA Document and I hereby signature the CLA",
      retrigger: "recheck",
      ...opts.message?.comment,
    },
  };

  opts.ignoreList ??= [];
  opts.lockPRAfterMerge ??= false;

  options = opts as ParsedCLAOptions;
  action.debug("Parsed options", options);
}
