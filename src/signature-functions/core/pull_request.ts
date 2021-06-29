import {
  defaultSignatureContent,
  getSignatureStatus,
  readSignatureStorage,
} from "./signatures.ts";
import { updateReRun } from "./re_run.ts";
import { filterIgnored } from "./ignore_list.ts";
import { getCommitters } from "./committers.ts";
import { commentPR } from "./comment.ts";
import { updateLabels } from "./labels.ts";
import { action, context, storage } from "../../utils.ts";
import { options } from "../options.ts";

/** Fetch committers, update signatures, notify the result in a PR comment */
export async function updatePR() {
  const [{ content }, committers] = await Promise.all([
    readSignatureStorage(),
    getCommitters(),
  ]);
  storage.checkContent(content, defaultSignatureContent);

  const status = getSignatureStatus(filterIgnored(committers), content.data);
  action.debug("Signature status", status);

  await Promise.all([
    commentPR(status),
    updateLabels(status),
    updateReRun(status),
  ]);

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
