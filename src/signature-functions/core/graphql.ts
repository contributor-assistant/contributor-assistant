import { gql } from "../../utils.ts";

export interface User {
  databaseId: number;
  login: string;
  id: string;
}

const userFragment = gql`
fragment user on User {
  databaseId
  login
  id
}`;

export interface GitActor {
  name: string;
  email: string;
  user: User | null;
}

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

interface Authors {
  nodes: GitActor[];
  pageInfo: PageInfo;
}

const authorsFragment = gql`
fragment authors on Commit {
  authors(first: $authorCount, after: $authorCursor) {
    nodes {
      name
      email
      user {
      ...user
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
${userFragment}`;

export interface AuthorsResponse {
  repository: {
    pullRequest: {
      commits: {
        edges: {
          cursor: string;
          node: {
            commit: {
              authors: Authors;
            };
          };
        }[];
        pageInfo: PageInfo;
      };
    };
  };
}

export const authorsQuery = gql`
query getAuthors($owner: String!, $name: String!, $number: Int!, $commitCursor: String = "", $authorCursor: String = "", $commitCount: Int = 100, $authorCount: Int = 10) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      commits(first: $commitCount, after: $commitCursor) {
        edges {
          cursor
          node {
            commit {
              ...authors
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
}
${authorsFragment}`;

export interface CoAuthorsResponse {
  repository: {
    pullRequest: {
      commits: {
        edges: {
          node: {
            commit: {
              authors: Authors;
            };
          };
        }[];
      };
    };
  };
}

export const coAuthorsQuery = gql`
query getCoAuthors($owner: String!, $name: String!, $number: Int!, $commitCursor: String!, $authorCount: Int = 100) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      commits(first: 1, after: $commitCursor) {
        edges {
          node {
            commit {
              ...authors
            }
          }
        }
      }
    }
  }
}
${authorsFragment}`;

export interface FilterUsersResponse {
  // https://github.com/denoland/deno_lint/issues/774
  nodes: (User | { _: unknown })[];
}

/** Need to perform another query to distinguish between bots and users
  https://github.community/t/gitactor-user-should-be-type-actor-not-user-cannot-distinguish-between-bots-users-otherwise/14559/2 */
export const filterUsersQuery = gql`
query filterUsers($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on User {
      ...user
    }
  }
}
${userFragment}`;
