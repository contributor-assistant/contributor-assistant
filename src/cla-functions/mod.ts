import { action, context, pr } from "../utils.ts";
import { options, setupOptions } from "./options.ts";
import type { CLAOptions } from "./options.ts";
import { setup } from "./setup.ts";
import { reRun, reRunRequired } from "./meta/re_run.ts";

export default async function cla(rawOptions: CLAOptions) {
  action.info("Contributor Assistant: CLA process started");

  setupOptions(rawOptions);

  try {
    if (
      context.payload.action === "closed" && options.lockPRAfterMerge
    ) {
      action.info(
        "Locking the Pull Request to safe guard the Pull Request CLA Signatures",
      );
      await pr.lock();
    } else if (reRunRequired()) {
      await reRun();
    } else {
      await setup();
    }
  } catch (error) {
    action.debug(String(error.stack));
    action.fail(String(error.message));
  }
}
