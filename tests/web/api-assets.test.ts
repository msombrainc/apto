import test from "node:test";
import assert from "node:assert/strict";
import {
  createJobAsset,
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
