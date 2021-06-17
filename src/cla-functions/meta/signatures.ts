import type { Author, CLAData, SignatureStatus } from "../types.ts";
import { context, normalizeText, pr, spliceArray } from "../../utils.ts";
import { options } from "../options.ts";

export function getSignatureStatus(
  authors: Author[],
  data: CLAData,
): SignatureStatus {
  return {
    newSignatories: false,
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

export function updateSignatures(
  comments: pr.Comments,
  status: SignatureStatus,
  data: CLAData,
) {
  const signatureText = normalizeText(options.message.input.signature);
  const signed = comments.filter((comment) =>
    normalizeText(comment.body ?? "").match(signatureText)
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
        status.newSignatories = true;
        data.signatures.push({
          ...coAuthor,
          prNumber: context.issue.number,
        });
      }
    }
    spliceArray(status.unsigned, hasCoAuthored(comment.user?.id));

    const author = status.unsigned.find(isCommentAuthor(comment));
    if (author !== undefined) {
      status.newSignatories = true;
      spliceArray(status.unsigned, isCommentAuthor(comment));
      data.signatures.push({
        ...author,
        prNumber: context.issue.number,
      });
    }
  }
}
