import { action, context, initOctokit } from "../utils.ts";
import type { DeepRequired, storage } from "../utils.ts";

export interface Options {
  /** GitHub automatically creates a GITHUB_TOKEN secret to use in your workflow. Paste it by using the standard syntax for referencing secrets: ${{ secrets.GITHUB_TOKEN }}. */
  githubToken: string;
  /** A token you have generated that will be used to access the GitHub API. You have to create it with repo scope and store in the repository's secrets with the name PERSONAL_ACCESS_TOKEN. Paste it by using the standard syntax for referencing secrets: ${{ secrets.PERSONAL_ACCESS_TOKEN }}. */
  personalAccessToken: string;
  storage: {
    /** The storage medium for the file holding the signatures. */
    signatures?: storage.Local | storage.Remote;
    /** A cache for the re-run data */
    reRun?: Omit<storage.Local, "type">;
    /** The document which shall be signed by the contributor(s). Must be an issue form (yml file) */
    form: string;
  };
  /** A list of users that will be ignored when checking for signatures. They are not required for the signature checks to pass. */
  ignoreList?: string[];
  preventSignatureInvalidation?: boolean;
  message?: {
    commit?: {
      /** Commit message when creating the storage file. */
      setup?: string;
      /** Commit message when adding new signatures.
      #### Variables:
       - `${signatory}`: signatory's login */
      signed?: string;
      /** Commit message when creating re-run storage file */
      reRunCreate?: string;
      /** Commit message when updating re-run storage file */
      reRunUpdate?: string;
    };
    /** Content of the bot's comment. */
    comment?: {
      /** When each committer has signed the document. */
      allSigned?: string;
      /** Usually a message thanking the committers and asking them to sign the document. */
      header?: string;
      /** A quick summary about the number of committers who signed.
      #### Variables:
       - `${signed}`: the number of committers who signed
       - `${total}`: the number of known committers */
      summary?: string;
      /** A warning when some committers do not have associated github accounts. */
      unknownWarning?: string;
      /** The footer of the message, with help on how to use the bot.
      #### Variables:
       - `${re-trigger}`: the re-trigger keyword */
      footer?: string;
    };
    /** The keyword to re-trigger signature checks. */
    reTrigger?: string;
  };
  labels?: {
    /** Added when each committer has signed the document. */
    signed?: string;
    /** Removed when each committer has signed the document. */
    unsigned?: string;
    /** Add this label to disable the bot on this PR. */
    ignore?: string;
    /** The label used to find the document form. */
    form?: string;
  };
}

export type ParsedOptions = Omit<
  DeepRequired<Options>,
  "githubToken" | "personalAccessToken"
>;
export let options: ParsedOptions;

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
      `Missing personal access token (https://github.com/settings/tokens/new) with "repo" scope. Add it as a secret named "PERSONAL_ACCESS_TOKEN" (https://github.com/settings/secrets/actions/new).`,
    );
  }
  if (opts.storage.form === "") {
    action.fail("Missing issue form path.");
  }
  initOctokit(opts.githubToken, opts.personalAccessToken);

  opts.storage.signatures ??= { type: "local" };
  if (opts.storage.signatures.type === "remote") {
    opts.storage.signatures.owner ??= context.repo.owner;
  }
  opts.storage.signatures.path ||=
    ".github/contributor-assistant/signatures.json";

  // storage.branch will defaults to the repository's default branch thanks to github API
  opts.storage.signatures.branch ||= undefined;

  opts.storage.reRun = {
    path: ".github/contributor-assistant/signatures-re-run-cache.json",
    ...removeEmpty(opts.storage.reRun),
  };

  opts.ignoreList ??= [];
  opts.preventSignatureInvalidation ??= false;

  opts.message = {
    commit: {
      setup: "Creating file to store signatures",
      signed: "New signature from @${signatory}",
      reRunCreate: "Creating re-run storage file",
      reRunUpdate: "Updating re-run storage",
      ...removeEmpty(opts.message?.commit),
    },
    comment: {
      allSigned: "All contributors have signed the CLA  ✍️ ✅",
      header:
        "Thank you for your submission, we appreciate it. Like many open-source projects, we ask you to sign our **Contributor License Agreement** before we can accept your contribution.",
      summary:
        "**${signed}** out of **${total}** committers have signed the document.",
      unknownWarning:
        "⚠ Some commits include work from users which have no associated github account. If those already have a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).",
      footer:
        "<sub>You can re-trigger this bot by commenting `${re-trigger}` in this Pull Request</sub>",
      ...removeEmpty(opts.message?.comment),
    },
    reTrigger: opts.message?.reTrigger || "recheck",
  };

  opts.labels = {
    signed: "",
    unsigned: "",
    ignore: "",
    form: "signature form",
    ...removeEmpty(opts.labels),
  };

  options = opts as ParsedOptions;
  action.debug("Parsed options", options);
}
