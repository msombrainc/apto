import test from "node:test";
import assert from "node:assert/strict";
import {
  createJobAsset,
  getAsset,
  listInventoryAssets,
  listJobAssets,
  searchPartNumbers,
  updateAsset,
} from "../../apps/web/src/api.ts";

test("searchPartNumbers encodes query", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return { ok: true, status: 200, json: async () => [] } as Response;
  };

  await searchPartNumbers("lap top");
  assert.ok(requested.includes("part-numbers?q="));
  assert.ok(requested.includes(encodeURIComponent("lap top")));

  globalThis.fetch = original;
});

test("createJobAsset sends X-Apto-User header", async () => {
  const original = globalThis.fetch;
  let headers: Record<string, string> | undefined;
  globalThis.fetch = async (_input, init) => {
    headers = init?.headers as Record<string, string>;
    return {
      ok: true,
      status: 201,
      json: async () => ({
        id: "a",
        jobId: "j",
        partNumberId: null,
        partNumber: "P",
        serialNumber: null,
        createdAtUtc: "2026-01-01T00:00:00Z",
        changeLog: [],
      }),
    } as Response;
  };

  await createJobAsset("job-1", { newPartNumber: "P-1" });
  assert.equal(headers?.["X-Apto-User"], "demo");

  globalThis.fetch = original;
});

test("listJobAssets throws on non-OK", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 }) as Response;

  await assert.rejects(() => listJobAssets("missing"), /list assets failed: 404/);

  globalThis.fetch = original;
});

test("getAsset requests asset URL and throws on non-OK", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return { ok: false, status: 404 } as Response;
  };

  await assert.rejects(() => getAsset("asset-99"), /get asset failed: 404/);
  assert.ok(requested.endsWith("/api/assets/asset-99"));

  globalThis.fetch = original;
});

test("updateAsset sends X-Apto-User header", async () => {
  const original = globalThis.fetch;
  let headers: Record<string, string> | undefined;
  globalThis.fetch = async (_input, init) => {
    headers = init?.headers as Record<string, string>;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "a",
        jobId: "j",
        partNumberId: null,
        partNumber: null,
        serialNumber: "NEW",
        createdAtUtc: "2026-01-01T00:00:00Z",
        changeLog: [],
      }),
    } as Response;
  };

  await updateAsset("asset-1", { serialNumber: "NEW" });
  assert.equal(headers?.["X-Apto-User"], "demo");

  globalThis.fetch = original;
});

test("createJobAsset surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 400,
      json: async () => ({ error: "part number is required." }),
    }) as Response;

  await assert.rejects(
    () => createJobAsset("job-1", { serialNumber: "x" }),
    /part number is required/,
  );

  globalThis.fetch = original;
});

test("updateAsset surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 400,
      json: async () => ({ error: "no changes supplied." }),
    }) as Response;

  await assert.rejects(
    () => updateAsset("asset-1", { serialNumber: "x" }),
    /no changes supplied/,
  );

  globalThis.fetch = original;
});

test("listInventoryAssets builds query string", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return { ok: true, status: 200, json: async () => [] } as Response;
  };

  await listInventoryAssets({
    q: "sn-1",
    accountId: "acc",
    facilityCode: "GA",
  });
  assert.ok(requested.includes("/api/assets?"));
  assert.ok(requested.includes("q=sn-1"));
  assert.ok(requested.includes("accountId=acc"));
  assert.ok(requested.includes("facilityCode=GA"));

  globalThis.fetch = original;
});
