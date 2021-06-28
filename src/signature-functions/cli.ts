import { parseFlags } from "../deps.ts";
import { action } from "../utils.ts";
import cla from "./mod.ts";

/** This file is the entry point for the action */

const flags = parseFlags(Deno.args, {
  string: [
    "githubToken",
    "personalAccessToken",
    "CLAPath",
    "storageRemoteRepo",
    "storageRemoteOwner",
    "storageBranch",
    "storagePath",
    "ignoreList",
    "inputSignature",
    "inputReTrigger",
    "signedLabel",
    "unsignedLabel",
    "ignoreLabel",
  ],
  default: {
    githubToken: "",
    personalAccessToken: "",
    CLAPath: "",
    storageRemoteRepo: "",
    storageRemoteOwner: "",
    storageBranch: "",
    storagePath: "",
    ignoreList: "",
    inputSignature: "",
    inputReTrigger: "",
    signedLabel: "",
    unsignedLabel: "",
    ignoreLabel: "",
  },
});

action.debug("Flags", flags);

cla({
  githubToken: flags.githubToken,
  personalAccessToken: flags.personalAccessToken,
  CLAPath: flags.CLAPath,
  storage: flags.storageRemoteRepo.length > 0
    ? {
      type: "remote-github",
      repo: flags.storageRemoteRepo,
      owner: flags.storageRemoteOwner,
      branch: flags.storageBranch,
      path: flags.storagePath,
    }
    : {
      type: "local",
      branch: flags.storageBranch,
      path: flags.storagePath,
    },
  reRun: {
    branch: flags.reRunBranch,
    path: flags.reRunPath /// TODO: move to storage object
  },
  ignoreList: flags.ignoreList.split(/\s,\s/),
  message: {
    input: {
      signature: flags.inputSignature,
      reTrigger: flags.inputReTrigger,
    },
  },
  labels: {
    signed: flags.signedLabel,
    unsigned: flags.unsignedLabel,
    ignore: flags.ignoreLabel,
  },
});

/** Boolean parser: github actions inputs cannot have a boolean value */
function parseBoolean(flag: unknown): boolean | undefined {
  switch (flag) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return undefined;
  }
}
