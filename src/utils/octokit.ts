import { Octokit } from "../deps.ts";

export let octokit: Octokit;

export function initOctokit(token: string) {
  octokit = new Octokit({ auth: token });
}
