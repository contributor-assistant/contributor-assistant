import { CommittersDetails } from "./interfaces.ts";

function escapeRegExp(string: string) {
    const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    return (string && reRegExpChar.test(string))
      ? string.replace(RegExp(reRegExpChar.source), '\\$&')
      : string;
  }

function isUserNotInAllowList(committer: string, allowList: string[]): boolean {
  return allowList.filter((pattern) => {
    pattern = pattern.trim();
    if (pattern.includes("*")) {
      const regex = escapeRegExp(pattern).split("\\*").join(".*");

      return new RegExp(regex).test(committer);
    }
    return pattern === committer;
  }).length > 0;
}

export function checkAllowList(
  committers: CommittersDetails[],
  allowList: string[],
): CommittersDetails[] {
  return committers.filter(
    (committer) =>
      committer &&
      !(isUserNotInAllowList !== undefined &&
        isUserNotInAllowList(committer.name, allowList))
  );
}
