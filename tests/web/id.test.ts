import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { newId } from "../../apps/web/src/id.ts";

describe("newId", () => {
  it("returns a UUID-shaped string when randomUUID exists", () => {
    const id = newId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("falls back when randomUUID is missing (HTTP STG)", () => {
    const original = globalThis.crypto;
    const bytes = new Uint8Array(16).fill(7);
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (arr: Uint8Array) => {
          arr.set(bytes.subarray(0, arr.length));
          return arr;
        },
      },
    });
    try {
      const id = newId();
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      assert.notEqual(typeof (globalThis.crypto as Crypto).randomUUID, "function");
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: original,
      });
    }
  });
});
