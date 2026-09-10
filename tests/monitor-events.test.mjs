import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../lib/monitor/events.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function logger({ accessible = true, storageFailure = false } = {}) {
  const events = [], tasks = [];
  const org = "11111111-1111-4111-8111-111111111111";
  const modules = {
    "next/server": { after: (callback) => tasks.push(callback) },
    "next/headers": { cookies: async () => ({ get: () => ({ value: org }) }) },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { sub: "actor" } } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: accessible ? { id: org } : null }) }) }) }) }) },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from: () => ({ insert: async (event) => { if (storageFailure) throw new Error("storage unavailable"); events.push(event); return { error: null }; } }) }) },
    "@/lib/portal/context": { IMPERSONATE_ORGANIZATION_COOKIE: "impersonate", ACTIVE_ORGANIZATION_COOKIE: "active" },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: (name) => modules[name] ?? {}, console: { error() {} } });
  return { exports, events, tasks, org };
}

test("monitorEvents_recordsActorOrganizationErrorCodeWithoutExceptionSecrets", async () => {
  const h = logger();
  h.exports.scheduleMonitorEvent("invoice.create", "error", "request-123", { code: "23505", message: "secret-password", details: "private-data" });
  assert.equal(h.events.length, 0);
  await h.tasks[0]();
  assert.equal(h.events[0].actor_user_id, "actor");
  assert.equal(h.events[0].organization_id, h.org);
  assert.equal(h.events[0].error_code, "23505");
  assert.equal(h.events[0].request_id, "request-123");
  assert.equal(JSON.stringify(h.events).includes("secret-password"), false);
  assert.equal(JSON.stringify(h.events).includes("private-data"), false);
});

test("monitorEvents_doesNotTrustInaccessibleOrganizationCookieOrBreakBusinessOnStorageFailure", async () => {
  const h = logger({ accessible: false });
  h.exports.scheduleMonitorEvent("test", "error");
  await h.tasks[0]();
  assert.equal(h.events[0].organization_id, null);
  const unavailable = logger({ storageFailure: true });
  await assert.doesNotReject(unavailable.exports.recordMonitorEvent({ action: "test", outcome: "error", source: "test" }));
});
