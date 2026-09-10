const DAY = 86400000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function validDate(value) {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function monitorFilters(params = {}, now = new Date()) {
  const today = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  const text = (key, fallback = "") => typeof params[key] === "string" ? params[key].trim() : fallback;
  const mode = text("mode", "date");
  let from;
  let until;
  if (mode === "year") {
    const year = text("year", today.slice(0, 4));
    if (!/^\d{4}$/.test(year) || Number(year) < 2000 || Number(year) > 2100) throw new Error("กรุณาระบุปี ค.ศ. ระหว่าง 2000–2100");
    from = `${year}-01-01`;
    until = `${Number(year) + 1}-01-01`;
  } else if (mode === "month") {
    const month = text("month", today.slice(0, 7));
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !validDate(`${month}-01`)) throw new Error("กรุณาระบุเดือนให้ถูกต้อง");
    from = `${month}-01`;
    const next = new Date(`${from}T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    until = next.toISOString().slice(0, 10);
  } else if (mode === "date") {
    from = text("from", new Date(new Date(`${today}T00:00:00Z`).getTime() - 6 * DAY).toISOString().slice(0, 10));
    const to = text("to", today);
    if (!validDate(from) || !validDate(to)) throw new Error("กรุณาระบุวันที่ให้ถูกต้อง");
    until = new Date(new Date(`${to}T00:00:00Z`).getTime() + DAY).toISOString().slice(0, 10);
  } else throw new Error("รูปแบบช่วงเวลาไม่ถูกต้อง");
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(`${until}T00:00:00+07:00`);
  const days = (end - start) / DAY;
  if (days <= 0 || days > 370) throw new Error("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด และเลือกได้ไม่เกิน 370 วัน");
  const startTime = text("timeFrom", "00:00"), endTime = text("timeTo", "23:59");
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) throw new Error("กรุณาระบุเวลาให้ถูกต้อง");
  const outcome = text("outcome", "all");
  if (!["all", "success", "error"].includes(outcome)) throw new Error("สถานะไม่ถูกต้อง");
  const page = Number(text("page", "1"));
  if (!Number.isInteger(page) || page < 1 || page > 100000) throw new Error("หน้าที่เลือกไม่ถูกต้อง");
  return { start_at: start.toISOString(), end_at: end.toISOString(), start_time: startTime, end_time: endTime,
    organization_search: text("organization").slice(0, 160), actor_search: text("actor").slice(0, 160), search_text: text("q").slice(0, 200),
    result_filter: outcome, bucket: mode === "year" ? "month" : days <= 2 ? "hour" : "day", page_number: page,
    defaults: { mode, from, to: new Date(end.getTime() + 7 * 3600000 - DAY).toISOString().slice(0, 10), month: from.slice(0, 7), year: from.slice(0, 4) } };
}
