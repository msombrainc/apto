async function createAccount(body) {
  const res = await fetch("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `create failed: ${res.status}`);
  }
  return res.json();
}

import test from "node:test";
import assert from "node:assert/strict";

test("createAccount surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ error: "account code already exists." }),
  });

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
  globalThis.fetch = async () => ({
    ok: true,
    status: 201,
    json: async () => payload,
  });

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
