import {
  filterSignatures,
  getSignatureStatus,
  readSignatureStorage,
} from "./signatures.ts";
import { updateReRun } from "./re_run.ts";
import { getCommitters } from "./committers.ts";
import { commentPR } from "./comment.ts";
import { updateLabels } from "./labels.ts";
import { action, context, storage } from "../../utils.ts";
import { options } from "../options.ts";
import { defaultSignatureContent } from "./default.ts";
import { readForm } from "./form.ts";

/** Fetch committers, update signatures, notify the result in a PR comment */
export async function updatePR() {
  const [{ content: signatureContent }, committers] = await Promise.all([
    readSignatureStorage(),
    getCommitters(),
  ]);
  // Error when fetching signature file and form at the same time
  const { content: rawForm } = await readForm();
  storage.checkContent(signatureContent, defaultSignatureContent);

  const status = getSignatureStatus(committers, signatureContent.data);
  await filterSignatures(status);
  action.debug("Signature status", status);

  await Promise.all([
    commentPR(status, rawForm),
    updateLabels(status),
    updateReRun(status),
  ]);

  if (
    status.unsigned.length === 0 &&
    (status.signed.length > 0 || status.unknown.length === 0)
  ) {
    action.info(options.message.comment.allSigned);
  } else {
    action.fail(
      `Committers of Pull Request #${context.issue.number} have to sign the document 📝`,
    );
  }
}
