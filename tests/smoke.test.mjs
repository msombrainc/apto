import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("render-stg-env emits QuickBooks keys when QBO secrets present", () => {
  const out = execFileSync("bash", [join(root, "deploy/droplet/render-stg-env.sh")], {
    env: {
      ...process.env,
      APTO_STG_QBO_CLIENT_ID: "cid",
      APTO_STG_QBO_CLIENT_SECRET: "sec",
      APTO_STG_QBO_REALM_ID: "realm",
      APTO_STG_QBO_REFRESH_TOKEN: "rt",
    },
    encoding: "utf8",
  });
  assert.match(out, /QuickBooks__ClientId=cid/);
  assert.match(out, /QuickBooks__BootstrapRealmId=realm/);
  assert.match(out, /ConnectionStrings__Default=Data Source=/);
});
