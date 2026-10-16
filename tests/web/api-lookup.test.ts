import test from "node:test";
import assert from "node:assert/strict";
import { lookupAssetByCode } from "../../apps/web/src/api.ts";

test("lookupAssetByCode encodes code query", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "id-1",
        aptoId: "A0000001",
        serialNumber: null,
        jobId: "j",
        facilityCode: "GA",
        grade: null,
        status: null,
        locationId: null,
        locationName: null,
        partNumber: "P-1",
      }),
    } as Response;
  };

  const result = await lookupAssetByCode(" A0000001 ");
  assert.equal(result.aptoId, "A0000001");
  assert.ok(requested.includes("/api/assets/lookup?"));
  assert.ok(requested.includes(encodeURIComponent("A0000001")));

  globalThis.fetch = original;
});

test("lookupAssetByCode surfaces API error text", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 404,
      json: async () => ({ error: "no asset found for that code." }),
    }) as Response;

  await assert.rejects(
    () => lookupAssetByCode("MISSING"),
    /no asset found/,
  );

  globalThis.fetch = original;
});
