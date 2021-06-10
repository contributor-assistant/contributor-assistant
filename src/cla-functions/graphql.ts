import { gql } from "../utils.ts";

export interface User {
  databaseId: number;
}

export interface GitActor {
  name: string;
  email: string;
  user: User | null;
}

const gitActorFragment = gql`
fragment gitActor on GitActor {
  name
  email
  user {
    databaseId
  }
}`;

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

const pageInfoFragment = gql`
fragment pageInfo on Commit {
  pageInfo {
    endCursor
    hasNextPage
  }
}`;

interface CoAuthors {
  nodes: GitActor[];
  pageInfo: PageInfo;
}

const coAuthorsFragment = gql`
fragment coAuthors on Commit {
  authors(first: $authorCount, after: $authorCursor) {
    nodes {
      ...gitActor
    }
    ...pageInfo
  }
}
${gitActorFragment}
${pageInfoFragment}`;

export interface AuthorsResponse {
  repository: {
    pullRequest: {
      commits: {
        edges: {
          cursor: string;
          node: {
            commit: {
              author: GitActor;
              authors: CoAuthors;
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
              author {
                ...gitActor
              }
              ...coAuthors
            }
          }
        }
        ...pageInfo
      }
    }
  }
}
${gitActorFragment}
${coAuthorsFragment}
${pageInfoFragment}`;

export interface CoAuthorsResponse {
  repository: {
    pullRequest: {
      commits: {
        edges: {
          node: {
            commit: {
              authors: CoAuthors;
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
              ...coAuthors
            }
          }
        }
      }
    }
  }
}
${coAuthorsFragment}`;
