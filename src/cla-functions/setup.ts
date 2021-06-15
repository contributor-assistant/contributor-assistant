import { filterIgnored } from "./meta/ignoreList.ts";
import { getCommitters } from "./meta/commit.ts";
import { checkStorageContent, pr } from "../utils.ts";
import { defaultContent, readStorage } from "./meta/storage.ts";
import { getSignatureStatus, updateSignatures } from "./meta/signatures.ts";
import { commentPR } from "./meta/comment.ts";

export async function setup() {
  let { content, sha } = await readStorage();
  content = checkStorageContent(content, defaultContent);

  const committers = filterIgnored(await getCommitters());

  const status = getSignatureStatus(committers, content.data);

  const comments = await pr.listComments();
  updateSignatures(comments, status, content.data);

  commentPR(comments, status)
  // writeStorage()
}
