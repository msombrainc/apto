import test from "node:test";
import assert from "node:assert/strict";
import { resolveGlobalAssetLookup } from "../../apps/web/src/routing/globalAssetLookup.ts";

test("resolveGlobalAssetLookup noops on empty input", async () => {
  const outcome = await resolveGlobalAssetLookup("  ", async () => ({ id: "x" }));
  assert.equal(outcome.kind, "noop");
});

test("resolveGlobalAssetLookup navigates on success", async () => {
  const outcome = await resolveGlobalAssetLookup("A0001", async () => ({ id: "asset-1" }));
  assert.deepEqual(outcome, { kind: "navigate", path: "/inventory/assets/asset-1" });
});

test("resolveGlobalAssetLookup surfaces lookup errors", async () => {
  const outcome = await resolveGlobalAssetLookup("MISSING", async () => {
    throw new Error("no asset found");
  });
  assert.equal(outcome.kind, "error");
  if (outcome.kind === "error") {
    assert.match(outcome.message, /no asset found/);
  }
});
