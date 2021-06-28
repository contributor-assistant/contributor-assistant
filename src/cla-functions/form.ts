import { parse } from "https://x.nest.land/std@0.99.0/encoding/yaml.ts";

const yml = parse(Deno.readTextFileSync("./cla.yml"));

// console.log(yml);



import marked from "https://cdn.skypack.dev/marked?dts";

const lexer = marked.lexer(Deno.readTextFileSync("./issue.md"))

console.log(lexer)
