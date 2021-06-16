import * as action from "./action.ts";

export interface Storage {
  type: string;
  version: number;
  data: unknown;
}

export type Converter<T extends Storage> = (content: T) => void;

function defaultConverter<T extends Storage>(_content: T): never {
  action.fail("Data conversion not implemented.");
}

export function checkStorageContent<T extends Storage>(
  content: T,
  defaultContent: T,
  convert: Converter<T> = defaultConverter,
): void {
  if (content.type !== defaultContent.type) {
    action.fail("The given storage content type is invalid.");
  }
  if (content.version > defaultContent.version) {
    action.fail(
      "Unsupported storage content version. Please update your github action.",
    );
  }
  if (content.version < defaultContent.version) convert(content);
}
