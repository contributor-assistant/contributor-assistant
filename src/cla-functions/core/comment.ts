import { Author, CLAData, SignatureStatus } from "./types.ts";
import { action, generateCommentAnchor, pr } from "../../utils.ts";
import { applicationType } from "../meta.ts";
import { options } from "../options.ts";

const commentAnchor = generateCommentAnchor(applicationType);

export async function commentPR(
  comments: pr.Comments,
  status: SignatureStatus,
  data: CLAData,
) {
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  if (botComment === undefined) {
    if (status.unsigned.length > 0 || status.unknown.length > 0) {
      await pr.createComment(createBody(status, data));
    } else {
      action.info("Everyone has already signed the CLA.");
    }
  } else {
    await pr.updateComment(botComment.id, createBody(status, data));
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

interface unsignedByAuthor {
  author: Author;
  coAuthors: Set<Author>;
  needReSign?: boolean;
}

function createBody(status: SignatureStatus, data: CLAData): string {
  let body = `${commentAnchor}\n## Contributor Assistant | CLA\n`;
  const text = options.message.comment;
  const input = options.message.input;
  if (status.unsigned.length === 0 && status.unknown.length === 0) {
    return body + text.allSigned;
  }

  const committerCount = status.signed.length + status.unsigned.length;
  body += `${
    text.header.replace("${you}", committerCount > 1 ? "you all" : "you")
      .replace("${cla-path}", options.CLAPath)
  }
  - - -
  **${input.signature}**
  - - -
  `;

  let unknownCoAuthors = false;
  if (committerCount > 1) {
    body += `${text.summary}\n`
      .replace("${signed}", status.signed.length.toString())
      .replace("${total}", committerCount.toString());
    for (const committer of status.signed) {
      body += `:white_check_mark: `;
      if (committer.user !== null) {
        body += `@${committer.user.login}\n`;
      } else {
        body += `${committer.name} (${committer.email})\n`;
      }
    }

    const unsigned = new Map<number, unsignedByAuthor>();
    for (const committer of status.unsigned) {
      if (committer.user !== null) {
        unsigned.set(committer.user.databaseId, {
          author: committer,
          coAuthors: new Set(),
        });
      }
    }
    for (const committer of status.unsigned) {
      if (committer.user === null) {
        const commit = unsigned.get(committer.coAuthoredWith!);
        if (commit === undefined) {
          const author = data.signatures.find((author) =>
            author.user !== null &&
            author.user.databaseId === committer.coAuthoredWith
          );
          if (author === undefined) {
            action.warning("No author was found for this coAuthor.");
          } else {
            unsigned.set(author.user!.databaseId, {
              author,
              coAuthors: new Set([committer]),
              needReSign: true,
            });
          }
        } else {
          const { coAuthors } = commit;
          coAuthors.add(committer);
        }
      }
    }
    for (const [_, { author, coAuthors, needReSign }] of unsigned) {
      if (needReSign) {
        body += `:arrows_counterclockwise: @${
          author.user!.login
        } ${text.newSignature}`;
      } else {
        body += `:x: @${author.user!.login} `;
      }
      if (coAuthors.size > 0) {
        unknownCoAuthors = true;
        body += `${text.coAuthorWarning}\n`;
        for (const coAuthor of coAuthors) {
          body +=
            ` - :heavy_multiplication_x: ${coAuthor.name} (${coAuthor.email})\n`;
        }
      }
      body += "\n";
    }
  }

  if (status.unknown.length > 0 || unknownCoAuthors) {
    for (const committer of status.unknown) {
      body += `:grey_question: ${committer.name} (${committer.email}) \n`;
    }
    body += `\n${text.unknownWarning}\n`;
  }

  return body + text.footer.replace("${re-trigger}", input.reTrigger);
}