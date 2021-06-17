/** Formats and converts to base-64 */
export function toBase64(object: unknown) {
  return btoa(`${JSON.stringify(object, null, 2)}\n`);
}

/** Reads a JSON file and then parses it into an object */
export async function read(filePath: string): Promise<unknown> {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(await Deno.readFile(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    if (err instanceof SyntaxError) {
      throw new Error(err.message);
    } else {
      throw err;
    }
  }
}

export function readSync(filePath: string): Promise<unknown> {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(Deno.readFileSync(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    if (err instanceof SyntaxError) {
      throw new Error(err.message);
    } else {
      throw err;
    }
  }
}
