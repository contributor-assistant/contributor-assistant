import { parseFlags } from "../cli-deps.ts";
import cla from "./mod.ts";

const flags = parseFlags(Deno.args);

cla({
  ...flags, // TODO: sanitize inputs
  githubToken: String(flags._[0] ?? ""),
  personalAccessToken: String(flags._[1] ?? ""),
  branch: typeof flags.branch === "string" ? flags.branch : undefined,
});
