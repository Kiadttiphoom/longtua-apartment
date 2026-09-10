import test from "node:test";
import assert from "node:assert/strict";
import { monitorFilters } from "../lib/monitor/filters.mjs";

test("monitorFilters_dateRangeUsesBangkokAndIncludesWholeEndDate", () => {
  const f = monitorFilters({ from: "2026-09-10", to: "2026-09-10" });
  assert.equal(f.start_at, "2026-09-09T17:00:00.000Z");
  assert.equal(f.end_at, "2026-09-10T17:00:00.000Z");
  assert.equal(f.bucket, "hour");
});
test("monitorFilters_defaultsToSevenThaiCalendarDays", () => {
  const f = monitorFilters({}, new Date("2026-09-09T18:00:00Z"));
  assert.equal(f.defaults.from, "2026-09-04");
  assert.equal(f.defaults.to, "2026-09-10");
});
test("monitorFilters_monthAndYearHandleLeapYearsAndYearRollover", () => {
  const feb = monitorFilters({ mode: "month", month: "2024-02" });
  assert.equal((new Date(feb.end_at) - new Date(feb.start_at)) / 86400000, 29);
  const december = monitorFilters({ mode: "month", month: "2026-12" });
  assert.equal(december.end_at, "2026-12-31T17:00:00.000Z");
  const year = monitorFilters({ mode: "year", year: "2024" });
  assert.equal((new Date(year.end_at) - new Date(year.start_at)) / 86400000, 366);
  assert.equal(year.bucket, "month");
});
test("monitorFilters_combinesTimeNamesOutcomeSearchAndPagination", () => {
  const f = monitorFilters({ timeFrom: "22:30", timeTo: "02:15", organization: " หอทดสอบ ", actor: " owner ", q: "23505", outcome: "error", page: "3" });
  assert.equal(f.start_time, "22:30");
  assert.equal(f.end_time, "02:15");
  assert.equal(f.organization_search, "หอทดสอบ");
  assert.equal(f.actor_search, "owner");
  assert.equal(f.search_text, "23505");
  assert.equal(f.result_filter, "error");
  assert.equal(f.page_number, 3);
});
test("monitorFilters_rejectsInvalidDatesRangesAndTimes", () => {
  for (const invalid of [{ from: "2026-02-30" }, { from: "2026-09-11", to: "2026-09-10" }, { from: "2020-01-01", to: "2026-01-01" }, { mode: "month", month: "2026-13" }, { mode: "year", year: "1999" }, { timeFrom: "24:00" }, { page: "-1" }, { outcome: "anything" }]) {
    assert.throws(() => monitorFilters(invalid));
  }
});
