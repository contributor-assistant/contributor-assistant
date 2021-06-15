import { action, context, octokit, personalOctokit } from "../../utils.ts";
import { getCommitters, Author } from "./getCommitters.ts";
import { checkAllowList } from "./allowList.ts";
import { isRemoteRepo, options } from "./options.ts";
import { CLAFile } from "./types.ts";
import prCommentSetup from "./pr/pullRequestComment.ts";
import { reRunLastWorkFlowIfRequired } from "./pullRerunRunner.ts";

export async function setup() {
  const committers = checkAllowList(await getCommitters());

  const { claFileContent, sha } = await getCLAFileContentandSHA(
    committers,
    getInitialCommittersMap(),
  );

  let committerMap = prepareCommiterMap(committers, claFileContent);

  try {
    const reactedCommitters = await prCommentSetup(
      committerMap,
      committers,
    ) as ReactedCommitterMap; // TODO: refactor

    if (reactedCommitters?.newSigned.length) {
      /* pushing the recently signed  contributors to the CLA Json File */
      const prNumber = context.issue.number;
      claFileContent.signedContributors.push(...reactedCommitters.newSigned);
      await (isRemoteRepo ? personalOctokit : octokit).repos
        .createOrUpdateFileContents({
          owner: options.remoteOrgName,
          repo: options.remoteRepoName,
          path: options.signaturesPath,
          sha,
          message: options.signedCommitMessage
            .replace("$contributorName", context.actor).replace(
              "$pullRequestNo",
              prNumber.toString(),
            ),
          content: btoa(JSON.stringify(claFileContent, null, 2)),
          branch: options.branch,
        });
    }
    if (
      reactedCommitters?.allSignedFlag ||
      (committerMap?.notSigned === undefined ||
        committerMap.notSigned.length === 0)
    ) {
      action.info(`All contributors have signed the CLA 📝 ✅ `);
      return reRunLastWorkFlowIfRequired();
    } else {
      action.fatal(
        `committers of Pull Request number ${context.issue.number} have to sign the CLA 📝`,
        -1,
      );
    }
  } catch (err) {
    action.fatal(`Could not update the JSON file: ${err.message}`, -1);
  }
}

async function getCLAFileContentandSHA(
  committers: Author[],
): Promise<ClafileContentAndSha> {
  const result = await (isRemoteRepo ? personalOctokit : octokit).repos
    .getContent({
      owner: options.remoteOrgName,
      repo: options.remoteRepoName,
      path: options.signaturesPath,
      ref: options.branch,
    }).catch((error) => {
      if (error.status === 404) {
        return createClaFileAndPRComment(committers, committerMap);
      } else {
        action.fatal(
          `Could not retrieve repository contents: ${error.message}. Status: ${error
            .status || "unknown"}`,
          -1,
        );
      }
    });
  if (Array.isArray(result.data)) {
    action.fatal("File path is a directory", -1);
  } else if (!("content" in result.data)) {
    action.fatal("No content", -1);
  } else {
    const sha = result.data.sha;
    const claFileContent = JSON.parse(atob(result.data.content));
    return { claFileContent, sha };
  }
}

async function createClaFileAndPRComment(
  committers: Author[],
): Promise<never> {
  /* const file: CLAFile = {
    type: "contributor-assistant/CLA",
    version: 1,
    repositories: [{
      owner: context.repo.owner,
      name: context.repo.repo,
      databaseId: 0,
      signed: [],
      unsigned: committers,
      unknown: [],
    }]
  } */
  /* committers.map((committer) => {
    if (!committer.id) {
      committerMap.unknown.push(committer);
    }
  }); */

  const initialContentString = JSON.stringify(
    { signedContributors: [] },
    null,
    3,
  );

  await (isRemoteRepo ? personalOctokit : octokit).repos
    .createOrUpdateFileContents({
      owner: options.remoteOrgName,
      repo: options.remoteRepoName,
      path: options.signaturesPath,
      message: options.commitMessage,
      content: btoa(initialContentString),
      branch: options.branch,
    }).catch((error) =>
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

function prepareCommiterMap(
  committers: CommittersDetails[],
  claFileContent: CLAFile,
): CommitterMap {
  let committerMap = getInitialCommittersMap();

  committerMap.notSigned = committers.filter(
    (committer) =>
      !claFileContent?.signedContributors.some((cla) =>
        committer.id === cla.id
      ),
  );
  committerMap.signed = committers.filter((committer) =>
    claFileContent?.signedContributors.some((cla) => committer.id === cla.id)
  );
  committers.map((committer) => {
    if (!committer.id) {
      committerMap.unknown.push(committer);
    }
  });
  return committerMap;
}

const getInitialCommittersMap = (): CommitterMap => ({
  signed: [],
  notSigned: [],
  unknown: [],
});
