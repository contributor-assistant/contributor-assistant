import { applicationType, storageVersion } from "../meta.ts";
import type { ReRunStorage, SignatureStorage } from "./types.ts";

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
