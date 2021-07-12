import { StringWriter } from "https://x.nest.land/std@0.100.0/io/writers.ts";
import { defaultSignatureContent } from "../core/signatures.ts";
import type { Form, SignatureStorage } from "../core/types.ts";
import type { CustomField } from "../core/form.ts";
import { octokit } from "../../utils.ts";
import { parseFlags } from "../../deps.ts";

/** Usage
 *
 * deno run --allow-read --allow-write classic.ts - < input.json > out.json
 *
 * deno run -allow-read --allow-write classic.ts -i input.json -c cla.md -m metadata.json -o signatures.json -f .form.yml
*/

interface OutdatedSignature {
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
type OutdatedStorage = OutdatedSignature[];

interface OutdatedCustomField {
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
type OutdatedCustomFields = Record<string, OutdatedCustomField>;

interface FetchError {
  username: string;
  // deno-lint-ignore no-explicit-any
  reason: any;
}

if (Deno && import.meta.main) {
  const flags = parseFlags(Deno.args, {
    alias: {
      input: "i",
      cla: "c",
      metadata: "m",
      form: "f",
      output: "o",
    },
    string: [
      "input",
      "output",
      "cla",
      "form",
      "metadata",
    ],
  });
  // stdin
  if (flags._.includes("-")) {
    const buffer = new StringWriter();
    await Deno.copy(Deno.stdin, buffer);
    const outdated: OutdatedStorage = JSON.parse(buffer.toString());
    const output = await convert(outdated);
    console.log(JSON.stringify(output.signatures));
  } else {
    if (!flags.input || !flags.output) {
      console.error("no --input or --output");
      Deno.exit(1);
    }
    const input = JSON.parse(await Deno.readTextFile(flags.input));
    const metadata = flags.metadata
      ? JSON.parse(await Deno.readTextFile(flags.input))
      : undefined;
    const cla = flags.cla ? await Deno.readTextFile(flags.cla) : undefined;
    const output = await convert(input, cla, metadata);
    await Deno.writeTextFile(flags.output, JSON.stringify(output.signatures));
    if (flags.form) {
      await Deno.writeTextFile(flags.form, JSON.stringify(output.form));
    }
    if (output.errors.length > 0) {
      console.error(`Errors: ${output.errors}`);
    }
  }
}

export default async function convert(
  outdated: OutdatedStorage,
  gistDocument?: string,
  gistMetadata?: OutdatedCustomFields,
): Promise<{ signatures: SignatureStorage; form: Form; errors: FetchError[] }> {
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
        "Thank you for your submission, we appreciate it.\n Please read our Contributor License Agreement.",
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
