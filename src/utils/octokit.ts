import { Core, legacyRestEndpointMethods, paginateRest } from "../deps.ts";

export const Octokit = Core.plugin(legacyRestEndpointMethods, paginateRest);

export let octokit = new Octokit();
export let personalOctokit = new Octokit();

export function initOctokit(githubToken: string, personalAccessToken: string) {
  octokit.auth(githubToken);
  personalOctokit.auth(personalAccessToken);
}
