import { options } from "../options.ts";
import type { GitActor } from "./types.ts";

function escapeRegExp(string: string) {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  return (string && reRegExpChar.test(string))
    ? string.replace(RegExp(reRegExpChar.source), "\\$&")
    : string;
}

/** "*" is treated as a wildcard. */
export function filterIgnored(committers: GitActor[]): GitActor[] {
  // TODO(@oagnexon): refactor & add more patterns
  return committers.filter((committer) =>
    !options.ignoreList.some((pattern) => {
      pattern = pattern.trim();
      if (pattern.includes("*")) {
        const regex = escapeRegExp(pattern).split("\\*").join(".*");

        return new RegExp(regex).test(committer.name);
      }
      return pattern === committer.name;
    })
  );
}
