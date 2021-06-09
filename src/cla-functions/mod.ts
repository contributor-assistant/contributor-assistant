import { action, context, pr } from "../utils.ts";
import { ExitCode } from "./exit.ts";
import { setup } from "./setup.ts";
import { options, setupOptions } from "./options.ts";
import type { CLAOptions } from "./options.ts";

export default async function cla(rawOptions: CLAOptions) {
  action.info("Contributor Assistant: CLA process started");

  await setupOptions(rawOptions);

  try {
    if (
      context.payload.action === "closed" && options.lockPullRequestAfterMerge
    ) {
      return pr.lock();
    } else {
      await setup();
    }
  } catch (error) {
    action.debug(String(error.stack));
    action.fatal(String(error.message), ExitCode.FatalError);
  }
}
