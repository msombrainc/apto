import test from "node:test";
import assert from "node:assert/strict";
import { createAccount } from "../../apps/web/src/api.ts";

test("createAccount surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 409,
      json: async () => ({ error: "account code already exists." }),
    }) as Response;

  await assert.rejects(
    () =>
      createAccount({
        name: "A",
        code: "DUP",
        slaReceivingDays: 0,
        slaProcessingDays: 0,
        slaShippingDays: 0,
      }),
    /account code already exists/,
  );

  globalThis.fetch = original;
});

test("createAccount returns parsed account on success", async () => {
  const original = globalThis.fetch;
  const payload = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Acme",
    code: "ACME",
    slaReceivingDays: 1,
    slaProcessingDays: 2,
    slaShippingDays: 3,
    createdAtUtc: "2026-01-01T00:00:00Z",
  };
  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 201,
      json: async () => payload,
    }) as Response;

  const result = await createAccount({
    name: "Acme",
    code: "ACME",
    slaReceivingDays: 1,
    slaProcessingDays: 2,
    slaShippingDays: 3,
  });
  assert.equal(result.code, "ACME");

  globalThis.fetch = original;
});
