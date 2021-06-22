import { context, pr } from "../../utils.ts";
import { options } from "../options.ts";
import type { SignatureStatus } from "./types.ts";

export async function updateLabels(status: SignatureStatus) {
  if (status.unsigned.length === 0) {
    if (options.labels.signed !== "") {
      await pr.addLabels(options.labels.signed);
    }
  } else {
    if (options.labels.unsigned !== "") {
      await pr.addLabels(options.labels.unsigned);
    }
  }
}

export async function hasIgnoreLabel(): Promise<boolean> {
  if (options.labels.ignore === "" || ignoreLabelEvent()) return false;
  const labels = await pr.getLabels();
  return labels.includes(options.labels.ignore);
}

export function ignoreLabelEvent(): boolean {
  return context.eventName === "pull_request_target" &&
    ["labeled", "unlabeled"].includes(context.payload.action ?? "") &&
    context.payload.label?.name === options.labels.ignore;
}
