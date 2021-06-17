import {
  action,
  context,
  json,
  octokit,
  personalOctokit,
} from "../../utils.ts";
import { options } from "../options.ts";
import type { LocalStorage, RemoteGithubStorage } from "../options.ts";
import type { CLAStorage } from "../types.ts";
import { applicationType, storageVersion } from "./meta.ts";

export const defaultContent: CLAStorage = {
  type: applicationType,
  version: storageVersion,
  data: {
    signatures: [],
  },
};

export interface ghStorage {
  content: CLAStorage;
  sha: string;
}

export type StorageContent = ghStorage;

export function readStorage(): Promise<StorageContent> {
  switch (options.storage.type) {
    case "local":
    case "remote-github":
      return readGithubStorage(options.storage);
    default:
      action.fail("Unknown storage type");
  }
}

async function readGithubStorage(
  storage: Required<LocalStorage | RemoteGithubStorage>,
): Promise<ghStorage> {
  const kit = storage.type === "local" ? octokit : personalOctokit;
  const fileLocation = storage.type === "local"
    ? {
      ...context.repo,
      path: storage.path,
      branch: storage.branch,
    }
    : storage;
  try {
    const res = await kit.repos.getContent({
      ...fileLocation,
      ref: fileLocation.branch,
    });
    if (Array.isArray(res.data)) {
      action.fail("File path is a directory");
    } else if (!("content" in res.data)) {
      action.fail("No content");
    } else {
      const sha = res.data.sha;
      const content = JSON.parse(atob(res.data.content));
      return { content, sha };
    }
  } catch (error) {
    if (error.status === 404) {
      const content = defaultContent;
      const res = await kit.repos.createOrUpdateFileContents({
        ...fileLocation,
        message: options.message.commit.setup,
        content: json.toBase64(content),
      }).catch((error) =>
        action.fail(
          `Error occurred when creating the signature file: ${error
            .message ||
            error}. Make sure the branch where signatures are stored is NOT protected.`,
        )
      );
      return { content, sha: res.data.content.sha };
    } else {
      action.fail(
        `Could not retrieve repository contents: ${error.message}. Status: ${error
          .status || "unknown"}`,
      );
    }
  }
}

export function writeStorage(storage: StorageContent) {
  switch (options.storage.type) {
    case "local":
    case "remote-github":
      return writeGithubStorage(storage, options.storage);
    default:
      action.fail("Unknown storage type");
  }
}

async function writeGithubStorage(
  file: ghStorage,
  storage: Required<LocalStorage | RemoteGithubStorage>,
) {
  const kit = storage.type === "local" ? octokit : personalOctokit;
  const fileLocation = storage.type === "local"
    ? {
      ...context.repo,
      path: storage.path,
      branch: storage.branch,
    }
    : storage;
  await kit.repos.createOrUpdateFileContents({
    ...fileLocation,
    message: options.message.commit.signed
      .replace("${pull-request-number}", context.issue.number.toString()),
    content: json.toBase64(file.content),
    sha: file.sha,
  }).catch((err) =>
    action.fail(`Could not update the JSON file: ${err.message}`)
  );
}
