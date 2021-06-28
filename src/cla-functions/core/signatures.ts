import type {
  AuthorSignature,
  CLAData,
  GitActor,
  SignatureStatus,
} from "./types.ts";
import { context, normalizeText, pr, spliceArray } from "../../utils.ts";
import { options } from "../options.ts";

/** Filter committers with their signature status */
export function getSignatureStatus(
  authors: GitActor[],
  data: CLAData,
): SignatureStatus {
  const status: SignatureStatus = {
    update: false,
    signed: [],
    unsigned: [],
    unknown: [],
  };
  for (const author of authors) {
    if (author.user === null) {
      status.unknown.push(author);
    } else {
      const signed = data.signatures.some((signature) =>
        signature.user?.databaseId === author.user!.databaseId
      );
      if (signed) {
        status.signed.push(author);
      } else {
        status.unsigned.push(author);
      }
    }
  }
  return status;
}
