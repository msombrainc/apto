import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../../apps/web/src/api.ts";

test("listJobs encodes accountId filter", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return {
      ok: true,
      status: 200,
      json: async () => [],
    } as Response;
  };

  await listJobs("acc-123");
  assert.ok(requested.includes("accountId=acc-123"));

  globalThis.fetch = original;
});

test("listJobs throws on non-OK", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 500,
    }) as Response;

  await assert.rejects(() => listJobs(), /list jobs failed: 500/);

  globalThis.fetch = original;
});

test("createJob surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 400,
      json: async () => ({ error: "facility must be GA, TX, or CA." }),
    }) as Response;

  await assert.rejects(
    () =>
      createJob({
        accountId: "a",
        startDateUtc: "2026-10-01T00:00:00Z",
        facilityCode: "NY",
      }),
    /facility must be GA/,
  );

  globalThis.fetch = original;
});

test("createJob returns parsed job on success", async () => {
  const original = globalThis.fetch;
  const payload = {
    id: "00000000-0000-0000-0000-000000000002",
    accountId: "00000000-0000-0000-0000-000000000001",
    accountName: "Acme",
    facilityCode: "GA",
    opsStatus: "intake",
    startDateUtc: "2026-10-01T00:00:00Z",
    dueDateUtc: "2026-10-11T00:00:00Z",
    slaTotalDays: 10,
    daysRemaining: 5,
    slaStatus: "on-track",
    createdAtUtc: "2026-10-01T00:00:00Z",
  };
  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 201,
      json: async () => payload,
    }) as Response;

  const result = await createJob({
    accountId: payload.accountId,
    startDateUtc: payload.startDateUtc!,
    facilityCode: "GA",
  });
  assert.equal(result.slaStatus, "on-track");

  globalThis.fetch = original;
});
