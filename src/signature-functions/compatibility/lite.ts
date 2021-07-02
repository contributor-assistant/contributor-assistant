import { StringWriter } from "https://x.nest.land/std@0.100.0/io/writers.ts";
import { defaultSignatureContent } from "../core/signatures.ts";
import type { Form, SignatureStorage } from "../core/types.ts";
import type { CustomField } from "../core/form.ts";
import { parseFlags, parseYaml } from "../../deps.ts";

/** Usage
 *
 * deno run --allow-read --allow-write lite.ts - < input.json > out.json
 *
 * deno run -allow-read --allow-write lite.ts -i input.json -o out.json -f .form.yml
*/

interface OutdatedSignature {
  name: string;
  id: number;
  pullRequestNo?: number;
  "created_at"?: string;
  "updated_at"?: string;
  "comment_id"?: number;
  body?: string;
  repoId?: string;
}

interface OutdatedStorage {
  signedContributors: OutdatedSignature[];
}

if (Deno && import.meta.main) {
  const flags = parseFlags(Deno.args, {
    alias: {
      input: "i",
      output: "o",
      form: "f",
    },
    string: [
      "input",
      "output",
      "form",
    ],
  });
  // stdin
  if (flags._.includes("-")) {
    const buffer = new StringWriter();
    await Deno.copy(Deno.stdin, buffer);
    const outdated: OutdatedStorage = JSON.parse(buffer.toString());
    const signatures = convert(outdated);
    console.log(JSON.stringify(signatures));
  } else {
    if (!flags.input || !flags.output) {
      console.error("no --input or --output");
      Deno.exit(1);
    }
    const input = JSON.parse(await Deno.readTextFile(flags.input));
    const form = flags.form
      ? parseYaml(await Deno.readTextFile(flags.form)) as Form
      : undefined;
    const output = convert(input, form);
    await Deno.writeTextFile(flags.output, JSON.stringify(output));
  }
}

export function convert(
  outdated: OutdatedStorage,
  form?: Form,
): SignatureStorage {
  // deep copy
  const signatures: SignatureStorage = JSON.parse(
    JSON.stringify(defaultSignatureContent),
  );

  let fields: CustomField[] = [[true]];
  if (form !== undefined) {
    fields = [];
    for (const input of form.body) {
      if (input.type !== "markdown") {
        fields.push(input.id === "signature" ? [true] : null);
      }
    }
  }

  for (const signature of outdated.signedContributors) {
    signatures.data.signatures.push({
      user: {
        databaseId: signature.id,
        login: signature.name,
      },
      issue: 0,
      date: signature.created_at ?? new Date().toJSON(),
      fields,
    });
  }

  return signatures;
}
