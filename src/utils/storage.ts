import { octokit, personalOctokit } from "./octokit.ts";
import { context } from "./context.ts";
import * as action from "./action.ts";
import * as github from "./github.ts";

export interface Content {
  type: string;
  version: number;
  data: unknown;
}

export type Converter<T extends Content> = (content: T) => void;

function defaultConverter<T extends Content>(_content: T): never {
  action.fail("Data conversion not implemented.");
}

export function checkContent<T extends Content>(
  content: T,
  defaultContent: T,
  convert: Converter<T> = defaultConverter,
): boolean {
  if (content.type !== defaultContent.type) {
    action.fail("The given storage content type is invalid.");
  }
  if (content.version > defaultContent.version) {
    action.fail(
      "Unsupported storage content version. Please update your github action.",
    );
  }
  if (content.version < defaultContent.version) {
    convert(content);
    return true;
  }
  return false;
}

export interface Local {
  type: "local";
  /** The branch where the signatures will be stored. */
  branch?: string;
  /** The path where the signatures will be stored. */
  path?: string;
}

export interface Remote extends Omit<Local, "type"> {
  type: "remote";
  /** The owner of the remote repository, can be an organization. Leave empty to default to this repository owner. */
  owner?: string;
  /** The name of another repository to store the signatures. */
  repo: string;
}

export async function readGithub(
  storage: Required<Local | Remote>,
  defaultContent?: string,
  message = `Update ${storage.path}`,
): Promise<github.RawContent> {
  // Personal Access Token is required for remote repositories
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
      if (defaultContent) {
        return github.createOrUpdateFile(kit, fileLocation, {
          message,
          content: defaultContent,
        });
      } else throw error;
    } else {
      action.fail(
        `Could not retrieve repository file content: ${error.message}. Status: ${error
          .status || "unknown"}`,
      );
    }
  }
}

export async function writeGithub(
  file: github.RawContent,
  storage: Required<Local | Remote>,
  message: string,
) {
  // Personal Access Token is required for remote repositories
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
