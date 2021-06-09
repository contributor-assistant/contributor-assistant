import { action, context } from "../utils.ts";
import { getCommitters } from "./graphql.ts";
import { ExitCode } from "./exit.ts";
import { checkAllowList } from "./allowList.ts";
import { setupOptions } from "./options.ts";
import {
  ClafileContentAndSha,
  CommitterMap,
  CommittersDetails,
  ReactedCommitterMap,
  CLAFile,
} from "./interfaces.ts";
import { createFile, getFileContent, updateFile } from "./persistence.ts";
import prCommentSetup from "./pr/pullRequestComment.ts"
import { reRunLastWorkFlowIfRequired } from "./pullRerunRunner.ts";;
import type { CLAOptions } from "./options.ts";
import type { RestEndpointMethodTypes } from "../deps.ts";

export async function setup(options: CLAOptions) {
  action.info("Contributor Assistant: CLA process started");

  options.githubToken ??= Deno.env.get("GITHUB_TOKEN") ?? "";
  options.personalAccessToken ??= Deno.env.get("PERSONAL_ACCESS_TOKEN") ?? "";

  if (options.githubToken === "") {
    action.fatal(
      "Missing github token. Please provide one as an environment variable.",
      ExitCode.MissingGithubToken,
    );
  }
  if (options.personalAccessToken === "") {
    action.fatal(
      "Missing personal access token (https://github.com/settings/tokens/new). Please provide one as an environment variable.",
      ExitCode.MissingPersonalAccessToken,
    );
  }

  setupOptions(options);

  let committerMap = getInitialCommittersMap()

  let committers = await getCommitters();
  committers = checkAllowList(committers, options.allowList ?? []);

  const { claFileContent, sha } = await getCLAFileContentandSHA(committers, committerMap)

  committerMap = prepareCommiterMap(committers, claFileContent)

  try {
    const reactedCommitters = await prCommentSetup(committerMap, committers) as ReactedCommitterMap // TODO: refactor

    if (reactedCommitters?.newSigned.length) {
      /* pushing the recently signed  contributors to the CLA Json File */
      await updateFile(sha, claFileContent, reactedCommitters)
    }
    if (reactedCommitters?.allSignedFlag || (committerMap?.notSigned === undefined || committerMap.notSigned.length === 0)) {
      action.info(`All contributors have signed the CLA 📝 ✅ `)
      return reRunLastWorkFlowIfRequired()
    } else {
      action.fatal(`committers of Pull Request number ${context.issue.number} have to sign the CLA 📝`, -1)
    }

  } catch (err) {
    action.fatal(`Could not update the JSON file: ${err.message}`, -1)
  }
}

async function getCLAFileContentandSHA(
  committers: CommittersDetails[],
  committerMap: CommitterMap,
): Promise<ClafileContentAndSha> {
  let result: RestEndpointMethodTypes["repos"]["getContent"]["response"];
  try {
    result = await getFileContent();
  } catch (error) {
    if (error.status === 404) {
      return createClaFileAndPRComment(committers, committerMap);
    } else {
      action.fatal(
        `Could not retrieve repository contents: ${error.message}. Status: ${error
          .status || "unknown"}`,
        -1,
      );
    }
  }
  if (Array.isArray(result.data)) {
    action.fatal("File path is a directory", -1);
  } else if (!("content" in result.data)) {
    action.fatal("No content", -1);
  } else {
    const sha = result.data.sha;
    const claFileContent = JSON.parse(btoa(result.data.content));
    return { claFileContent, sha };
  }
}

async function createClaFileAndPRComment(
  committers: CommittersDetails[],
  committerMap: CommitterMap,
): Promise<never> {
  committerMap.notSigned = committers;
  committerMap.signed = [];
  committers.map((committer) => {
    if (!committer.id) {
      committerMap.unknown.push(committer);
    }
  });

  const initialContentString = JSON.stringify(
    { signedContributors: [] },
    null,
    3,
  );

  await createFile(initialContentString).catch((error) =>
    action.fatal(
      `Error occurred when creating the signed contributors file: ${error
        .message ||
        error}. Make sure the branch where signatures are stored is NOT protected.`,
      -1,
    )
  );
  await prCommentSetup(committerMap, committers);
  throw new Error(
    `Committers of pull request ${context.issue.number} have to sign the CLA`,
  );
}

function prepareCommiterMap(committers: CommittersDetails[], claFileContent: CLAFile): CommitterMap {
  let committerMap = getInitialCommittersMap()

  committerMap.notSigned = committers.filter(
    committer => !claFileContent?.signedContributors.some(cla => committer.id === cla.id)
  )
  committerMap.signed = committers.filter(committer =>
    claFileContent?.signedContributors.some(cla => committer.id === cla.id)
  )
  committers.map(committer => {
    if (!committer.id) {
      committerMap.unknown.push(committer)
    }
  })
  return committerMap
}

const getInitialCommittersMap = (): CommitterMap => ({
  signed: [],
  notSigned: [],
  unknown: []
})
