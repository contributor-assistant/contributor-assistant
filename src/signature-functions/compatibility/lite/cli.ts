import { StringWriter } from "https://x.nest.land/std@0.101.0/io/writers.ts";
import { copy } from "https://x.nest.land/std@0.101.0/io/util.ts";
import { parseFlags, parseYaml } from "../../../deps.ts";
import convert, { OutdatedStorage } from "./mod.ts";
import type { Form } from "../../core/types.ts";

/** Usage
 *
 * deno run --allow-read --allow-write lite.ts - < input.json > out.json
 *
 * deno run -allow-read --allow-write lite.ts -i input.json -o out.json -f .form.yml
*/

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
  await copy(Deno.stdin, buffer);
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
  const output = convert(input, undefined, form);
  await Deno.writeTextFile(flags.output, JSON.stringify(output));
}
