import { action, context, initOctokit } from "../utils.ts";
import type { DeepRequired } from "../utils.ts";

export interface LocalStorage {
  type: "local";
  /** The branch where the signatures will be stored. */
  branch?: string;
  /** The path where the signatures will be stored. */
  path?: string;
}

export interface RemoteGithubStorage extends Omit<LocalStorage, "type"> {
  type: "remote-github";
  /** The owner of the remote repository, can be an organization. Leave empty to default to this repository owner. */
  owner?: string;
  /** The name of another repository to store the signatures. */
  repo: string;
}

export interface CLAOptions {
  /** GitHub automatically creates a GITHUB_TOKEN secret to use in your workflow. Paste it by using the standard syntax for referencing secrets: ${{ secrets.GITHUB_TOKEN }}. */
  githubToken: string;
  /** A token you have generated that will be used to access the GitHub API. You have to create it with repo scope and store in the repository's secrets with the name PERSONAL_ACCESS_TOKEN. Paste it by using the standard syntax for referencing secrets: ${{ secrets.PERSONAL_ACCESS_TOKEN }}. */
  personalAccessToken: string;
  /** The document which shall be signed by the contributor(s). It can be any file e.g. inside the repository or it can be a gist. */
  CLAPath: string;
  /** The storage medium for the file holding the signatures. */
  storage?: LocalStorage | RemoteGithubStorage;
  /** A list of users that will be ignored when checking for signatures. They are not required for the CLA checks to pass. */
  ignoreList?: string[];
  /** Will lock the pull request after the merge so that contributors cannot revoke their signatures after the merge. Defaults to true. */
  lockPRAfterMerge?: boolean;
  message?: {
    commit?: {
      /** Commit message when creating the storage file. */
      setup?: string;
      /** Commit message when adding new signatures. */
      signed?: string;
    };
    /** Content of the bot's comment. */
    comment?: {
      allSigned?: string;
      header?: string;
      summary?: string;
      newSignature?: string;
      coAuthorWarning?: string;
      unknownAccount?: string;
      unknownWarning?: string;
      footer?: string;
    };
    input?: {
      /** The signature to be committed in order to sign the CLA. */
      signature?: string;
      /** The keyword to re-trigger signature checks. */
      reTrigger?: string;
    };
  };
}

export type ParsedCLAOptions = Omit<
  DeepRequired<CLAOptions>,
  "githubToken" | "personalAccessToken"
>;
export let options: ParsedCLAOptions;

function removeEmpty<T extends Record<string, unknown> | undefined>(obj: T): T {
  for (const key in obj) {
    // @ts-ignore
    if (obj[key] === undefined || obj[key] === "") {
      delete obj[key];
    }
  }
  return obj;
}

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
  opts.storage.path ||= ".github/contributor-assistant/cla.json";

  // storage.branch will defaults to the repository's default branch thanks to github API
  opts.storage.branch ||= undefined;

  opts.ignoreList ??= [];
  opts.lockPRAfterMerge ??= true;

  opts.message = {
    commit: {
      setup: "Creating file for storing CLA signatures",
      signed: "New CLA signatures on pull request #${pull-request-number}",
      ...removeEmpty(opts.message?.commit),
    },
    comment: {
      allSigned: "All contributors have signed the CLA  ✍️ ✅",
      header:
        "Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that ${you} sign our [Contributor License Agreement](${cla-path}) before we can accept your contribution. You can sign the CLA by just posting a Pull Request comment same as the below format.",
      summary:
        "**${signed}** out of **${total}** committers have signed the CLA.",
      footer:
        "<sub>You can reTrigger this bot by commenting **${reTrigger}** in this Pull Request</sub>",
      newSignature: "*(new signature required)*",
      coAuthorWarning:
        "*You have co-authored a commit with the following people, who are not registered on Github. By signing, you also sign on their behalf.*",
      unknownAccount: "*unknown account*",
      unknownWarning:
        "Some commits do not have associated github accounts. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).",
      ...removeEmpty(opts.message?.comment),
    },
    input: {
      signature: "I have read the CLA Document and I hereby sign the CLA",
      reTrigger: "recheck",
      ...removeEmpty(opts.message?.input),
    },
  };

  options = opts as ParsedCLAOptions;
  action.debug("Parsed options", options);
}
