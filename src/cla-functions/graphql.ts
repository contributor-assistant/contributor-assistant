import { context, personalOctokit } from "../utils.ts";
import { CommittersDetails } from "./interfaces.ts";

const query = `
query($owner:String! $name:String! $number:Int! $cursor:String!) {
  repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
          commits(first: 100, after: $cursor) {
              totalCount
              edges {
                  node {
                      commit {
                          author {
                              email
                              name
                              user {
                                  id
                                  databaseId
                                  login
                              }
                          }
                          committer {
                              name
                              user {
                                  id
                                  databaseId
                                  login
                              }
                          }
                      }
                  }
                  cursor
              }
              pageInfo {
                  endCursor
                  hasNextPage
              }
          }
      }
  }
}`

export async function getCommitters(): Promise<CommittersDetails[]> {
  const response: any = await personalOctokit.graphql(query.replace(/( |\t)/g, ""), {
    owner: context.repo.owner,
    name: context.repo.repo,
    number: context.issue.number,
    cursor: "",
  });

  const committers: CommittersDetails[] = [];
  let filteredCommitters: CommittersDetails[] = [];

  response.repository.pullRequest.commits.edges.forEach((edge: any) => {
    const committer = extractUserFromCommit(edge.node.commit);
    let user = {
      name: committer.login || committer.name,
      id: committer.databaseId || "",
      pullRequestNo: context.issue.number,
    };
    if (
      committers.length === 0 || committers.map((c) => {
          return c.name;
        }).indexOf(user.name) < 0
    ) {
      committers.push(user);
    }
  });
  filteredCommitters = committers.filter((committer) => {
    return committer.id !== 41898282;
  });
  return filteredCommitters;
}

function extractUserFromCommit(commit: any): any {
  return commit.author.user || commit.committer.user || commit.author ||
    commit.committer;
}
