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
import type { Form, GitActor } from "./types.ts";

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
export const head = `${commentAnchor}\n${title}\n`;

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
  const unsigned: { committer: GitActor; url: URL }[] = status.unsigned
    .map((committer) => ({ committer, url: new URL(url.href) }));

  if (githubKeys.length > 0) {
    const userInfo = await Promise.all(
      unsigned.map(({ committer }) =>
        octokit.rest.users.getByUsername({
          username: committer.user!.login,
        })
      ),
    );
    for (let i = 0; i < unsigned.length; i++) {
      const { url } = unsigned[i];
      const info = userInfo[i].data;
      for (const key of githubKeys) {
        if (key in info) {
          url.searchParams.append(key, info[key as keyof typeof info]);
        }
      }
    }
  }

  const committerCount = status.signed.length + status.unsigned.length;
  body += `${
    text.header.replace("${you}", committerCount > 1 ? "you all" : "you")
  }
  `;

  const preFilled = githubKeys.length > 0 && committerCount > 1;

  if (committerCount === 1 && status.unsigned.length === 1 || !preFilled) {
    body += `✍️ Please sign [here](${unsigned[0].url.href}) @${
      status
        .unsigned[0].user!.login
    } |
    --------------------------------------------------------|\n\n`;
  }
  if (committerCount > 1) {
    body += `${text.summary} |
    -------------------------|
    `.replace("${signed}", status.signed.length.toString())
      .replace("${total}", committerCount.toString());
    for (const committer of status.signed) {
      body += `:white_check_mark: @${committer.user!.login}\n`;
    }
    for (const { committer, url } of unsigned) {
      body += `:x: @${committer.user!.login} ${
        preFilled ? `please sign [here](${url.href})` : ""
      } \n`;
    }
  }

  if (status.unknown.length > 0) {
    for (const committer of status.unknown) {
      body += `:grey_question: ${committer.name} (${committer.email}) \n`;
    }
    body += `\n${text.unknownWarning}\n`;
  }

  return `${body}\n${
    text.footer.replace("${re-trigger}", options.message.reTrigger)
  }`
    .replace(/\n( |\t)*/g, "\n");
}

export async function missingIssueComment() {
  const repo = await action.repo();
  const body = `${title}
  ⚠ ${
    repo.owner?.login !== undefined ? `@${repo.owner?.login}` : ""
  } Contributor Assistant Issue Form did not exist, I created one for you. I advise you to modify [this template](https://github.com/oganexon/CLA-experiments/blob/${repo.default_branch}/.github/ISSUE_TEMPLATE/${options.storage.form}) to suit your needs. ⚠
  `;
  await pr.createComment(body.replace(/\n( |\t)*/g, "\n"));
}
