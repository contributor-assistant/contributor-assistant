type Replacer = (key: string, value: unknown) => unknown;

export interface WriteJsonOptions extends Deno.WriteFileOptions {
  replacer?: Array<number | string> | Replacer;
  spaces?: number | string;
}

function serialize(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions,
): string {
  try {
    const jsonString = JSON.stringify(
      object,
      options.replacer as string[],
      options.spaces,
    );
    return `${jsonString}\n`;
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }
}

/** Writes an object to a JSON file. */
export async function writeJson(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions = {},
) {
  const jsonString = serialize(filePath, object, options);
  await Deno.writeTextFile(filePath, jsonString, {
    append: options.append,
    create: options.create,
    mode: options.mode,
  });
}

export function writeJsonSync(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions = {},
) {
  const jsonString = serialize(filePath, object, options);
  Deno.writeTextFileSync(filePath, jsonString, {
    append: options.append,
    create: options.create,
    mode: options.mode,
  });
}

/** Reads a JSON file and then parses it into an object */
export async function readJson(filePath: string): Promise<unknown> {
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

export function readJsonSync(filePath: string): Promise<unknown> {
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
