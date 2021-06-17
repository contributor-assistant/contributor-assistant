import { parseFlags } from "../deps.ts";
import cla from "./mod.ts";

const flags = parseFlags(Deno.args);

function parseString(flag: unknown): string | undefined {
  return typeof flag === "string" ? flag : undefined;
}

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

cla({
  githubToken: parseString(flags.githubToken) ?? "",
  personalAccessToken: parseString(flags.personalAccessToken) ?? "",
  CLAPath: parseString(flags.claPath) ?? "",
  storage: typeof flags.storageRemoteRepo === "string"
    ? {
      type: "remote-github",
      repo: flags.storageRemoteRepo,
      owner: parseString(flags.storageRemoteOwner),
      branch: parseString(flags.storageBranch),
      path: parseString(flags.storagePath),
    }
    : {
      type: "local",
      branch: parseString(flags.storageBranch),
      path: parseString(flags.storagePath),
    },
  ignoreList: parseString(flags.ignoreList)?.split(/\s,\s/),
  lockPRAfterMerge: parseBoolean(flags.lockPrAfterMerge),
  message: {
    input: {
      signature: parseString(flags.inputSignature),
      reTrigger: parseString(flags.inputReTrigger),
    },
  },
});
