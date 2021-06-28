import type { Storage } from "../../utils.ts";
import type { GitActor, User } from "./graphql.ts";

export type { GitActor, User };

export interface AuthorSignature {
  user: User;
  issue: number;
  date: number;
  customFields: unknown[];
}

export interface SupersededSignature extends AuthorSignature {
  endDate: number;
}

export interface SignatureStatus {
  signed: GitActor[];
  unsigned: GitActor[];
  unknown: GitActor[];
}

export interface SignatureData {
  documentSHA: string;
  signatures: AuthorSignature[];
  superseded: SupersededSignature[];
  invalidated: {
    endDate: number;
    documentSHA: string;
    signatures: AuthorSignature[];
  }[];
}

export type ReRunData = {
  pullRequest: number;
  workflow: number;
  /** author IDs */ 
  unsigned: number[];
}[];

export interface SignatureStorage extends Storage {
  data: SignatureData;
}

export interface ReRunStorage extends Storage {
  data: ReRunData;
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
