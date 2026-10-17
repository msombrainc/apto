import test from "node:test";
import assert from "node:assert/strict";
import {
  F15_PROTOTYPE_BANNER_TEST_ID,
  F15_PROTOTYPE_BANNER_TEXT,
} from "../../apps/web/src/f15Contracts.ts";

test("F15 prototype banner contract (REQ-1501)", () => {
  assert.equal(
    F15_PROTOTYPE_BANNER_TEXT,
    "Prototype — sample data, not connected",
  );
  assert.equal(F15_PROTOTYPE_BANNER_TEST_ID, "f15-prototype-banner");
});
