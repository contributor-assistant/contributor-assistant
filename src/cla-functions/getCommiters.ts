import {
  context,
  GH_ACTIONS_BOT_ID,
  personalOctokit,
  spliceArray,
} from "../utils.ts";
import type { GitActor, User, AuthorsResponse, CoAuthorsResponse } from "./graphql.ts";
import { authorsQuery, coAuthorsQuery } from "./graphql.ts";

export type Author =
  & Omit<GitActor, "user">
  & ({
    user: User;
  } | {
    user: null;
    coAuthoredWith?: number;
  });

export async function getCommitters(): Promise<Author[]> {
  const committers: Author[] = [];

  const variables = {
    owner: context.repo.owner,
    name: context.repo.repo,
    number: context.issue.number,
  };

  let commitCursor = "";
  let commitHasNextPage = false;
  do {
    const response: AuthorsResponse = await personalOctokit.graphql(
      authorsQuery,
      { ...variables, commitCursor },
    );
    const { commits } = response.repository.pullRequest;
    for (const edge of commits.edges) {
      let {
        cursor: commitCursor,
        node: {
          commit: {
            author,
            authors: {
              nodes: coAuthors,
              pageInfo: { endCursor: authorCursor },
            },
          },
        },
      } = edge;
      if (author.user?.databaseId === GH_ACTIONS_BOT_ID) continue;
      let authorHasNextPage = false;
      while (authorHasNextPage) {
        const response: CoAuthorsResponse = await personalOctokit.graphql(
          coAuthorsQuery,
          { ...variables, commitCursor, authorCursor },
        );
        const { nodes, pageInfo } =
          response.repository.pullRequest.commits.edges[0].node.commit.authors;
        coAuthors.push(...nodes);
        authorCursor = pageInfo.endCursor;
        authorHasNextPage = pageInfo.hasNextPage;
      }
      pushAuthor(author, coAuthors, committers);
    }
    commitCursor = commits.pageInfo.endCursor;
    commitHasNextPage = commits.pageInfo.hasNextPage;
  } while (commitHasNextPage);
  return committers;
}

function pushAuthor(
  author: GitActor,
  coAuthors: GitActor[],
  authors: Author[],
) {
  const isDifferent = (a: GitActor, b: GitActor) =>
    a.user !== null || a.name !== b.name && a.email !== b.email;
  const isAuthor = (a: GitActor) =>
    author.user?.databaseId === a.user?.databaseId;
  const isNew = (author: GitActor) =>
    authors.every((a) => a.user?.databaseId !== author.user?.databaseId);
  const exists = (a: GitActor) =>
    (b: GitActor) =>
      b.user === null && a.name === b.name &&
      a.email === b.email;

  if (author.user === null) {
    if (authors.every((a) => isDifferent(a, author))) {
      authors.push(author);
    }
  } else {
    if (isNew(author)) {
      authors.push(author);
    }
  }
  for (const coAuthor of coAuthors) {
    if (coAuthor.user === null) {
      spliceArray(authors, exists(coAuthor));
      if (isDifferent(author, coAuthor)) {
        authors.push({
          ...coAuthor,
          coAuthoredWith: author.user?.databaseId,
        });
      }
    } else {
      if (!isAuthor(coAuthor) && isNew(coAuthor)) {
        authors.push(coAuthor);
      }
    }
  }
}
