import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInventoryCsv,
  loadSavedInventorySearches,
  persistSavedInventorySearches,
} from "../../apps/web/src/inventorySavedSearches.ts";

test("buildInventoryCsv quotes fields with commas", () => {
  const csv = buildInventoryCsv([
    {
      aptoId: "A1",
      serialNumber: 'SN,1',
      partNumber: "P",
      categoryName: null,
      grade: null,
      status: null,
      locationName: null,
      accountName: "Acme",
      facilityCode: "GA",
      jobId: "job",
      createdAtUtc: "2026-01-01",
    },
  ]);
  assert.ok(csv.includes('"SN,1"'));
});

test("loadSavedInventorySearches returns empty on invalid JSON", () => {
  const storage = new Map<string, string>();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  storage.set("apto-inventory-saved-searches-v1", "not-json");
  assert.deepEqual(loadSavedInventorySearches(), []);
  globalThis.localStorage = original;
});

test("persistSavedInventorySearches round-trips", () => {
  const storage = new Map<string, string>();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  persistSavedInventorySearches([
    {
      id: "1",
      name: "Mine",
      params: { q: "", pageSize: 50, sortBy: "created", sortDir: "desc" },
      visibleColumns: ["apto"],
    },
  ]);
  const loaded = loadSavedInventorySearches();
  assert.equal(loaded[0]?.name, "Mine");
  globalThis.localStorage = original;
});
