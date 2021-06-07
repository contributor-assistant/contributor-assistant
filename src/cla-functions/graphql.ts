import { join } from "../deps.ts";
import { octokit } from "../utils/octokit.ts";
import { readQuery } from "../utils/graphql.ts";

export default async function getCommitters() /* : Promise<CommittersDetails[]> */ {
  const query = await readQuery(join(import.meta.url, "./getCommitters.gql"));

  const response: any = await octokit.graphql(query, {
    owner: context.repo.owner,
    name: context.repo.repo,
    number: context.issue.number,
    cursor: "",
  });

  let committers: CommittersDetails[] = [];
  let filteredCommitters: CommittersDetails[] = [];

  response.repository.pullRequest.commits.edges.forEach((edge) => {
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
