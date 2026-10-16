import test from "node:test";
import assert from "node:assert/strict";
import { getQboStatus, listQboRequests, retryQboRequest } from "../../apps/web/src/api.ts";

test("listQboRequests encodes status and type filters", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested = typeof input === "string" ? input : input.toString();
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [], page: 1, pageSize: 50, total: 0 }),
    } as Response;
  };

  await listQboRequests({ status: "Failed", type: "CreateCustomer", page: 2 });
  assert.ok(requested.includes("status=Failed"));
  assert.ok(requested.includes("type=CreateCustomer"));
  assert.ok(requested.includes("page=2"));

  globalThis.fetch = original;
});

test("getQboStatus throws on failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as Response;

  await assert.rejects(() => getQboStatus(), /qbo status failed/);

  globalThis.fetch = original;
});

test("retryQboRequest posts to retry endpoint", async () => {
  const original = globalThis.fetch;
  let method = "";
  let url = "";
  globalThis.fetch = async (input, init) => {
    url = typeof input === "string" ? input : input.toString();
    method = init?.method ?? "GET";
    return { ok: true, status: 204 } as Response;
  };

  await retryQboRequest("req-1");
  assert.equal(method, "POST");
  assert.ok(url.endsWith("/api/qbo/requests/req-1/retry"));

  globalThis.fetch = original;
});
