const monthKey = (value) => String(value ?? "").slice(0, 7);

export function getBangkokToday(now = new Date()) {
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getBangkokPeriodMonth(now = new Date()) {
  return getBangkokToday(now).slice(0, 7);
}

export function getRelatedPeriodMonth(relation) {
  const record = Array.isArray(relation) ? relation[0] : relation;
  return record && typeof record === "object" && typeof record.period_month === "string" ? record.period_month : "";
}

export function getMeterReadingDefaults(readings, meterId, periodMonth) {
  if (!meterId || !/^\d{4}-\d{2}$/.test(periodMonth)) {
    return { mode: "waiting", previousValue: "0", currentValue: "", sourcePeriod: null };
  }

  const meterReadings = readings.filter((reading) => reading.meter_id === meterId && monthKey(reading.period_month));
  const existing = meterReadings.find((reading) => monthKey(reading.period_month) === periodMonth);
  if (existing) {
    return {
      mode: "edit",
      previousValue: String(existing.previous_value),
      currentValue: String(existing.current_value),
      recordedAt: existing.read_at ? getBangkokToday(existing.read_at) : "",
      sourcePeriod: periodMonth,
    };
  }

  const previous = meterReadings
    .filter((reading) => monthKey(reading.period_month) < periodMonth)
    .sort((left, right) => monthKey(right.period_month).localeCompare(monthKey(left.period_month)))[0];

  return previous
    ? { mode: "next", previousValue: String(previous.current_value), currentValue: "", sourcePeriod: monthKey(previous.period_month) }
    : { mode: "first", previousValue: "0", currentValue: "", sourcePeriod: null };
}

export function formatThaiBillingMonth(periodMonth) {
  const normalizedMonth = monthKey(periodMonth);
  if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return "";
  const [year, month] = normalizedMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}
