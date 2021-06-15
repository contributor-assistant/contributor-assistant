import type { Author, CLAData, SignatureStatus } from "../types.ts";
import { context, pr, spliceArray } from "../../utils.ts";
import { options } from "../options.ts";

export function getSignatureStatus(authors: Author[], data: CLAData): SignatureStatus {
  return {
    signed: data.signatures.filter((signature) =>
      signature.prNumber === context.payload.pull_request?.number
    ),
    unsigned: authors.filter((author) =>
      author.user === null
        ? !data.signatures.some((signature) =>
          signature.name === author.name && signature.email === author.email &&
          signature.prNumber === context.payload.pull_request?.number
        )
        : !data.signatures.some((signature) =>
          signature.user?.databaseId === author.user.databaseId
        )
    ),
    unknown: authors.filter((author) =>
      author.user === null && author.coAuthoredWith === undefined
    ),
  };
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function updateSignatures(comments: pr.Comments, status: SignatureStatus, data: CLAData) {
  const signatureText = normalize(options.message.comment.sign);
  const signed = comments.filter((comment) =>
    normalize(comment.body ?? "") === signatureText
  );

  const isCommentAuthor = (comment: pr.Comments[number]) =>
    (author: Author) =>
      author.user !== null && author.user.databaseId === comment.user?.id;
  const hasCoAuthored = (authorId?: number) =>
    (coAuthor: Author) =>
      authorId !== undefined && coAuthor.user === null &&
      coAuthor.coAuthoredWith === authorId;

  for (const comment of signed) {
    for (const coAuthor of status.unsigned) {
      if (hasCoAuthored(comment.user?.id)(coAuthor)) {
        data.signatures.push({
          ...coAuthor,
          prNumber: context.issue.number,
        });
      }
    }
    spliceArray(status.unsigned, hasCoAuthored(comment.user?.id));

    const author = status.unsigned.find(isCommentAuthor(comment));
    if (author !== undefined) {
      spliceArray(status.unsigned, isCommentAuthor(comment));
      data.signatures.push({
        ...author,
        prNumber: context.issue.number,
      });
    }
  }
}
