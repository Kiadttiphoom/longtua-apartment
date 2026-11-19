import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const queryBuilderSrc = source("../lib/db/query-builder.ts");

test("queryBuilder_upsert_resolvesKnownTablePrimaryKeys", () => {
  assert.match(queryBuilderSrc, /system_settings:\s*"key"/);
  assert.match(queryBuilderSrc, /system_admins:\s*"user_id"/);
  assert.match(queryBuilderSrc, /property_settings:\s*"property_id"/);
  assert.match(queryBuilderSrc, /platform_permissions:\s*"code"/);
  assert.match(queryBuilderSrc, /auth_login_aliases:\s*"username"/);
  assert.match(queryBuilderSrc, /ON CONFLICT \(\$\{conflictClause\}\) DO UPDATE SET/);
});
