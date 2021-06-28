import type { Form } from "./types.ts";

interface QA {
  type: "question-answer"
  id?: string;
  question: string;
  answer: string;
}

interface ItemList {
  type: "item-list"
  id?: string;
  items: {
    value: string;
    checked: boolean;
  }[];
}

export type Metadata = QA | ItemList;

const noResponse = "_No response_";

export function parseIssue(form: Form, issue: marked.TokensList): Metadata[] {
  const iterator = issue.values();
  let token = iterator.next();

  const result: Metadata[] = [];

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
          type: "question-answer",
          id: input.id,
          question: input.attributes.label,
          answer: text,
        });
      }
    } else if (token.value.type === "list") {
      if (input.type !== "checkboxes") break;
      result.push({
        type: "item-list",
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
