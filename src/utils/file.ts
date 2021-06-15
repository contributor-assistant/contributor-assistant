import * as action from "./action.ts";

export interface Storage {
  type: string;
  version: number;
  data: unknown
}

export type Converter<T extends Storage> = (content: T) => T

function defaultConverter<T extends Storage>(_content: T): never {
  action.fail("Unimplemented data conversion.")
}

export function checkStorageContent<T extends Storage>(content: T, defaultContent: T, convert: Converter<T> = defaultConverter): T {
  if (content.type !== defaultContent.type) action.fail("The given storage content type is invalid.");
  if (content.version > defaultContent.version) action.fail("Unsupported storage content version. Please update your github action.");
  return content.version < defaultContent.version ? convert(content): content;
}
