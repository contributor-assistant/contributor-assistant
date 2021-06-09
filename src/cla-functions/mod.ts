import { action, context, pr } from "../utils.ts";
import { ExitCode } from "./exit.ts";
import { setup } from "./setup.ts";
import type { CLAOptions } from "./options.ts";

export default async function cla(options: CLAOptions) {
  action.info("Contributor Assistant: CLA process started");

  try { 
    if (context.payload.action === 'closed' && options.lockPullRequestAfterMerge) {
      return pr.lock()
    } else {
      await setup(options);
    }
  } catch (error) {
    action.fatal(String(error.message), ExitCode.FatalError)
  }
}
