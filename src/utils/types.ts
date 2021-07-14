export type DeepRequired<T> = {
  [K in keyof T]-?: DeepRequired<T[K]>;
};

export type UnpackConstructor<T> = T extends (new () => infer U) ? U : T;
export type UnpackArray<T> = T extends (infer U)[] ? U
  : (T extends readonly (infer U)[] ? U : T);
