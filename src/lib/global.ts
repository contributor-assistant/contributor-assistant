// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/// <reference path="./global.d.ts" />
import processModule from "./process.ts";
import { Buffer as bufferModule } from "https://deno.land/std@0.97.0/node/buffer.ts";
import timers from "https://deno.land/std@0.97.0/node/timers.ts";

Object.defineProperty(globalThis, "global", {
  value: globalThis,
  writable: false,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(globalThis, "process", {
  value: processModule,
  enumerable: false,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "Buffer", {
  value: bufferModule,
  enumerable: false,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "setImmediate", {
  value: timers.setImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "clearImmediate", {
  value: timers.clearImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});

export {};