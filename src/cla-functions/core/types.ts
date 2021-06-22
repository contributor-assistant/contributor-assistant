import type { Author } from "./commit.ts";
import type { Storage } from "../../utils.ts";

export type { Author } from "./commit.ts";

export type AuthorSignature = Author & {
  prNumber: number;
};

export interface SignatureStatus {
  update: boolean;
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
