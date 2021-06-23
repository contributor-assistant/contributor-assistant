import type {
  Author,
  AuthorSignature,
  CLAData,
  SignatureStatus,
} from "./types.ts";
import { context, normalizeText, pr, spliceArray } from "../../utils.ts";
import { options } from "../options.ts";

/** Filter committers with their signature status */
export function getSignatureStatus(
  authors: Author[],
  data: CLAData,
): SignatureStatus {
  return {
    update: false,
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

/** Browse comments and add new signatories to the storage file. */
export function updateSignatures(
  comments: pr.Comments,
  status: SignatureStatus,
  data: CLAData,
) {
  const signatureText = normalizeText(options.message.input.signature);
  const signedComments = comments.filter((comment) =>
    normalizeText(comment.body ?? "").startsWith(signatureText)
  );
  const signatureChecklist = [...status.signed].filter((author) =>
    author.user !== null
  );

  const isCommentAuthor = (comment: pr.Comments[number]) =>
    (author: Author) =>
      author.user !== null && author.user.databaseId === comment.user?.id;
  const hasCoAuthored = (authorId?: number) =>
    (coAuthor: Author) =>
      authorId !== undefined && coAuthor.user === null &&
      coAuthor.coAuthoredWith === authorId;
  const hasCoAuthoredSigned = (authorId?: number) =>
    (coAuthor: AuthorSignature) =>
      coAuthor.prNumber === context.payload.pull_request?.number &&
      hasCoAuthored(authorId)(coAuthor);

  for (const comment of signedComments) {
    for (const coAuthor of status.unsigned) {
      // if some committers don't have a Github account but co-authored with
      // the author of the comment, they sign on their behalf.
      if (hasCoAuthored(comment.user?.id)(coAuthor)) {
        status.update = true;
        const signatory = {
          ...coAuthor,
          prNumber: context.issue.number,
        };
        data.signatures.push(signatory);
        status.signed.push(signatory);
      }
    }
    spliceArray(status.unsigned, hasCoAuthored(comment.user?.id));

    // has the comment author signed the CLA ?
    const author = status.unsigned.find(isCommentAuthor(comment));
    if (author !== undefined) {
      status.update = true;
      const signatory = {
        ...author,
        prNumber: context.issue.number,
      };
      data.signatures.push(signatory);
      status.signed.push(signatory);
      spliceArray(status.unsigned, isCommentAuthor(comment));
    }

    // check for edited or removed comments
    spliceArray(signatureChecklist, isCommentAuthor(comment));
  }

  // these people have previously signed the CLA but have removed their signature
  for (const author of signatureChecklist) {
    status.update = true;
    // remove signatory from storage file
    spliceArray(
      data.signatures,
      (signatory) => signatory.user?.databaseId === author.user!.databaseId,
    );
    spliceArray(
      status.signed,
      (signatory) => signatory.user?.databaseId === author.user!.databaseId,
    );
    status.unsigned.push(author);
    // remove coAuthors
    for (const coAuthor of data.signatures) {
      if (hasCoAuthoredSigned(author.user!.databaseId)(coAuthor)) {
        status.unsigned.push(coAuthor);
      }
    }
    spliceArray(data.signatures, hasCoAuthoredSigned(author.user!.databaseId));
    spliceArray(status.signed, hasCoAuthoredSigned(author.user!.databaseId));
  }
}
