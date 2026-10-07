import test from "node:test";
import assert from "node:assert/strict";
import { listAccounts } from "../../apps/web/src/api.ts";

test("listAccounts returns parsed array", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "1",
          name: "A",
          code: "A1",
          slaReceivingDays: 0,
          slaProcessingDays: 0,
          slaShippingDays: 0,
          createdAtUtc: "2026-01-01T00:00:00Z",
        },
      ],
    }) as Response;

  const rows = await listAccounts();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].code, "A1");

  globalThis.fetch = original;
});

test("listAccounts throws on non-OK", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 500,
    }) as Response;

  await assert.rejects(() => listAccounts(), /list failed: 500/);

  globalThis.fetch = original;
});
