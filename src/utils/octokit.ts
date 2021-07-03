import { Core, paginateRest, restEndpointMethods } from "../deps.ts";

export const Octokit = Core.plugin(restEndpointMethods, paginateRest);

export let octokit = new Octokit();
export let personalOctokit = new Octokit();

export function initOctokit(githubToken: string, personalAccessToken: string) {
  octokit = new Octokit({ auth: githubToken });
  personalOctokit = new Octokit({ auth: personalAccessToken });
}
