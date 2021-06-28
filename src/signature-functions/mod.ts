import { getSignatureStatus } from "./core/signatures.ts";
import {
  defaultSignatureContent,
  readSignatureStorage,
} from "./core/storage.ts";
import {
  readReRunStorage,
  reRun,
  reRunRequired,
  writeReRunStorage,
} from "./core/re_run.ts";
import { filterIgnored } from "./core/ignore_list.ts";
import { getCommitters } from "./core/committers.ts";
import { commentPR, uncommentPR } from "./core/comment.ts";
import { hasIgnoreLabel, updateLabels } from "./core/labels.ts";
import {
  action,
  checkStorageContent,
  context,
  pr,
  spliceArray,
} from "../utils.ts";
import { options, setupOptions } from "./options.ts";
import type { CLAOptions } from "./options.ts";
import type { ReRunData } from "./core/types.ts";
import { isForm, processForm } from "./core/form.ts";

/** The entry point for the CLA Assistant */
export default async function cla(rawOptions: CLAOptions) {
  action.info("Contributor Assistant: CLA process started");

  setupOptions(rawOptions);

  try {
    if (context.eventName === "issues") {
      if (isForm()) {
        await processForm();
      }
    } else if (await hasIgnoreLabel()) {
      action.info(
        `CLA process skipped due to the "${options.labels.ignore}" label`,
      );
      await uncommentPR();
    } else if (reRunRequired()) {
      await reRun();
    } else {
      await run();
    }
  } catch (error) {
    action.debug(String(error.stack));
    action.fail(String(error.message));
  }
}

/** Fetch committers, update signatures, notify the result in a PR comment */
async function run() {
  const [{ content }, committers] = await Promise.all([
    readSignatureStorage(),
    getCommitters(),
  ]);
  checkStorageContent(content, defaultSignatureContent); // TODO

  const status = getSignatureStatus(filterIgnored(committers), content.data);
  action.debug("Signature status", status);

  const updateReRun = readReRunStorage().then((storage) => {
    const isCurrentWorkflow = (run: ReRunData[number]) =>
      run.pullRequest === context.issue.number;

    if (status.unsigned.length === 0) {
      spliceArray(storage.content, isCurrentWorkflow);
    } else {
      const run = storage.content.find(isCurrentWorkflow) ?? {
        pullRequest: context.issue.number,
        workflow: context.runId,
        unsigned: status.unsigned,
      };
      run.unsigned = status.unsigned;
    }

    return writeReRunStorage(storage);
  });

  await Promise.all([commentPR(status), updateLabels(status), updateReRun]);

  if (
    status.unsigned.length === 0 &&
    (status.signed.length > 1 || status.unknown.length === 0)
  ) {
    action.info(options.message.comment.allSigned);
  } else {
    action.fail(
      `Committers of Pull Request #${context.issue.number} have to sign the CLA 📝`,
    );
  }
}
