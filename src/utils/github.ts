import type { octokit } from "./octokit.ts";

export type FileLocation = {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
};

export interface Content<T> {
  content: T;
  sha: string;
}

export type RawContent = Content<string>;

export async function getFile<T>(
  kit: typeof octokit,
  location: FileLocation,
): Promise<RawContent> {
  const res = await kit.repos.getContent(location);
  if (Array.isArray(res.data)) {
    throw new Error(`File path is a directory: ${location.path}`);
  } else if (!("content" in res.data)) {
    throw new Error(`No content for path ${location.path}`);
  } else {
    return {
      content: atob(res.data.content),
      sha: res.data.sha,
    };
  }
}

export interface GithubFileUpdate {
  message: string;
  content: string;
}

export async function createOrUpdateFile(
  kit: typeof octokit,
  location: FileLocation,
  params: GithubFileUpdate,
  sha?: string,
): Promise<RawContent> {
  const res = await kit.repos.createOrUpdateFileContents({
    ...location,
    message: params.message,
    content: btoa(params.content),
    sha,
  }).catch((error) => {
    throw new Error(
      `Error occurred while creating ${location.path}: ${error.message}`,
    );
  });
  return { content: params.content, sha: res.data.content.sha };
}
