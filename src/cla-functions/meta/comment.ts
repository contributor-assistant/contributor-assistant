import { SignatureStatus } from "../types.ts";
import { action, pr } from "../../utils.ts";
import { applicationType } from "./meta.ts";

const commentAnchor = `<!-- ${applicationType} comment anchor -->`;

export async function commentPR(
  comments: pr.Comments,
  status: SignatureStatus,
) {
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  if (botComment === undefined) {
    if (status.unsigned.length > 0 || status.unknown.length > 0) {
      pr.createComment(createBody(status));
    } else {
      action.info("no comment");
    }
  } else {
    pr.updateComment(botComment.id, createBody(status));
  }
}

function createBody(status: SignatureStatus): string {
  return "";
}
