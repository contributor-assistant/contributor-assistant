import { context, GH_ACTIONS_BOT_ID, personalOctokit } from "../../utils.ts";
import { authorsQuery, coAuthorsQuery } from "./graphql.ts";
import type {
  AuthorsResponse,
  CoAuthorsResponse,
  GitActor,
} from "./graphql.ts";

/** Get authors of every commit from the current PR */
export async function getCommitters(): Promise<GitActor[]> {
  const committers: GitActor[] = [];

  const variables = {
    owner: context.repo.owner,
    name: context.repo.repo,
    number: context.issue.number,
  };

  let commitCursor = "";
  let commitHasNextPage = false;
  // loop through authors
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
            authors: {
              nodes: authors,
              pageInfo: { endCursor: authorCursor },
            },
          },
        },
      } = edge;
      let authorHasNextPage = false;
      // loop through co-authors
      while (authorHasNextPage) {
        const response: CoAuthorsResponse = await personalOctokit.graphql(
          coAuthorsQuery,
          { ...variables, commitCursor, authorCursor },
        );
        const { nodes, pageInfo } =
          response.repository.pullRequest.commits.edges[0].node.commit.authors;
        authors.push(...nodes);
        authorCursor = pageInfo.endCursor;
        authorHasNextPage = pageInfo.hasNextPage;
      }
      pushAuthors(authors, committers);
    }
    commitCursor = commits.pageInfo.endCursor;
    commitHasNextPage = commits.pageInfo.hasNextPage;
  } while (commitHasNextPage);
  return committers;
}

/** Check for duplicates */
function pushAuthors(authors: GitActor[], committers: GitActor[]) {
  const isDifferent = (a: GitActor, b: GitActor) =>
    a.user !== null || a.name !== b.name && a.email !== b.email;
  const isNew = (author: GitActor) =>
    committers.every((a) => a.user?.databaseId !== author.user?.databaseId);

  for (const author of authors) {
    if (author.user?.databaseId === GH_ACTIONS_BOT_ID) continue;
    if (author.user === null) {
      if (committers.every((a) => isDifferent(a, author))) {
        committers.push(author);
      }
    } else {
      if (isNew(author)) {
        committers.push(author);
      }
    }
  }
}
