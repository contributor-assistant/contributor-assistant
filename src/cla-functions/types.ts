import type { Author } from "./functions/commit.ts";
import type { Storage } from "../utils.ts";

export type { Author } from "./functions/commit.ts";

export type AuthorSignature = Author & {
  prNumber: number;
};

export interface SignatureStatus {
  newSignatories: boolean;
  signed: AuthorSignature[];
  unsigned: Author[];
  unknown: Author[];
}

export interface CLAData {
  signatures: AuthorSignature[];
}

export interface CLAStorage extends Storage {
  data: CLAData;
}
