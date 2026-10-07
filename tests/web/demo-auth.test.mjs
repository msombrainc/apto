import test from "node:test";
import assert from "node:assert/strict";
import { isDemoLogin } from "./demoAuth.mjs";

test("demo login accepts demo/demo", () => {
  assert.equal(isDemoLogin("demo", "demo"), true);
});

test("demo login rejects wrong password", () => {
  assert.equal(isDemoLogin("demo", "wrong"), false);
});
