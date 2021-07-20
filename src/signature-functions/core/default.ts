import { applicationType } from "../meta.ts";
import type { ConfigStorage, ReRunStorage, SignatureStorage } from "./types.ts";

export const defaultSignatureContent: SignatureStorage = {
  type: applicationType,
  version: 1,
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
  version: 1,
  data: [],
};

export const defaultConfigContent: ConfigStorage = {
  type: `${applicationType}/config`,
  version: 1,
  data: {
    storage: {
      form: "",
    },
  },
};
