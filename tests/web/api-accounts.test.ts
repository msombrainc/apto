import test from "node:test";
import assert from "node:assert/strict";
import {
  getAccount,
  listAccountChanges,
  postAccountQboSync,
  updateAccount,
} from "../../apps/web/src/api.ts";

test("getAccount requests account URL and throws on non-OK", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return { ok: false, status: 404 } as Response;
  };

  await assert.rejects(() => getAccount("acct-1"), /get account failed: 404/);
  assert.ok(requested.endsWith("/api/accounts/acct-1"));

  globalThis.fetch = original;
});

test("updateAccount PUTs JSON body and surfaces API error", async () => {
  const original = globalThis.fetch;
  let method = "";
  globalThis.fetch = async (_input, init) => {
    method = init?.method ?? "";
    return {
      ok: false,
      status: 400,
      json: async () => ({ error: "invalid apto %" }),
    } as Response;
  };

  await assert.rejects(
    () =>
      updateAccount("id-1", {
        name: "A",
        code: "C",
        status: "Active",
        slaReceivingDays: 1,
        slaProcessingDays: 1,
        slaShippingDays: 1,
      }),
    /invalid apto %/,
  );
  assert.equal(method, "PUT");

  globalThis.fetch = original;
});

test("listAccountChanges encodes query params", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [], page: 1, pageSize: 25, total: 0 }),
    } as Response;
  };

  await listAccountChanges("acc-9", { field: "Name", page: 2, pageSize: 10 });
  assert.ok(requested.includes("/api/accounts/acc-9/changes"));
  assert.ok(requested.includes("field=Name"));
  assert.ok(requested.includes("page=2"));
  assert.ok(requested.includes("pageSize=10"));

  globalThis.fetch = original;
});

test("postAccountQboSync POSTs qbo-sync endpoint", async () => {
  const original = globalThis.fetch;
  let requested = "";
  let method = "";
  globalThis.fetch = async (input: RequestInfo | URL, init) => {
    requested = typeof input === "string" ? input : input.toString();
    method = init?.method ?? "";
    return {
      ok: true,
      status: 202,
      json: async () => ({ requestId: "req-1" }),
    } as Response;
  };

  const body = await postAccountQboSync("acc-qbo");
  assert.equal(body.requestId, "req-1");
  assert.equal(method, "POST");
  assert.ok(requested.endsWith("/api/accounts/acc-qbo/qbo-sync"));

  globalThis.fetch = original;
});
