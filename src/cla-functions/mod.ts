import {
  getSignatureStatus,
  updateSignatures,
} from "./functions/signatures.ts";
import {
  defaultContent,
  readStorage,
  writeStorage,
} from "./functions/storage.ts";
import { reRun, reRunRequired } from "./functions/re_run.ts";
import { filterIgnored } from "./functions/ignore_list.ts";
import { getCommitters } from "./functions/commit.ts";
import { commentPR } from "./functions/comment.ts";
import { action, checkStorageContent, context, pr } from "../utils.ts";
import { options, setupOptions } from "./options.ts";
import type { CLAOptions } from "./options.ts";

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
    } else if (context.eventName === "issue_comment") {
      if (reRunRequired()) {
        await reRun();
      }
    } else {
      await run();
    }
  } catch (error) {
    action.debug(String(error.stack));
    action.fail(String(error.message));
  }
}

export async function run() {
  const storage = await readStorage();
  const { content } = storage;
  checkStorageContent(content, defaultContent);

  const committers = filterIgnored(await getCommitters());

  const status = getSignatureStatus(committers, content.data);

  const comments = await pr.listComments();
  updateSignatures(comments, status, content.data);

  await commentPR(comments, status, content.data);

  if (status.newSignatories) {
    await writeStorage(storage);
  }

  if (status.unsigned.length === 0) {
    action.info(options.message.comment.allSigned);
  } else {
    action.fail(
      `Committers of Pull Request #${context.issue.number} have to sign the CLA 📝`,
    );
  }
}
