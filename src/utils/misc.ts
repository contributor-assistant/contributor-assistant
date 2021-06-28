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
