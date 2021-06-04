type CallStatus = "CLI" | "Module";
export let callStatus: CallStatus = "Module";

export function setCallStatus(status: CallStatus) {
  callStatus = status;
}

export function info(message: string) {
  if (callStatus === "CLI") {
    console.log(escapeData(message));
  }
}

export function warning(message: string) {
  if (callStatus === "CLI") {
    issue("warning", message);
  }
}

export function error(message: string) {
  if (callStatus === "CLI") {
    issue("error", message);
  }
}

export function fatal(exitCode: number, message: string, CLIMessage = "") {
  if (callStatus === "CLI") {
    error(`${message} ${CLIMessage}`);
    Deno.exit(exitCode);
  }
  throw new Error(message);
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
