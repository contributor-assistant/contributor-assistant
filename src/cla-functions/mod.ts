import * as action from "../utils/action.ts";
import { initOctokit } from "../utils/octokit.ts";

enum ExitCode {
  Success,
  MissingGithubToken,
  MissingPersonalAccessToken,
}

export async function setup(githubToken: string, personalAccessToken: string) {
  action.info("Contributor Assistant: CLA process started");

  if (githubToken === "") {
    action.fatal(
      ExitCode.MissingGithubToken,
      "Missing github token.",
      "Please provide one as an environment variable.",
    );
  }

  if (personalAccessToken === "") {
    action.fatal(
      ExitCode.MissingPersonalAccessToken,
      "Missing personal access token.",
      "Please provide one as an environment variable.",
    );
  }

  initOctokit(githubToken);

  // WIP
}
