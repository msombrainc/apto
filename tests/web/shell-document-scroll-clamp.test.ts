import test from "node:test";
import assert from "node:assert/strict";
import {
  handleDocumentScroll,
  resetDocumentScrollTops,
} from "../../apps/web/src/shellDocumentScrollClamp.ts";

test("resetDocumentScrollTops clears document scroll (mount)", () => {
  const html = { scrollTop: 68 };
  const body = { scrollTop: 9 };
  resetDocumentScrollTops(html, body);
  assert.equal(html.scrollTop, 0);
  assert.equal(body.scrollTop, 0);
});

test("handleDocumentScroll clears drift after wheel/overflow (Jobs OpenSpec)", () => {
  const html = { scrollTop: 77 };
  const body = { scrollTop: 0 };
  handleDocumentScroll(html, body);
  assert.equal(html.scrollTop, 0);
  assert.equal(body.scrollTop, 0);
});
