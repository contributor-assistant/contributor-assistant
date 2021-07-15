import { parseFlags } from "../deps.ts";
import { action, parseBoolean, pipeConfig } from "../utils.ts";
import { defaultConfigContent } from "./core/default.ts";
import main from "./mod.ts";

/** This file is the entry point for the action */

const flags = parseFlags(Deno.args, {
  string: [
    "githubToken",
    "personalAccessToken",
    "configRemoteRepo",
    "configRemoteOwner",
    "configBranch",
    "configPath",
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
    configRemoteRepo: "",
    configRemoteOwner: "",
    configBranch: "",
    configPath: "",
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

if (flags.configPath !== "") {
  await pipeConfig(flags, defaultConfigContent, (data) => main(data));
} else {
  await main({
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
    preventSignatureInvalidation: parseBoolean(
      flags.preventSignatureInvalidation,
    ),
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
}
