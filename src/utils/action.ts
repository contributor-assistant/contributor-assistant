import { exists } from "../deps.ts";
import { readJson } from "../utils/json.ts";
/**
 * Why this file ?
 * @actions/core is not available under Deno, because node:os can't be polyfilled.
 * https://cdn.skypack.dev/error/node:node:os?from=@actions/core
 */

/* ------ setup ------ */

type CallStatus = "CLI" | "Module";
export let callStatus: CallStatus = "Module";

export function setCallStatus(status: CallStatus) {
  callStatus = status;
}

/* ------ context ------ */

export async function repo(): Promise<{
  owner: string;
  repo: string;
}> {
  const repository = Deno.env.get("GITHUB_REPOSITORY");
  if (repository) {
    const [owner, repo] = repository.split("/");
    return { owner, repo };
  }
  const eventPath = Deno.env.get("GITHUB_EVENT_PATH");
  if (eventPath) {
    if (await exists(eventPath)) {
      const payload: any = await readJson(eventPath);
      return {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      };
    } else {
      warning(`GITHUB_EVENT_PATH ${eventPath} does not exist`);
    }
  }
  fatal(
    -1,
    "context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'",
  );
}

/* ------ logging ------ */

export function info(message: string): void {
  if (callStatus === "CLI") {
    console.log(escapeData(message));
  }
}

export function warning(message: string): void {
  if (callStatus === "CLI") {
    issue("warning", message);
  }
}

export function error(message: string): void {
  if (callStatus === "CLI") {
    issue("error", message);
  }
}

export function fatal(
  exitCode: number,
  message: string,
  CLIMessage = "",
): never {
  if (callStatus === "CLI") {
    error(`${message} ${CLIMessage}`);
    Deno.exit(exitCode);
  }
  throw new Error(message);
}

const CMD_STRING = "::";

function issue(command: string, message = ""): void {
  command ||= "missing.command";
  console.log(`${CMD_STRING}${command}${CMD_STRING}${escapeData(message)}`);
}

function escapeData(s: string): string {
  return s
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
}
