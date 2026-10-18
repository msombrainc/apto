import test from "node:test";
import assert from "node:assert/strict";
import {
  inventoryFiltersActive,
  type InventoryFilterFields,
} from "../../apps/web/src/inventoryFilters.ts";

const empty: InventoryFilterFields = {
  search: "",
  accountId: "",
  facility: "",
  grade: "",
  status: "",
  category: "",
  createdFrom: "",
  createdTo: "",
  pasteCodes: "",
};

test("inventoryFiltersActive is false for empty defaults", () => {
  assert.equal(inventoryFiltersActive(empty), false);
});

test("inventoryFiltersActive is true per field", () => {
  assert.equal(inventoryFiltersActive({ ...empty, search: "x" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, accountId: "a1" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, facility: "GA" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, grade: "A" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, status: "open" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, category: "cat" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, createdFrom: "2026-01-01" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, createdTo: "2026-12-31" }), true);
  assert.equal(inventoryFiltersActive({ ...empty, pasteCodes: "code" }), true);
});

test("inventoryFiltersActive ignores whitespace-only search and pasteCodes", () => {
  assert.equal(inventoryFiltersActive({ ...empty, search: "   " }), false);
  assert.equal(inventoryFiltersActive({ ...empty, pasteCodes: "  \t  " }), false);
});
