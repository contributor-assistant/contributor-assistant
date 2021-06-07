export async function readQuery(path: string): Promise<string> {
  const query = await Deno.readTextFile(path);
  return query.replace(/( |\t)/g, "");
}
