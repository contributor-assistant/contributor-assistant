import type { Form } from "./types.ts";

interface QA {
  question: string;
  answer: string;
  id?: string;
}

interface ItemList {
  id?: string;
  items: {
    value: string;
    checked: boolean;
  }[];
}

type MetaData = QA | ItemList;

const noResponse = "_No response_";

export function parseIssue(form: Form, issue: marked.TokensList): MetaData[] {
  const iterator = issue.values();
  let token = iterator.next();

  const result: MetaData[] = [];

  for (const input of form.body) {
    if (input.type === "markdown") continue;
    if (token.done) break;
    if (
      token.value.type !== "heading" ||
      token.value.text !== input.attributes.label
    ) {
      break;
    }
    token = iterator.next();
    if (token.done) break;
    if (token.value.type === "paragraph") {
      if (
        input.type !== "input" && input.type !== "textarea" &&
        input.type !== "dropdown"
      ) {
        break;
      }
      const text = token.value.text;
      if (text !== noResponse) {
        result.push({
          id: input.id,
          question: input.attributes.label,
          answer: text,
        });
      }
    } else if (token.value.type === "list") {
      if (input.type !== "checkboxes") break;
      result.push({
        id: input.id,
        items: token.value.items.map((item) => ({
          value: item.text,
          checked: item.checked,
        })),
      });
    } else break;
    token = iterator.next();
    if (token.done) break;
    if (token.value.type === "space") token = iterator.next();
  }

  if (!token.done) throw new Error("Error while parsing issue form");
  return result;
}
