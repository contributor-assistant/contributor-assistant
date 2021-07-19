import { SignatureStatus } from "./types.ts";
import {
  action,
  context,
  generateCommentAnchor,
  octokit,
  pr,
} from "../../utils.ts";
import { applicationType } from "../meta.ts";
import { options } from "../options.ts";
import { parseYaml } from "../../deps.ts";
import { extractIDs } from "./form.ts";
import type { Form, User } from "./types.ts";

const commentAnchor = generateCommentAnchor(applicationType);

export async function commentPR(status: SignatureStatus, rawForm: string) {
  const comments = await pr.listComments();
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  const form = parseYaml(rawForm) as Form;

  if (botComment === undefined) {
    if (status.unsigned.length > 0 || status.unknown.length > 0) {
      await pr.createComment(await createBody(status, form));
    } else {
      action.info("Everyone has already signed the document.");
    }
  } else {
    await pr.updateComment(botComment.id, await createBody(status, form));
  }
}

export async function uncommentPR() {
  const comments = await pr.listComments();
  const botComment = comments.find((comment) =>
    comment.body?.match(commentAnchor)
  );
  if (botComment !== undefined) {
    await pr.deleteComment(botComment.id);
  }
}

const title = "## Contributor Assistant | Signatures";
// const logo = '<div><img src="https://raw.githubusercontent.com/cla-assistant/contributor-assistant/main/actions/signatures/assets/logo.svg" align="right" alt="Signatures logo" width="64"></div>'
const logo =
  '<div><img src="https://raw.githubusercontent.com/oganexon/CLA-experiments/main/actions/signatures/assets/logo.svg" align="right" alt="Signatures logo" width="64"></div>';
export const head = `${commentAnchor}\n\n${logo}\n\n${title}\n`;

async function createBody(
  status: SignatureStatus,
  form: Form,
): Promise<string> {
  let body = head;
  const text = options.message.comment;
  if (status.unsigned.length === 0 && status.unknown.length === 0) {
    return body + text.allSigned;
  }

  const url = new URL(
    `https://github.com/${context.repo.owner}/${context.repo.repo}/issues/new`,
  );
  url.searchParams.append("template", options.storage.form);
  url.searchParams.append("title", form.title ?? "License Signature");
  const labels = typeof form.labels === "string" ? [form.labels] : form.labels;
  url.searchParams.append("labels", labels?.join(",") ?? options.labels.form);

  const githubKeys = extractIDs(form);
  const unsigned: { committer: User; url: URL }[] = status.unsigned
    .map((committer) => ({ committer, url: new URL(url.href) }));

  if (githubKeys.length > 0) {
    const userInfo = await Promise.all(
      unsigned.map(({ committer }) =>
        octokit.rest.users.getByUsername({
          username: committer.login,
        })
      ),
    );
    for (let i = 0; i < unsigned.length; i++) {
      const { url } = unsigned[i];
      const info = userInfo[i].data;
      for (const key of githubKeys) {
        if (key in info) {
          // @ts-ignore `key as keyof typeof info` causes issues here
          url.searchParams.append(key, info[key]);
        }
      }
    }
  }

  const committerCount = status.signed.length + status.unsigned.length;
  body += `${text.header}\n\n`;

  const preFilled = githubKeys.length > 0 && committerCount > 1;

  if (
    status.unsigned.length > 0 &&
    (committerCount === 1 && status.unsigned.length === 1 || !preFilled)
  ) {
    body += `✍️ Please sign [here](${unsigned[0].url.href}) ${
      committerCount === 1 ? `@${status.unsigned[0].login}` : ""
    } |
    --------------------------------------------------------|\n\n`;
  }
  if (committerCount > 1 || status.unknown.length > 0) {
    body += `${text.summary} |
    -------------------------|
    `.replace("${signed}", status.signed.length.toString())
      .replace("${total}", committerCount.toString());
    for (const committer of status.signed) {
      body += `:white_check_mark: **${committer.login}**\n`;
    }
    for (const { committer, url } of unsigned) {
      body += `:x: @${committer.login} ${
        preFilled ? `please sign [here](${url.href})` : ""
      } \n`;
    }
    for (const committer of status.unknown) {
      body += `:question: ${committer.name} (${committer.email}) \n`;
    }
  }

  if (status.unknown.length > 0) {
    body += `\n${text.unknownWarning}\n`;
  }

  return `${body}\n${
    text.footer.replace("${re-trigger}", options.message.reTrigger)
  }`
    .replace(/\n( |\t)*/g, "\n");
}

export async function missingIssueComment() {
  const repo = await action.repo();
  const body = `${logo}\n\n${title}
  ⚠ ${
    repo.owner?.login !== undefined ? `@${repo.owner?.login}` : ""
  } Contributor Assistant Issue Form did not exist, I created one for you. I advise you to modify [this template](https://github.com/oganexon/CLA-experiments/blob/${repo.default_branch}/.github/ISSUE_TEMPLATE/${options.storage.form}) to suit your needs. ⚠
  `;
  await pr.createComment(body.replace(/\n( |\t)*/g, "\n"));
}
