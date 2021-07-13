import { defaultSignatureContent } from "../../core/default.ts";
import type { Form, SignatureStorage } from "../../core/types.ts";
import type { CustomField } from "../../core/form.ts";
import type { OctokitConstructor } from "../../../utils/octokit.ts";

export interface OutdatedSignature {
  "user_name": string;
  "repo_owner": string;
  "repo_name": string;
  "gist_name": string;
  "gist_url": string;
  "gist_version": string;
  "signed_at": string;
  "org_cla": boolean;
  [key: string]: unknown;
}
export type OutdatedStorage = OutdatedSignature[];

export interface OutdatedCustomField {
  title?: string;
  type: "hidden" | "string" | "textarea" | "number" | "boolean" | {
    enum: string[];
  };
  required?: boolean;
  description?: string;
  maximum?: number;
  minimum?: number;
  githubKey?: string;
}
export type OutdatedCustomFields = Record<string, OutdatedCustomField>;

export interface FetchError {
  username: string;
  // deno-lint-ignore no-explicit-any
  reason: any;
}

export interface Output {
  signatures: SignatureStorage;
  form: Form;
  errors: FetchError[];
}

export default async function convert(
  octokit: OctokitConstructor,
  outdated: OutdatedStorage,
  gistDocument?: string,
  gistMetadata?: OutdatedCustomFields,
): Promise<Output> {
  // deep copy
  const signatures: SignatureStorage = JSON.parse(
    JSON.stringify(defaultSignatureContent),
  );

  const form: Form = {
    name: "Contributor License Agreement",
    description: "Sign the Contributor License Agreement",
    title: "CLA Signature",
    labels: ["signature form"],
    body: [],
  };

  form.body.push({
    type: "markdown",
    attributes: {
      value: gistDocument ??
        "Thank you for your submission, we appreciate it.\nPlease read our Contributor License Agreement.",
    },
  });

  const keys: string[] = [];

  for (const key in gistMetadata) {
    const element = gistMetadata[key];
    switch (element.type) {
      case "boolean":
        form.body.push({
          type: "checkboxes",
          id: element.githubKey,
          attributes: {
            description: element.description,
            options: [{
              label: element.title ?? "I agree",
              required: element.required,
            }],
          },
        });
        break;
      case "number":
      case "string":
        form.body.push({
          type: "input",
          id: element.githubKey,
          attributes: {
            label: element.title ?? "Input:",
            description: element.description,
            required: element.required,
          },
        });
        break;
      case "textarea":
        form.body.push({
          type: "textarea",
          id: element.githubKey,
          attributes: {
            label: element.title ?? "Input:",
            description: element.description,
            required: element.required,
          },
        });
        break;
      case "hidden": // What is this input type supposed to do ??
      default:
        if (typeof element.type === "object") {
          form.body.push({
            type: "dropdown",
            id: element.githubKey,
            attributes: {
              label: element.title ?? "Input:",
              description: element.description,
              required: element.required,
              options: element.type.enum,
            },
          });
          break;
        }
        throw new Error(`unknown input type: ${element.type}`);
    }
    keys.push(key);
  }

  form.body.push({
    type: "checkboxes",
    id: "signature",
    attributes: {
      label: "Signature",
      options: [{
        label:
          "I have read the Contributor Document and I hereby sign this document.",
        required: true,
      }],
    },
  });

  const users = await Promise.allSettled(
    outdated.map((user) =>
      octokit.rest.users.getByUsername({ username: user.user_name })
    ),
  );

  const errors: FetchError[] = [];

  for (let i = 0; i < outdated.length; i++) {
    const signature = outdated[i];
    const user = users[i];
    if (user.status === "fulfilled") {
      const fields: CustomField[] = [];

      let i = 0;
      for (const input of form.body) {
        if (input.type === "markdown") continue;
        if (input.id === "signature") {
          fields.push([true]);
        } else {
          switch (input.type) {
            case "input":
            case "textarea":
              fields.push(`${signature[keys[i]]}`);
              break;
            case "dropdown":
              fields.push(
                input.attributes.options.indexOf(`${signature[keys[i]]}`),
              );
              break;
            case "checkboxes":
              fields.push([!!signature[keys[i]]]);
              break;
          }
        }
        i++;
      }

      signatures.data.current.signatures.push({
        user: {
          databaseId: user.value.data.id,
          login: signature.user_name,
        },
        owner: signature.repo_owner,
        repo: signature.repo_name,
        issue: 0,
        date: signature.signed_at,
        fields,
      });
    } else {
      errors.push({ username: outdated[i].user_name, reason: user.reason });
    }
  }

  return { signatures, form, errors };
}
