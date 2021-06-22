import { pr } from "../../utils.ts";
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
  if (options.labels.ignore === "") return false;
  const labels = await pr.getLabels();
  return labels.includes(options.labels.ignore);
}
