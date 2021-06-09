import { parseFlags } from "../cli-deps.ts";
import cla from "./mod.ts";

const flags = parseFlags(Deno.args);

cla({
  githubToken: flags.githubToken ?? "",
  personalAccessToken: flags.personalAccessToken ?? "",
  ...flags, // TODO: sanitize inputs
});
