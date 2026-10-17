import assert from "node:assert/strict";
import test from "node:test";
import { parseJobInvoice } from "../../apps/web/src/routing/moduleMap.ts";
import { jobInvoicePath } from "../../apps/web/src/routing/paths.ts";

test("job invoice path round-trip", () => {
  const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const path = jobInvoicePath(id);
  assert.equal(parseJobInvoice(path), id);
  assert.equal(parseJobInvoice(`${path}/`), id);
});
