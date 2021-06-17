import { parseFlags } from "../deps.ts";
import { action } from "../utils.ts";
import cla from "./mod.ts";

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
  },
});

action.debug(Deno.inspect(flags));

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
  ignoreList: flags.ignoreList.split(/\s,\s/),
  lockPRAfterMerge: parseBoolean(flags.lockPrAfterMerge),
  message: {
    input: {
      signature: flags.inputSignature,
      reTrigger: flags.inputReTrigger,
    },
  },
});

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
