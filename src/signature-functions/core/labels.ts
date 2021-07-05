import { action, context, octokit, pr } from "../../utils.ts";
import { options } from "../options.ts";
import type { SignatureStatus } from "./types.ts";

/** Add / remove signed and unsigned labels according to the signature status */
export async function updateLabels(status: SignatureStatus) {
  const labels = await pr.getLabels();
  const { signed, unsigned } = options.labels;

  if (status.unsigned.length === 0) {
    if (signed !== "" && !labels.includes(signed)) {
      await pr.addLabels(signed);
      if (unsigned !== "" && labels.includes(unsigned)) {
        await pr.removeLabel(unsigned);
      }
    }
  } else {
    if (unsigned !== "" && !labels.includes(unsigned)) {
      await pr.addLabels(unsigned);
      if (signed !== "" && labels.includes(signed)) {
        await pr.removeLabel(signed);
      }
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

/** Automatically create the signature label */
export async function createSignatureLabel() {
  await octokit.rest.issues.createLabel({
    ...context.repo,
    name: options.labels.form,
    description: "A document signature",
  }).catch((error) => {
    if (error.code !== "already_exists") {
      action.fail(
        `The "${options.labels.form}" label couldn't be added automatically. Please add it manually.`,
      );
    }
  });
}
