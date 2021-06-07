import { core } from "../deps.ts";

function main(): void {
  console.log("Contributor Assistant: CLA");
  core.warning("warning test");
  core.error("error test");
  core.info("info test");
  core.setFailed("fail test")
}

main();
