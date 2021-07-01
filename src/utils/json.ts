import "./globals.ts";

/** Stringify a JSON object. Prettify only in development */
export function stringify(object: unknown): string {
  return JSON.stringify(object, null, DENO_ENV === "production" ? 0 : 2);
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
