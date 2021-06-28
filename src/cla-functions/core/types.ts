import type { Storage } from "../../utils.ts";
import type { User, GitActor } from "./graphql.ts";

export type { User, GitActor };

export interface AuthorSignature {
  user: User;
  issueNumber: number;
  customFields: unknown[];
}

export interface SignatureStatus {
  update: boolean;
  signed: GitActor[];
  unsigned: GitActor[];
  unknown: GitActor[];
}

export interface CLAData {
  signatures: AuthorSignature[];
}

export interface CLAStorage extends Storage {
  data: CLAData;
}

export interface Form {
  name: string;
  description: string;
  assignees?: string | string[];
  labels?: string | string[];
  title?: string;
  body: UserInput[];
}

type UserInput =
  | InputType<"markdown", Markdown>
  | InputType<"input", Input>
  | InputType<"textarea", Textarea>
  | InputType<"dropdown", Dropdown>
  | InputType<"checkboxes", Checkboxes>;

interface InputType<type extends string, attributes extends unknown> {
  type: type;
  id?: string;
  attributes: attributes;
}

interface Markdown {
  value: string;
}

interface Input {
  label: string;
  description?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

interface Textarea extends Input {
  render?: string;
}

interface Dropdown {
  label: string;
  options: string[];
  description?: string;
  multiple?: boolean;
  required?: boolean;
}

interface Checkboxes {
  options: {
    label: string;
    required?: boolean;
  }[];
  label?: string;
  description?: string;
}
