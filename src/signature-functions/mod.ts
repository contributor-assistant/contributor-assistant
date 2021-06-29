import { reRun, reRunRequired } from "./core/re_run.ts";
import { uncommentPR } from "./core/comment.ts";
import { hasIgnoreLabel } from "./core/labels.ts";
import { action, context } from "../utils.ts";
import { options, setupOptions } from "./options.ts";
import { isForm, processForm } from "./core/form.ts";
import { updatePR } from "./core/pull_request.ts";
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
      await uncommentPR();
    } else if (reRunRequired()) {
      await reRun();
    } else {
      await updatePR();
    }
  } catch (error) {
    action.debug(String(error.stack));
    action.fail(String(error.message));
  }
}
