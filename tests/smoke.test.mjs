import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "deploy/droplet/render-stg-env.sh");

function renderEnv(env) {
  return execFileSync("bash", [script], { env, encoding: "utf8" });
}

test("render-stg-env emits QuickBooks keys when QBO secrets present", () => {
  const out = renderEnv({
    PATH: process.env.PATH,
    APTO_DATA_DIR: "/tmp/apto-data",
    APTO_STG_QBO_CLIENT_ID: "cid",
    APTO_STG_QBO_CLIENT_SECRET: "sec",
    APTO_STG_QBO_REALM_ID: "realm",
    APTO_STG_QBO_REFRESH_TOKEN: "rt",
    APTO_STG_QBO_REDIRECT_URI: "http://example.test/api/qbo/oauth/callback",
  });
  assert.match(out, /QuickBooks__ClientId=cid/);
  assert.match(out, /QuickBooks__BootstrapRealmId=realm/);
  assert.match(out, /ConnectionStrings__Default=Data Source=/);
});

test("render-stg-env uses APTO_STG_CONNECTION_STRING when set", () => {
  const out = renderEnv({
    PATH: process.env.PATH,
    APTO_STG_CONNECTION_STRING: "Server=stg;Database=apto;",
  });
  assert.equal(out.trim(), "ConnectionStrings__Default=Server=stg;Database=apto;");
});

test("render-stg-env fails when CLIENT_ID set without CLIENT_SECRET", () => {
  assert.throws(
    () =>
      renderEnv({
        PATH: process.env.PATH,
        APTO_DATA_DIR: "/tmp/apto-data",
        APTO_STG_QBO_CLIENT_ID: "cid",
      }),
    /APTO_STG_QBO_CLIENT_SECRET required/,
  );
});
