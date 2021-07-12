import { defaultSignatureContent } from "../../core/default.ts";
import type { Form, SignatureStorage } from "../../core/types.ts";
import type { CustomField } from "../../core/form.ts";

export type { Form } from "../../core/types.ts";

export interface OutdatedSignature {
  name: string;
  id: number;
  pullRequestNo?: number;
  "created_at"?: string;
  "updated_at"?: string;
  "comment_id"?: number;
  body?: string;
  repoId?: string;
}

export interface OutdatedStorage {
  signedContributors: OutdatedSignature[];
}

export interface Repository {
  owner: string;
  repo: string;
}

export default function convert(
  outdated: OutdatedStorage,
  repository: Repository = { owner: "", repo: "" },
  form?: Form,
): SignatureStorage {
  // deep copy
  const signatures: SignatureStorage = JSON.parse(
    JSON.stringify(defaultSignatureContent),
  );

  let fields: CustomField[] = [[true]];
  if (form !== undefined) {
    fields = [];
    for (const input of form.body) {
      if (input.type !== "markdown") {
        fields.push(input.id === "signature" ? [true] : null);
      }
    }
  }

  for (const signature of outdated.signedContributors) {
    signatures.data.current.signatures.push({
      user: {
        databaseId: signature.id,
        login: signature.name,
      },
      ...repository,
      issue: 0,
      date: signature.created_at ?? new Date().toJSON(),
      fields,
    });
  }

  return signatures;
}
