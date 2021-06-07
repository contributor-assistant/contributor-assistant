// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import processModule from "./process.ts";
import { Buffer as bufferModule } from "https://deno.land/std@0.97.0/node/buffer.ts";
import timers from "https://deno.land/std@0.97.0/node/timers.ts";

// d.ts files allow us to declare Buffer as a value and as a type
// type something = Buffer | something_else; is quite common

type GlobalType = {
  process: typeof processModule;
  Buffer: typeof bufferModule;
  setImmediate: typeof timers.setImmediate;
  clearImmediate: typeof timers.clearImmediate;
};

declare global {
  interface Window {
    global: GlobalType;
  }

  interface globalThis {
    global: GlobalType;
  }

  var global: GlobalType;
  var process: typeof processModule;
  var Buffer: typeof bufferModule;
  type Buffer = bufferModule;
  var setImmediate: typeof timers.setImmediate;
  var clearImmediate: typeof timers.clearImmediate;
}

export {};