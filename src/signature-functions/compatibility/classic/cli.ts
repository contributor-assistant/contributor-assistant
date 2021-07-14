import { StringWriter } from "https://x.nest.land/std@0.101.0/io/writers.ts";
import { copy } from "https://x.nest.land/std@0.101.0/io/util.ts";
import { octokit } from "../../../utils.ts";
import { parseFlags } from "../../../deps.ts";
import convert from "./mod.ts";
import type { OutdatedStorage } from "./mod.ts";

/** Usage
 *
 * deno run --allow-read --allow-write classic.ts - < input.json > out.json
 *
 * deno run -allow-read --allow-write classic.ts -i input.json -c cla.md -m metadata.json -o signatures.json -f .form.yml
*/

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
  await copy(Deno.stdin, buffer);
  const outdated: OutdatedStorage = JSON.parse(buffer.toString());
  const output = await convert(octokit, outdated);
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
  const output = await convert(octokit, input, cla, metadata);
  await Deno.writeTextFile(flags.output, JSON.stringify(output.signatures));
  if (flags.form) {
    await Deno.writeTextFile(flags.form, JSON.stringify(output.form));
  }
  if (output.errors.length > 0) {
    console.error(`Errors: ${output.errors}`);
  }
}
