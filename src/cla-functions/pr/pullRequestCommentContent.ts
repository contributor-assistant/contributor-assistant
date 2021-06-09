import { CommitterMap } from "../interfaces.ts";
import { options } from "../options.ts";

export function commentContent(
  signed: boolean,
  committerMap: CommitterMap,
): string {
  return cla(signed, committerMap);
}

function cla(signed: boolean, committerMap: CommitterMap): string {
  if (signed) {
    return `****CLA Assistant Lite bot**** ${options.allSignedPrComment}`;
  }
  const committersCount = committerMap.signed.length +
    committerMap.notSigned.length;

  let you = committersCount > 1 ? "you all" : "you";
  let lineOne = options.notSignedPrComment.replace("$you", you);
  let text = `**CLA Assistant Lite bot:** ${lineOne}
   - - -
   ***${options.prSignComment}***
   - - -
   `;

  if (committersCount > 1) {
    text +=
      `**${committerMap.signed.length}** out of **${committersCount}** committers have signed the CLA.`;
    committerMap.signed.forEach((signedCommitter) => {
      text += `<br/>:white_check_mark: @${signedCommitter.name}`;
    });
    committerMap.notSigned.forEach((unsignedCommitter) => {
      text += `<br/>:x: @${unsignedCommitter.name}`;
    });
    text += "<br/>";
  }

  if (committerMap.unknown.length > 0) {
    let seem = committerMap.unknown.length > 1 ? "seem" : "seems";
    let committerNames = committerMap.unknown.map((committer) =>
      committer.name
    );
    text += `**${committerNames.join(", ")}** ${seem} not to be a GitHub user.`;
    text +=
      " You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).<br/>";
  }

  text +=
    "<sub>You can retrigger this bot by commenting **recheck** in this Pull Request</sub>";
  return text;
}
