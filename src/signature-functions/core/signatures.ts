import {
  action,
  context,
  github,
  json,
  personalOctokit,
  storage,
} from "../../utils.ts";
import { options } from "../options.ts";
import { defaultSignatureContent } from "./default.ts";
import { filterUsersQuery } from "./graphql.ts";

import type { FilterUsersResponse } from "./graphql.ts";
import type { SignatureStorage } from "./types.ts";
import type {
  GitActor,
  SignatureData,
  SignatureStatus,
  User,
} from "./types.ts";

/** Filter committers with their signature status */
export async function getSignatureStatus(
  authors: GitActor[],
  data: SignatureData,
): Promise<SignatureStatus> {
  const status: SignatureStatus = {
    signed: [],
    unsigned: [],
    unknown: [],
  };
  for (const author of authors) {
    if (author.user === null) {
      status.unknown.push(author);
    } else {
      const signed = data.current.signatures.some((signature) =>
        signature.user?.databaseId === author.user!.databaseId
      ) ||
        (options.preventSignatureInvalidation &&
          // add invalidated signatures
          data.invalidated.some((group) =>
            group.signatures.some((signature) =>
              signature.user?.databaseId === author.user!.databaseId
            )
          ));

      if (signed) {
        status.signed.push(author.user);
      } else {
        status.unsigned.push(author.user);
      }
    }
  }

  // Remove bots
  const users: FilterUsersResponse = await personalOctokit.graphql(
    filterUsersQuery,
    { ids: status.unsigned.map((user) => user.id) },
  );

  status.unsigned = users.nodes.filter((actor) => "id" in actor) as User[];

  return status;
}

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
