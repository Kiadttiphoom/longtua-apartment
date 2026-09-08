import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateLeaseContent, resolveLeaseText, moveLeaseClause } from "../lib/contracts/lease-content.mjs";

const defaults = JSON.parse(readFileSync(new URL("../lib/contracts/default-lease-content.json", import.meta.url), "utf8"));
const sample = () => structuredClone(defaults);

test("original 15 clauses remain editable and all dynamic fields are supported", () => {
  assert.equal(defaults.clauses.length, 15);
  assert.equal(validateLeaseContent(defaults), null);
  const content = sample();
  content.clauses[9].body = "คืนเงินประกันตามข้อตกลงเพิ่มเติมของคู่สัญญา";
  content.clauses.push({ id: "additional", title: "กฎหอพัก", body: "งดส่งเสียงดังหลัง 22.00 น." });
  assert.equal(validateLeaseContent(content), null);
  assert.notEqual(content.clauses[9].body, defaults.clauses[9].body);
});

test("reordering moves whole clauses without mutating a saved version", () => {
  const content = sample();
  const moved = moveLeaseClause(content.clauses, 9, -1);
  assert.equal(moved[8].id, "clause-10");
  assert.equal(moved[9].id, "clause-9");
  assert.deepEqual(content, defaults);
  assert.equal(moveLeaseClause(content.clauses, 0, -1), content.clauses);
  assert.equal(moveLeaseClause(content.clauses, 14, 1), content.clauses);
});

test("templates resolve per tenant and do not recursively interpret tenant text", () => {
  const template = "ผู้เช่า {{tenantName}} ห้อง {{roomNumber}} ค่าเช่า {{rentAmount}}";
  assert.equal(resolveLeaseText(template, { tenantName: "สมชาย", roomNumber: "101", rentAmount: "3,500 บาท" }), "ผู้เช่า สมชาย ห้อง 101 ค่าเช่า 3,500 บาท");
  assert.equal(resolveLeaseText(template, { tenantName: "สมหญิง", roomNumber: "202", rentAmount: "4,500 บาท" }), "ผู้เช่า สมหญิง ห้อง 202 ค่าเช่า 4,500 บาท");
  assert.equal(resolveLeaseText("{{ tenantName }}", { tenantName: "{{rentAmount}}" }), "{{rentAmount}}");
  assert.equal(resolveLeaseText("{{constructor}}", {}), "{{constructor}}");
});

test("unknown, malformed, and prototype tokens cannot be saved", () => {
  for (const body of ["{{unknown}}", "{{constructor}}", "{{__proto__}}", "{{tenantName}", "{{}}", "{{ tenantName } extra}"]) {
    const content = sample(); content.clauses[0].body = body;
    assert.ok(validateLeaseContent(content), body);
  }
});

test("invalid, oversized and duplicate clause payloads are rejected", () => {
  for (const value of [null, {}, [], { ...sample(), version: 2 }, { ...sample(), title: " " }, { ...sample(), clauses: [] }]) assert.ok(validateLeaseContent(value));
  const duplicate = sample(); duplicate.clauses[1].id = duplicate.clauses[0].id;
  assert.ok(validateLeaseContent(duplicate));
  const oversized = sample(); oversized.clauses[0].body = "ก".repeat(12001);
  assert.ok(validateLeaseContent(oversized));
  const empty = sample(); empty.clauses[0].body = "  ";
  assert.ok(validateLeaseContent(empty));
  const total = sample(); total.clauses.forEach(clause => { clause.body = "ก".repeat(10000); });
  assert.ok(validateLeaseContent(total));
});
