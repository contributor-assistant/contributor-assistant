export function spliceArray<T>(
  array: T[],
  predicate: (element: T) => boolean,
) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      array.splice(i, 1);
      i--;
    }
  }
}

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function gql(strings: TemplateStringsArray, ...expr: string[]) {
  return `${strings[0]}${
    expr.reduce((acc, current, i) => `${acc} ${current} ${strings[i + 1]} `, "")
  }`.replace(/\s+/g, " ");
}

/** Boolean parser: github actions inputs cannot have a boolean value */
export function parseBoolean(flag: unknown): boolean | undefined {
  switch (flag) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return undefined;
  }
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
