import { SignatureStatus } from "./types.ts";
import { action, context, generateCommentAnchor, pr } from "../../utils.ts";
import { applicationType } from "../meta.ts";
import { options } from "../options.ts";

const commentAnchor = generateCommentAnchor(applicationType);

export async function commentPR(status: SignatureStatus) {
  const comments = await pr.listComments();
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  if (botComment === undefined) {
    if (status.unsigned.length > 0 || status.unknown.length > 0) {
      await pr.createComment(createBody(status));
    } else {
      action.info("Everyone has already signed the CLA.");
    }
  } else {
    await pr.updateComment(botComment.id, createBody(status));
  }
}

export async function uncommentPR() {
  const comments = await pr.listComments();
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  if (botComment !== undefined) {
    await pr.deleteComment(botComment.id);
  }
}

function createBody(status: SignatureStatus): string {
  let body = `${commentAnchor}\n## Contributor Assistant | CLA\n`;
  const text = options.message.comment;
  const input = options.message.input;
  if (status.unsigned.length === 0 && status.unknown.length === 0) {
    return body + text.allSigned;
  }

  const committerCount = status.signed.length + status.unsigned.length;
  body += `${
    text.header.replace("${you}", committerCount > 1 ? "you all" : "you")
      .replace("${cla-path}", options.documentPath)
  }
  [Sign here](https://github.com/${context.repo.owner}/${context.repo.repo}/issues/new?template=cla.yml&labels=signature+form&title=License+Signature)
  `;

  if (committerCount > 1) {
    body += `${text.summary}\n`
      .replace("${signed}", status.signed.length.toString())
      .replace("${total}", committerCount.toString());
    for (const committer of status.signed) {
      body += `:white_check_mark: @${committer.user!.login}\n`;
    }
    for (const committer of status.unsigned) {
      body += `:x: @${committer.user!.login}\n`;
    }
  }

  if (status.unknown.length > 0) {
    for (const committer of status.unknown) {
      body += `:grey_question: ${committer.name} (${committer.email}) \n`;
    }
    body += `\n${text.unknownWarning}\n`;
  }

  return body + text.footer.replace("${re-trigger}", input.reTrigger);
}
