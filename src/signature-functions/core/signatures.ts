import { action, context, github, json, storage } from "../../utils.ts";
import { options } from "../options.ts";
import { applicationType, storageVersion } from "../meta.ts";

import type { SignatureStorage } from "./types.ts";
import type { GitActor, SignatureData, SignatureStatus } from "./types.ts";

/** Filter committers with their signature status */
export function getSignatureStatus(
  authors: GitActor[],
  data: SignatureData,
): SignatureStatus {
  const status: SignatureStatus = {
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

export const defaultSignatureContent: SignatureStorage = {
  type: applicationType,
  version: storageVersion,
  data: {
    formSHA: "",
    form: { name: "", description: "", body: [] },
    signatures: [],
    superseded: [],
    invalidated: [],
  },
};

export type SignatureContent = github.Content<SignatureStorage>;

export async function readSignatureStorage(): Promise<SignatureContent> {
  switch (options.storage.signatures.type) {
    case "local":
    case "remote": {
      const { content, sha } = await storage.readGithub(
        options.storage.signatures,
        json.stringify(defaultSignatureContent),
        options.message.commit.setup,
      );
      return { content: JSON.parse(content), sha };
    }
    default:
      action.fail("Unknown storage type");
  }
}

export function writeSignatureStorage(content: SignatureContent) {
  switch (options.storage.signatures.type) {
    case "local":
    case "remote":
      return storage.writeGithub(
        {
          content: json.stringify(content.content),
          sha: content.sha,
        },
        options.storage.signatures,
        `${
          options.message.commit.signed
            .replace("${signatory}", context.payload.issue!.user.login)
        }. Closes #${context.issue.number}`,
      );
    default:
      action.fail("Unknown storage type");
  }
}
