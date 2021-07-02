import { parseFlags } from "../deps.ts";
import { action } from "../utils.ts";
import main from "./mod.ts";

/** This file is the entry point for the action */

const flags = parseFlags(Deno.args, {
  string: [
    "githubToken",
    "personalAccessToken",
    "signatureRemoteRepo",
    "signatureRemoteOwner",
    "signatureBranch",
    "signaturePath",
    "reRunBranch",
    "reRunPath",
    "formPath",
    "ignoreList",
    "reTrigger",
    "allSignedComment",
    "commentHeader",
    "signedLabel",
    "unsignedLabel",
    "ignoreLabel",
    "formLabel",
  ],
  default: {
    githubToken: "",
    personalAccessToken: "",
    signatureRemoteRepo: "",
    signatureRemoteOwner: "",
    signatureBranch: "",
    signaturePath: "",
    reRunPath: "",
    reRunBranch: "",
    formPath: "",
    ignoreList: "",
    reTrigger: "",
    allSignedComment: "",
    commentHeader: "",
    signedLabel: "",
    unsignedLabel: "",
    ignoreLabel: "",
    formLabel: "",
  },
});

action.debug("Flags", flags);

main({
  githubToken: flags.githubToken,
  personalAccessToken: flags.personalAccessToken,
  storage: {
    signatures: flags.signatureRemoteRepo.length > 0
      ? {
        type: "remote",
        repo: flags.signatureRemoteRepo,
        owner: flags.signatureRemoteOwner,
        branch: flags.signatureBranch,
        path: flags.signaturePath,
      }
      : {
        type: "local",
        branch: flags.signatureBranch,
        path: flags.signaturePath,
      },
    reRun: {
      branch: flags.reRunBranch,
      path: flags.reRunPath,
    },
    form: flags.formPath,
  },
  ignoreList: flags.ignoreList.split(/\s,\s/),
  message: {
    comment: {
      allSigned: flags.allSignedComment,
      header: flags.commentHeader,
    },
    reTrigger: flags.reTrigger,
  },
  labels: {
    signed: flags.signedLabel,
    unsigned: flags.unsignedLabel,
    ignore: flags.ignoreLabel,
    form: flags.formLabel,
  },
});
