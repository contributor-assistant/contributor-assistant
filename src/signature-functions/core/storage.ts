import {
  action,
  context,
  github,
  json,
  octokit,
  personalOctokit,
} from "../../utils.ts";
import { options } from "../options.ts";
import type { LocalStorage, RemoteGithubStorage } from "../options.ts";
import type { SignatureStorage } from "./types.ts";
import { applicationType, storageVersion } from "../meta.ts";

export const defaultSignatureContent: SignatureStorage = {
  type: applicationType,
  version: storageVersion,
  data: {
    documentSHA: "", // TODO
    signatures: [],
    superseded: [],
    invalidated: [],
  },
};

export interface ghStorage {
  content: SignatureStorage;
  sha: string;
}

export type StorageContent = ghStorage;

export async function readSignatureStorage(): Promise<StorageContent> {
  switch (options.storage.type) {
    case "local":
    case "remote-github":
      const { content, sha } = await readGithubStorage(
        options.storage,
        JSON.stringify(defaultSignatureContent),
        options.message.commit.setup,
      );
      return { content: JSON.parse(content), sha };
    default:
      action.fail("Unknown storage type");
  }
}

export async function readGithubStorage(
  storage: Required<LocalStorage | RemoteGithubStorage>,
  defaultContent: string,
  message: string,
): Promise<github.Content> {
  const kit = storage.type === "local" ? octokit : personalOctokit;
  const fileLocation = storage.type === "local"
    ? {
      ...context.repo,
      path: storage.path,
      branch: storage.branch,
    }
    : storage;
  try {
    const content = await github.getFile(kit, fileLocation);
    return content;
  } catch (error) {
    if (error.status === 404) {
      return github.createOrUpdateFile(kit, fileLocation, {
        message,
        content: defaultContent,
      });
    } else {
      action.fail(
        `Could not retrieve repository contents: ${error.message}. Status: ${error
          .status || "unknown"}`,
      );
    }
  }
}

export function writeSignatureStorage(storage: StorageContent) {
  switch (options.storage.type) {
    case "local":
    case "remote-github":
      return writeGithubStorage({
        content: JSON.stringify(storage.content),
        sha: storage.sha,
      }, options.storage, `${
        options.message.commit.signed
          .replace("${signatory}", context.payload.issue!.user.login)
      }. Closes #${context.issue.number}`);
    default:
      action.fail("Unknown storage type");
  }
}

export async function writeGithubStorage(
  file: github.Content,
  storage: Required<LocalStorage | RemoteGithubStorage>,
  message: string,
) {
  const kit = storage.type === "local" ? octokit : personalOctokit;
  const fileLocation = storage.type === "local"
    ? {
      ...context.repo,
      path: storage.path,
      branch: storage.branch,
    }
    : storage;
  await github.createOrUpdateFile(kit, fileLocation, {
    message,
    content: file.content,
  }, file.sha);
}
