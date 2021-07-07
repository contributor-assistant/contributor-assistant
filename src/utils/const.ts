export const GH_ACTIONS_BOT_ID = 41898282;

/** A string used to retrieve a comment of the bot */
export function generateCommentAnchor(applicationType: string, id = "") {
  return `<!-- ${applicationType}-comment-anchor ${id} -->`;
}

declare global {
  var bundled: boolean;
}

Object.defineProperty(globalThis, "bundled", {
  value: true,
  writable: true,
  enumerable: false,
  configurable: false,
});
