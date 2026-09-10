import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const org = "11111111-1111-4111-8111-111111111111";
const actor = "22222222-2222-4222-8222-222222222222";
const migration = readFileSync(new URL("../supabase/migrations/20260910100055_admin_monitor.sql", import.meta.url), "utf8");

before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.actor', true), '')::uuid $$;
    create table public.organizations (id uuid primary key, name text);
    create table public.profiles (id uuid primary key, display_name text, username text);
    create table public.rooms (id uuid primary key, organization_id uuid, room_number text, secret text);
    create table public.audit_logs (created_at timestamptz, organization_id uuid, actor_user_id uuid, action text, entity_type text, entity_id uuid);
    create table public.platform_audit_logs (created_at timestamptz, actor_user_id uuid, action text, entity_type text, entity_id text, request_id uuid);
    insert into organizations values ('${org}', 'หอทดสอบ 100%_');
    insert into profiles values ('${actor}', 'พิม', 'owner.a');
    insert into audit_logs values ('2026-09-09T18:00:00Z', '${org}', '${actor}', 'room.created', 'room', '${org}');
    select set_config('test.actor', '${actor}', false);
  `);
  await db.exec(migration);
});
after(async () => { await db.close(); });

async function query(overrides = {}) {
  const f = { start: "2026-09-09T17:00:00Z", end: "2026-09-10T17:00:00Z", timeFrom: "00:00", timeTo: "23:59", organization: "", person: "", search: "", outcome: "all", bucket: "hour", page: 1, ...overrides };
  const result = await db.query("select public.query_admin_monitor($1::timestamptz,$2::timestamptz,$3::time,$4::time,$5,$6,$7,$8,$9,$10::integer) as data", Object.values(f));
  return result.rows[0].data;
}

test("monitorDatabase_migrationBackfillsHistoricalAuditWithNames", async () => {
  const result = await query();
  assert.equal(result.total, 1);
  assert.equal(result.rows[0].actor_name, "พิม · owner.a");
  assert.equal(result.rows[0].organization_name, "หอทดสอบ 100%_");
});

test("monitorDatabase_tracksCreateUpdateDeleteWithoutSensitiveRowContents", async () => {
  await db.exec(`truncate monitor_events;
    insert into rooms values ('${org}', '${org}', '101', 'DO-NOT-LOG-SECRET');
    update rooms set room_number = '102' where id = '${org}';
    delete from rooms where id = '${org}';`);
  const { rows } = await db.query("select * from monitor_events order by id");
  assert.deepEqual(rows.map((e) => e.action), ["rooms.insert", "rooms.update", "rooms.delete"]);
  assert.equal(rows.every((e) => e.actor_user_id === actor && e.organization_id === org), true);
  assert.equal(JSON.stringify(rows).includes("DO-NOT-LOG-SECRET"), false);
});

test("monitorDatabase_combinesDateTimeOutcomeCompanyPersonAndErrorSearch", async () => {
  await db.exec(`truncate monitor_events;
    insert into monitor_events (occurred_at,organization_id,actor_user_id,action,outcome,source,error_code) values
    ('2026-09-09T17:30:00Z','${org}','${actor}','invoice.create','error','server','23505'),
    ('2026-09-10T16:59:59Z','${org}','${actor}','invoice.create','error','server','23505'),
    ('2026-09-10T17:00:00Z','${org}','${actor}','invoice.create','error','server','23505'),
    ('2026-09-10T06:00:00Z','${org}','${actor}','invoice.create','error','server','23505'),
    ('2026-09-09T18:00:00Z','${org}','${actor}','invoice.create','success','server',null);`);
  const result = await query({ timeFrom: "22:00", timeTo: "02:00", organization: "100%_", person: "OWNER.A", search: "23505", outcome: "error" });
  assert.equal(result.total, 2);
  assert.equal(result.errors, 2);
  assert.equal(result.users, 1);
  assert.equal(result.organizations, 1);
  assert.equal(result.series.reduce((sum, p) => sum + p.errors, 0), 2);
  assert.equal((await query({ timeFrom: "23:59", timeTo: "23:59" })).total, 1);
});

test("monitorDatabase_graphsAggregateAllMatchesBeyondCurrentPageAndFillZeroBuckets", async () => {
  await db.exec(`truncate monitor_events;
    insert into monitor_events (occurred_at,organization_id,actor_user_id,action,outcome,source)
    select '2026-09-10T03:00:00Z', '${org}', '${actor}', 'rooms.update', 'success', 'database' from generate_series(1,75);`);
  const first = await query();
  const second = await query({ page: 2 });
  assert.equal(first.total, 75);
  assert.equal(first.rows.length, 50);
  assert.equal(second.rows.length, 25);
  assert.equal(new Set([...first.rows, ...second.rows].map((r) => r.id)).size, 75);
  assert.equal(first.series.length, 24);
  assert.equal(first.series.filter((p) => p.success === 0).length, 23);
  assert.equal(first.series.reduce((sum, p) => sum + p.success, 0), 75);
  assert.deepEqual(first.series, second.series);
  assert.equal(first.actions[0].total, 75);
});

test("monitorDatabase_emptyFiltersReturnZeroAndOrdinaryUsersCannotReadLogs", async () => {
  const empty = await query({ person: "ไม่พบผู้ใช้นี้" });
  assert.equal(empty.total, 0);
  assert.equal(empty.rows.length, 0);
  assert.equal(empty.series.every((p) => p.success === 0 && p.errors === 0), true);
  await db.exec("set role authenticated");
  try {
    await assert.rejects(db.query("select * from public.monitor_events"), /permission denied/);
    await assert.rejects(query(), /permission denied/);
  } finally { await db.exec("reset role"); }
});
