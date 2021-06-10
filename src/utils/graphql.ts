export function gql(strings: TemplateStringsArray, ...expr: string[]) {
  return `${strings[0]}${
    expr.reduce((acc, current, i) => `${acc} ${current} ${strings[i + 1]} `, "")
  }`.replace(/\s+/g, " ");
}
