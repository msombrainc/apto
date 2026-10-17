import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installDocumentScrollLock } from "../../apps/web/src/shellScrollLock.ts";

function mockDoc(initialHtml = 0, initialBody = 0) {
  const listeners = new Map<string, Set<() => void>>();
  const html = { scrollTop: initialHtml };
  const body = { scrollTop: initialBody };
  const doc = {
    documentElement: html,
    body,
  } as unknown as Document;
  const win = {
    addEventListener(type: string, fn: () => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: () => void) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type: string) {
      for (const fn of listeners.get(type) ?? []) fn();
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
  return { doc, win, html, body };
}

describe("installDocumentScrollLock (apto#112)", () => {
  it("zeros scrollTop on install", () => {
    const { doc, win, html, body } = mockDoc(12, 4);
    const dispose = installDocumentScrollLock(doc, win as unknown as Window);
    assert.equal(html.scrollTop, 0);
    assert.equal(body.scrollTop, 0);
    dispose();
  });

  it("clamps documentElement.scrollTop back to 0 on scroll (Jobs OpenSpec)", () => {
    const { doc, win, html, body } = mockDoc(0, 0);
    const dispose = installDocumentScrollLock(doc, win as unknown as Window);
    html.scrollTop = 9;
    body.scrollTop = 0;
    win.dispatch("scroll");
    assert.equal(html.scrollTop, 0);
    assert.equal(body.scrollTop, 0);
    dispose();
    assert.equal(win.listenerCount("scroll"), 0);
  });
});
