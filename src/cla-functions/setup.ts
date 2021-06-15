import { getStorage } from "./storage/get.ts";
import { filterIgnored } from "./meta/ignoreList.ts";
import { getCommitters } from "./meta/commit.ts";
import type { Author, CLAData, SignatureStatus } from "./types.ts";
import { checkStorageContent, context } from "../utils.ts";
import { defaultContent } from "./storage/default.ts";

export async function setup() {
  let { content, sha } = await getStorage();
  content = checkStorageContent(content, defaultContent);

  const committers = filterIgnored(await getCommitters());

  const status = getSignatureStatus(committers, content.data);
}

function getSignatureStatus(authors: Author[], data: CLAData): SignatureStatus {
  return {
    signed: data.signatures.filter((signature) =>
      signature.prNumber === context.payload.pull_request?.number
    ),
    unsigned: authors.filter((author) =>
      author.user !== null &&
      !data.signatures.some((signature) =>
        signature.user?.databaseId === author.user.databaseId
      )
    ),
    unknown: authors.filter((author) =>
      author.user === null && author.coAuthoredWith === undefined
    ),
  };
}
