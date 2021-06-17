import { filterIgnored } from "./meta/ignore_list.ts";
import { getCommitters } from "./meta/commit.ts";
import { action, checkStorageContent, context, pr } from "../utils.ts";
import { defaultContent, readStorage, writeStorage } from "./meta/storage.ts";
import { getSignatureStatus, updateSignatures } from "./meta/signatures.ts";
import { commentPR } from "./meta/comment.ts";
import { options } from "./options.ts";

export async function setup() {
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
