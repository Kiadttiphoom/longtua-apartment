const monthKey = (value) => String(value ?? "").slice(0, 7);

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
  if (!/^\d{4}-\d{2}$/.test(periodMonth ?? "")) return "";
  const [year, month] = periodMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}
