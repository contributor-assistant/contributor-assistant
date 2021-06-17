import { options } from "../options.ts";
import { Author } from "./commit.ts";

function escapeRegExp(string: string) {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  return (string && reRegExpChar.test(string))
    ? string.replace(RegExp(reRegExpChar.source), "\\$&")
    : string;
}

export function filterIgnored(committers: Author[]): Author[] {
  return committers.filter((committer) =>
    !options.ignoreList.some((pattern) => {
      pattern = pattern.trim();
      if (pattern.includes("*")) {
        const regex = escapeRegExp(pattern).split("\\*").join(".*");

        return new RegExp(regex).test(committer.name);
      }
      return pattern === committer;
    })
  );
}
