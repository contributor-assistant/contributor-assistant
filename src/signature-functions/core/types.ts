import type { storage } from "../../utils.ts";
import type { GitActor, User } from "./graphql.ts";

export type { GitActor, User };

/* --- Signatures --- */

export interface AuthorSignature {
  user: User;
  issue: number;
  date: string;
  fields: unknown[];
}

export interface SupersededSignature extends AuthorSignature {
  endDate: string;
  formSHA: string;
}

export interface SignatureStatus {
  signed: GitActor[];
  unsigned: GitActor[];
  unknown: GitActor[];
}

export interface SignatureData {
  form: Form;
  formSHA: string;
  signatures: AuthorSignature[];
  superseded: SupersededSignature[];
  invalidated: {
    form: Form;
    formSHA: string;
    endDate: string;
    signatures: AuthorSignature[];
  }[];
}

export interface SignatureStorage extends storage.Storage {
  data: SignatureData;
}

/* --- re-run --- */

export type ReRunData = {
  pullRequest: number;
  workflow: number;
  /** author IDs */
  unsigned: number[];
}[];

export interface ReRunStorage extends storage.Storage {
  data: ReRunData;
}

/* --- form --- */

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
