declare global {
  const DENO_ENV: string | undefined;
}

Object.defineProperty(globalThis, "DENO_ENV", {
  value: "development",
  writable: false,
  enumerable: false,
  configurable: false,
});

export {};
