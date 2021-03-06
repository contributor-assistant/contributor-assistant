import type { octokit } from "./octokit.ts";
import { Sha256 } from "../deps.ts";

export type FileLocation = {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
};

export interface GhContent<T> {
  content: T;
  sha: string;
}

export type RawGhContent = GhContent<string>;

export async function getFile<T>(
  kit: typeof octokit,
  location: FileLocation,
): Promise<RawGhContent> {
  const res = await kit.rest.repos.getContent(location);
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
): Promise<RawGhContent> {
  const res = await kit.rest.repos.createOrUpdateFileContents({
    ...location,
    message: params.message,
    content: btoa(params.content),
    sha,
  }).catch((error) => {
    throw new Error(
      `Error occurred while creating ${location.path}: ${error.message}`,
    );
  });
  return {
    content: params.content,
    sha: res.data.content?.sha ??
      new Sha256().update(params.content).toString(),
  };
}
