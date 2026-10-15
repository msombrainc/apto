import test from "node:test";
import assert from "node:assert/strict";
import {
  createCategory,
  createReferenceItem,
  listReferenceItems,
} from "../../apps/web/src/api.ts";
import { DEMO_USER } from "../../apps/web/src/demoAuth.ts";

test("listReferenceItems encodes facilityId and sort params", async () => {
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

  await listReferenceItems("location", {
    facilityId: "fac-1",
    sortBy: "code",
    sortDir: "desc",
    q: "bay",
  });
  assert.ok(requested.includes("facilityId=fac-1"));
  assert.ok(requested.includes("sortBy=code"));
  assert.ok(requested.includes("sortDir=desc"));
  assert.ok(requested.includes("q=bay"));

  globalThis.fetch = original;
});

test("listReferenceItems surfaces API error message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 400,
      json: async () => ({ error: "facilityId is required for location lists." }),
    }) as Response;

  await assert.rejects(
    () => listReferenceItems("location"),
    /facilityId is required/,
  );

  globalThis.fetch = original;
});

test("createReferenceItem sends X-Apto-User header", async () => {
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
        id: "id",
        type: "grade",
        code: "G1",
        name: "G1",
        parentId: null,
        parentCode: null,
        parentName: null,
        group: null,
        certificateGroup: null,
        sortOrder: 1,
        isActive: true,
        inUseCount: 0,
      }),
    } as Response;
  };

  await createReferenceItem("grade", {
    code: "G1",
    name: "G1",
    sortOrder: 1,
  });
  assert.equal(userHeader, DEMO_USER);

  globalThis.fetch = original;
});

test("createCategory surfaces conflict error", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 409,
      json: async () => ({ error: "category name already exists." }),
    }) as Response;

  await assert.rejects(
    () => createCategory("Dup"),
    /category name already exists/,
  );

  globalThis.fetch = original;
});
