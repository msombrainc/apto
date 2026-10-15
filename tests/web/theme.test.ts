import test from "node:test";
import assert from "node:assert/strict";
import {
  readStoredTheme,
  resolveThemeFromStorageValue,
} from "../../apps/web/src/theme.tsx";

test("resolveThemeFromStorageValue maps light only when stored is light", () => {
  assert.equal(resolveThemeFromStorageValue("light"), "light");
  assert.equal(resolveThemeFromStorageValue(null), "dark");
  assert.equal(resolveThemeFromStorageValue("dark"), "dark");
  assert.equal(resolveThemeFromStorageValue("invalid"), "dark");
});

test("readStoredTheme uses getter and falls back to dark on throw", () => {
  assert.equal(readStoredTheme(() => "light"), "light");
  assert.equal(readStoredTheme(() => null), "dark");
  assert.equal(
    readStoredTheme(() => {
      throw new Error("storage blocked");
    }),
    "dark",
  );
});
