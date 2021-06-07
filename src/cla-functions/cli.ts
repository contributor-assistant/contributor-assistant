import { parseFlags } from "../cli-deps.ts";
import { setCallStatus } from "../utils/action.ts";
import { setup } from "./mod.ts";

setCallStatus("CLI");

const flags = parseFlags(Deno.args);

setup(
  Deno.env.get("GITHUB_TOKEN") ?? `${flags.githubToken}`,
  Deno.env.get("PERSONAL_ACCESS_TOKEN") ?? `${flags.personalAccessToken}`,
);
