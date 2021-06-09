export async function read(path: string): Promise<string> {
  const query = await Deno.readTextFile(path);
  return query.replace(/( |\t)/g, "");
}
