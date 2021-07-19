import { applicationType, storageVersion } from "../meta.ts";
import type { ReRunStorage, SignatureStorage } from "./types.ts";
import type { storage } from "../../utils.ts";
import type { Options } from "../options.ts";

export const defaultSignatureContent: SignatureStorage = {
  type: applicationType,
  version: storageVersion,
  data: {
    current: {
      formSHA: "",
      form: { name: "", description: "", body: [] },
      signatures: [],
    },
    previous: [],
    invalidated: [],
  },
};

export const defaultReRunContent: ReRunStorage = {
  type: `${applicationType}/re-run`,
  version: storageVersion,
  data: [],
};

export interface ConfigStorage extends storage.Content {
  data: Omit<Options, "githubToken" | "personalAccessToken">;
}

// TODO: clear version rules
export const defaultConfigContent: ConfigStorage = {
  type: `${applicationType}/settings`,
  version: storageVersion,
  data: {
    storage: {
      form: "",
    },
  },
};
