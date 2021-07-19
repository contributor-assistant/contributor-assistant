import {
  action,
  context,
  escapeRegExp,
  github,
  json,
  personalOctokit,
  storage,
} from "../../utils.ts";
import { options } from "../options.ts";
import { defaultSignatureContent } from "./default.ts";
import { filterUsersQuery, permissionQuery } from "./graphql.ts";

import type { FilterUsersResponse, PermissionResponse } from "./graphql.ts";
import type {
  GitActor,
  SignatureData,
  SignatureStatus,
  SignatureStorage,
  User,
} from "./types.ts";

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

  return status;
}

/** "*" is treated as a wildcard. */
export function filterIgnored(committers: GitActor[]): GitActor[] {
  return committers.filter((committer) =>
    !options.ignoreList.some((pattern) => {
      pattern = pattern.trim();
      if (pattern.includes("*")) {
        const regex = escapeRegExp(pattern).split("\\*").join(".*");

        return new RegExp(regex).test(committer.name);
      }
      return pattern === committer.name;
    })
  );
}

enum AccessLevel {
  UNSET,
  ADMIN,
  MAINTAINER,
  CONTRIBUTOR,
}

/** Remove bots & apply ignore list */
export async function filterSignatures(status: SignatureStatus) {
  const patterns: RegExp[] = [];
  let accessLevel: AccessLevel = AccessLevel.UNSET;

  for (let pattern of options.ignoreList) {
    pattern = pattern.trim();
    if (pattern.startsWith("@")) {
      pattern = pattern.substring(1);
      if (pattern in AccessLevel && isNaN(parseInt(pattern))) {
        accessLevel = Math.max(
          accessLevel,
          AccessLevel[pattern as keyof typeof AccessLevel],
        );
      } else {
        action.fail(
          `Incorrect access level pattern: ${pattern}. Accepted patterns`,
        );
      }
    } else {
      patterns.push(
        new RegExp(
          pattern.match(/^\/.*\/$/)
            ? // treat the pattern as a regex
              pattern.slice(1, -1)
            : // otherwise, escape everything
              `^${escapeRegExp(pattern)}$`,
        ),
      );
    }
  }

  // Remove bots
  const users: FilterUsersResponse = await personalOctokit.graphql(
    filterUsersQuery,
    { ids: status.unsigned.map((user) => user.id) },
  );

  status.unsigned = (users.nodes
    .filter((actor) => "id" in actor) as User[])
    .filter((actor) => !patterns.some((pattern) => pattern.test(actor.login)));

  // remove authorized actors
  if (accessLevel !== AccessLevel.UNSET) {
    const permissions = await Promise.all(
      status.unsigned.map((actor) =>
        personalOctokit.graphql(
          permissionQuery,
          { ...context.repo, login: actor.login },
        ) as Promise<PermissionResponse>
      ),
    );
    status.unsigned = status.unsigned.filter((actor, i) => {
      const response = permissions[i].repository.collaborators.edges[0];
      if (response.node.login !== actor.login) return true;
      return !(accessLevel >= AccessLevel.ADMIN &&
          response.permission === "ADMIN" ||
        accessLevel >= AccessLevel.MAINTAINER &&
          response.permission === "MAINTAIN" ||
        accessLevel >= AccessLevel.CONTRIBUTOR &&
          response.permission === "WRITE");
    });
  }

  status.unknown = status.unknown
    .filter((actor) => !patterns.some((pattern) => pattern.test(actor.name)));
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
