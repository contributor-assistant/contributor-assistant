import { parseYaml, stringifyYaml } from "../deps.ts";
import * as storage from "./storage.ts";
import * as action from "./action.ts";
import * as github from "./github.ts";
import { setupOctokit } from "./octokit.ts";
import type { Storage } from "./storage.ts";

export interface ConfigStorage<T = Storage> extends Storage {
  data: T[];
}

export const defaultConfigContent: ConfigStorage = {
  type: "contributor-assistant/config",
  version: 1,
  data: [],
};

export async function pipeConfig<T extends Storage>(
  flags: Record<string, string>,
  defaultConfig: T,
  callback: (data: T["data"]) => Promise<void>,
) {
  setupOctokit(flags.githubToken, flags.personalAccessToken);

  const fileLocation = flags.configRemoteRepo.length > 0
    ? {
      type: "remote",
      repo: flags.configRemoteRepo,
      owner: flags.configRemoteOwner,
      branch: flags.configBranch,
      path: flags.configPath,
    } as const
    : {
      type: "local",
      branch: flags.configBranch,
      path: flags.configPath,
    } as const;

  let configContent: github.Content<ConfigStorage<T> | T>;
  try {
    const { content, sha } = await storage.readGithub(fileLocation);
    try {
      configContent = { content: parseYaml(content) as ConfigStorage<T>, sha };
    } catch (error) {
      action.fail(`Unable to parse config file: ${error}`);
    }
  } catch {
    action.fail(`Config file doesn't exist: ${fileLocation}`);
  }

  let update = false;
  let config: T;

  if (configContent.content.type === defaultConfig.type) {
    config = configContent.content as T;
  } else {
    update ||= storage.checkContent(
      configContent.content as ConfigStorage<T>,
      defaultConfigContent,
    );

    const subConfig = (configContent.content as ConfigStorage<T>).data
      .find((cfg) => cfg.type === defaultConfig.type);
    if (subConfig === undefined) {
      action.fail(`Unable to find config for ${defaultConfig.type}`);
    }
    config = subConfig;
  }

  update ||= storage.checkContent(config, defaultConfig);

  const [callbackResult, writeResult] = await Promise.allSettled([
    callback(config.data),
    update
      ? storage.writeGithub(
        {
          content: stringifyYaml(
            configContent.content as unknown as Record<string, unknown>,
          ),
          sha: configContent.sha,
        },
        fileLocation,
        "Update config file",
      )
      : {},
  ]);

  if (callbackResult.status === "rejected") throw callbackResult.reason;
  if (writeResult.status === "rejected") throw writeResult.reason;
}
