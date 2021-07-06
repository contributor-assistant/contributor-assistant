import { reRun, reRunRequired } from "./core/re_run.ts";
import { uncommentPR } from "./core/comment.ts";
import { hasIgnoreLabel } from "./core/labels.ts";
import { action, context } from "../utils.ts";
import { options, setupOptions } from "./options.ts";
import { isForm, processForm } from "./core/form.ts";
import { updatePR } from "./core/pull_request.ts";
import { clearReRun } from "./core/re_run.ts";
import type { Options } from "./options.ts";

/** The entry point for the Signature Assistant */
export default async function main(rawOptions: Options) {
  action.info("Contributor Assistant: Signature process started");

  setupOptions(rawOptions);

  try {
    if (context.eventName === "issues") {
      if (isForm()) {
        await processForm();
      }
    } else if (await hasIgnoreLabel()) {
      action.info(
        `Signature process skipped due to the "${options.labels.ignore}" label`,
      );
      await Promise.all([uncommentPR(), clearReRun()]);
    } else if (reRunRequired()) {
      await reRun();
    } else if (context.payload.action === "closed") {
      await clearReRun();
    } else {
      await updatePR();
    }
  } catch (error) {
    action.error("An unexpected error occurred.");
    action.debug(String(error.stack));
    action.error(String(error.message));
    action.info(
      "If you think this is a bug, please open a bug report at https://github.com/cla-assistant/contributor-assistant/issues/new/choose",
    );
    action.info(
      "Visit https://github.com/cla-assistant/contributor-assistant/blob/main/actions/signatures/README.md for documentation about this action.",
    );
    Deno.exit(1);
  }
}
