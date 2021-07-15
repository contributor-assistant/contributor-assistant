import { Core, paginateRest, restEndpointMethods } from "../deps.ts";
import * as action from "./action.ts";
import type { UnpackConstructor } from "./types.ts";

export const Octokit = Core.plugin(restEndpointMethods, paginateRest);

export let octokit = new Octokit();
export let personalOctokit = new Octokit();

export type OctokitConstructor = UnpackConstructor<typeof Octokit>;

export function initOctokit(githubToken: string, personalAccessToken: string) {
  octokit = new Octokit({ auth: githubToken });
  personalOctokit = new Octokit({ auth: personalAccessToken });
}

export function setupOctokit(githubToken = "", personalAccessToken = "") {
  githubToken ||= Deno.env.get("GITHUB_TOKEN") ?? "";
  personalAccessToken ||= Deno.env.get("PERSONAL_ACCESS_TOKEN") ?? "";

  if (githubToken === "") {
    action.fail(
      "Missing github token. Please provide one as an environment variable.",
    );
  }
  if (personalAccessToken === "") {
    action.fail(
      `Missing personal access token (https://github.com/settings/tokens/new) with "repo" scope. Add it as a secret named "PERSONAL_ACCESS_TOKEN" (https://github.com/settings/secrets/actions/new).`,
    );
  }

  initOctokit(githubToken, personalAccessToken);
}
