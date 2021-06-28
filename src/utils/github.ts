import type { octokit } from "./octokit.ts";
import * as action from "./action.ts";

export type FileLocation = {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
};

export interface GithubContent {
  content: string;
  sha: string;
}

export async function getContent<T>(
  kit: typeof octokit,
  location: FileLocation,
): Promise<GithubContent> {
  const res = await kit.repos.getContent(location);
  if (Array.isArray(res.data)) {
    action.fail("File path is a directory");
  } else if (!("content" in res.data)) {
    action.fail("No content");
  } else {
    return {
      content: atob(res.data.content),
      sha: res.data.sha,
    };
  }
}
