import test from "node:test";
import assert from "node:assert/strict";
import {
  createPartNumberAdmin,
  deletePartNumberAdmin,
  listPartNumbers,
  searchPartNumbers,
  updatePartNumberAdmin,
} from "../../apps/web/src/api.ts";
import { DEMO_USER } from "../../apps/web/src/demoAuth.ts";

test("listPartNumbers encodes paging and sort params", async () => {
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

  await listPartNumbers({
    q: "pn-1",
    page: 2,
    pageSize: 25,
    sortBy: "categoryName",
    sortDir: "desc",
  });
  assert.ok(requested.includes("q=pn-1"));
  assert.ok(requested.includes("page=2"));
  assert.ok(requested.includes("pageSize=25"));
  assert.ok(requested.includes("sortBy=categoryName"));
  assert.ok(requested.includes("sortDir=desc"));

  globalThis.fetch = original;
});

test("listPartNumbers surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 400,
      json: async () => ({ error: "invalid sort." }),
    }) as Response;

  await assert.rejects(() => listPartNumbers(), /invalid sort/);

  globalThis.fetch = original;
});

test("createPartNumberAdmin sends X-Apto-User header", async () => {
  const original = globalThis.fetch;
  let userHeader: string | undefined;
  globalThis.fetch = async (_input, init) => {
    const h = init?.headers;
    if (h instanceof Headers) {
      userHeader = h.get("X-Apto-User") ?? undefined;
    } else if (h && typeof h === "object") {
      userHeader = (h as Record<string, string>)["X-Apto-User"];
    }
    return {
      ok: true,
      status: 201,
      json: async () => ({
        id: "pn-id",
        number: "PN-1",
        categoryName: null,
      }),
    } as Response;
  };

  const row = await createPartNumberAdmin("PN-1", null);
  assert.equal(userHeader, DEMO_USER);
  assert.equal(row.number, "PN-1");
  assert.equal(row.assetCount, 0);

  globalThis.fetch = original;
});

test("updatePartNumberAdmin sends X-Apto-User on PUT", async () => {
  const original = globalThis.fetch;
  let method = "";
  let userHeader: string | undefined;
  globalThis.fetch = async (_input, init) => {
    method = init?.method ?? "";
    const h = init?.headers;
    if (h instanceof Headers) {
      userHeader = h.get("X-Apto-User") ?? undefined;
    } else if (h && typeof h === "object") {
      userHeader = (h as Record<string, string>)["X-Apto-User"];
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "pn-id",
        number: "PN-2",
        categoryId: null,
        categoryName: null,
        assetCount: 0,
      }),
    } as Response;
  };

  await updatePartNumberAdmin("pn-id", "PN-2", null);
  assert.equal(method, "PUT");
  assert.equal(userHeader, DEMO_USER);

  globalThis.fetch = original;
});

test("deletePartNumberAdmin encodes replacementId query", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input: RequestInfo | URL, init) => {
    requested = typeof input === "string" ? input : input.toString();
    return { ok: true, status: 204 } as Response;
  };

  await deletePartNumberAdmin("old-id", "new-id");
  assert.ok(requested.includes("/api/part-numbers/old-id"));
  assert.ok(requested.includes("replacementId=new-id"));

  globalThis.fetch = original;
});

test("searchPartNumbers accepts legacy array and paged items shape", async () => {
  const original = globalThis.fetch;
  const legacy = [{ id: "1", number: "A", categoryName: null }];
  const paged = { items: [{ id: "2", number: "B", categoryName: "Cat" }] };

  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 200,
      json: async () => legacy,
    }) as Response;
  const fromArray = await searchPartNumbers("A");
  assert.equal(fromArray.length, 1);
  assert.equal(fromArray[0].number, "A");

  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 200,
      json: async () => paged,
    }) as Response;
  const fromPaged = await searchPartNumbers("B");
  assert.equal(fromPaged.length, 1);
  assert.equal(fromPaged[0].number, "B");

  globalThis.fetch = original;
});
