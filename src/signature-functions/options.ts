import { action, context, initOctokit } from "../utils.ts";
import type { DeepRequired, storage } from "../utils.ts";

export interface Options {
  /** GitHub automatically creates a GITHUB_TOKEN secret to use in your workflow. Paste it by using the standard syntax for referencing secrets: ${{ secrets.GITHUB_TOKEN }}. */
  githubToken: string;
  /** A token you have generated that will be used to access the GitHub API. You have to create it with repo scope and store in the repository's secrets with the name PERSONAL_ACCESS_TOKEN. Paste it by using the standard syntax for referencing secrets: ${{ secrets.PERSONAL_ACCESS_TOKEN }}. */
  personalAccessToken: string;
  /** The document which shall be signed by the contributor(s). It can be any file e.g. inside the repository or it can be a gist. */
  documentPath: string;
  storage?: {
    /** The storage medium for the file holding the signatures. */
    signatures?: storage.Local | storage.Remote;
    /** A cache for the re-run data */
    reRun?: Omit<storage.Local, "type">;
    /** The issue form path */
    form?: string;
  };
  /** A list of users that will be ignored when checking for signatures. They are not required for the CLA checks to pass. */
  ignoreList?: string[];
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
  labels?: {
    signed?: string;
    unsigned?: string;
    ignore?: string;
    form?: string;
  };
}

export type ParsedCLAOptions = Omit<
  DeepRequired<Options>,
  "githubToken" | "personalAccessToken"
>;
export let options: ParsedCLAOptions;

function removeEmpty<T extends Record<string, unknown> | undefined>(obj: T): T {
  for (const key in obj) {
    // @ts-ignore: deno type bug with the string comparaison
    if (obj[key] === undefined || obj[key] === "") {
      delete obj[key];
    }
  }
  return obj;
}

export function setupOptions(opts: Options) {
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
  if (opts.documentPath === "") {
    action.fail("Missing signature document path.");
  }
  initOctokit(opts.githubToken, opts.personalAccessToken);

  opts.storage ??= {};
  opts.storage.signatures ??= { type: "local" };
  if (opts.storage.signatures.type === "remote") {
    opts.storage.signatures.owner ??= context.repo.owner;
  }
  opts.storage.signatures.path ||=
    ".github/contributor-assistant/signatures.json";

  // storage.branch will defaults to the repository's default branch thanks to github API
  opts.storage.signatures.branch ||= undefined;

  opts.storage.reRun = {
    path: ".github/contributor-assistant/signatures-re-run.json",
    ...removeEmpty(opts.storage.reRun),
  };
  opts.storage.form ??= "cla.yml";

  opts.ignoreList ??= [];

  opts.message = {
    commit: {
      setup: "Creating file to store signatures",
      signed: "@${signatory} has signed the CLA",
      ...removeEmpty(opts.message?.commit),
    },
    comment: {
      allSigned: "All contributors have signed the CLA  ✍️ ✅",
      header:
        "Thank you for your submission, we really appreciate it. Like many open-source projects, we ask that ${you} sign our **Contributor License Agreement]** before we can accept your contribution.",
      summary:
        "**${signed}** out of **${total}** committers have signed the CLA.",
      footer:
        "<sub>You can re-trigger this bot by commenting `${re-trigger}` in this Pull Request</sub>",
      unknownWarning:
        "⚠ Some commits do not have associated github accounts. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).",
      ...removeEmpty(opts.message?.comment),
    },
    input: {
      signature: "I have read the CLA Document and I hereby sign the CLA",
      reTrigger: "recheck",
      ...removeEmpty(opts.message?.input),
    },
  };

  opts.labels = {
    signed: "",
    unsigned: "",
    ignore: "",
    form: "signature form",
    ...removeEmpty(opts.labels),
  };

  options = opts as ParsedCLAOptions;
  action.debug("Parsed options", options);
}
