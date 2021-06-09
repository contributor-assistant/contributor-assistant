/* ------ logging ------ */

export function debug(message: string) {
  issue("debug", message);
}

export function info(message: string) {
  console.log(escapeData(message));
}

export function warning(message: string) {
  issue("warning", message);
}

export function error(message: string) {
  issue("error", message);
}

export function fatal(message: string, exitCode: number): never {
  error(message);
  Deno.exit(exitCode);
}

const CMD_STRING = "::";

function issue(command: string, message = "") {
  command ||= "missing.command";
  console.log(`${CMD_STRING}${command}${CMD_STRING}${escapeData(message)}`);
}

function escapeData(s: string): string {
  return s
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
}
