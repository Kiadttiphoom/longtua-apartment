export const LEASE_TOKENS = {
  roomNumber: "เลขห้อง", floor: "ชั้น", propertyName: "ชื่อหอพัก", propertyAddress: "ที่อยู่หอพัก",
  tenantName: "ชื่อผู้เช่า", landlordName: "ชื่อผู้ให้เช่า", occupantCount: "จำนวนผู้พัก",
  startDate: "วันเริ่มสัญญา", endDate: "วันสิ้นสุดสัญญา", rentAmount: "ค่าเช่าพร้อมตัวอักษร",
  depositAmount: "เงินประกันพร้อมตัวอักษร", advanceAmount: "เงินล่วงหน้าพร้อมตัวอักษร",
  totalUpfront: "เงินแรกเข้ารวม", dueDay: "วันครบกำหนดชำระ", electricRate: "อัตราค่าไฟ",
  waterCalculation: "วิธีคิดค่าน้ำ", customTerms: "ข้อตกลงจากข้อมูลสัญญา",
};

/** Strict shared validation: never persist arbitrary HTML or unknown dynamic fields. */
export function validateLeaseContent(value) {
  if (!value || typeof value !== "object" || value.version !== 1 || typeof value.title !== "string" || !value.title.trim() || value.title.length > 160) return "กรุณาระบุชื่อเอกสารไม่เกิน 160 ตัวอักษร";
  if (!Array.isArray(value.clauses) || value.clauses.length < 1 || value.clauses.length > 50) return "สัญญาต้องมี 1–50 ข้อ";
  const ids = new Set();
  let total = 0;
  for (const clause of value.clauses) {
    if (!clause || typeof clause.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(clause.id) || ids.has(clause.id)) return "รหัสข้อสัญญาไม่ถูกต้องหรือซ้ำกัน";
    ids.add(clause.id);
    if (typeof clause.title !== "string" || !clause.title.trim() || clause.title.length > 160) return "กรุณาระบุหัวข้อแต่ละข้อไม่เกิน 160 ตัวอักษร";
    if (typeof clause.body !== "string" || !clause.body.trim() || clause.body.length > 12000) return "กรุณาระบุเนื้อหาแต่ละข้อไม่เกิน 12,000 ตัวอักษร";
    total += clause.title.length + clause.body.length;
  }
  if (total > 100000) return "ข้อความสัญญายาวเกิน 100,000 ตัวอักษร";
  for (const text of [value.title, ...value.clauses.flatMap(c => [c.title, c.body])]) {
    for (const match of text.matchAll(/\{\{([^{}]*)\}\}/g)) {
      if (!Object.hasOwn(LEASE_TOKENS, match[1].trim())) return `ไม่รู้จักตัวแปร {{${match[1]}}}`;
    }
    if (/[{}]/.test(text.replace(/\{\{[^{}]*\}\}/g, ""))) return "กรุณาเขียนตัวแปรในรูปแบบ {{tenantName}} หรือเอาวงเล็บปีกกาที่ไม่ครบออก";
  }
  return null;
}

export function resolveLeaseText(text, values) {
  return text.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key] ?? "") : token);
}

export function moveLeaseClause(clauses, index, direction) {
  const nextIndex = index + direction;
  if (!Number.isInteger(index) || ![-1, 1].includes(direction) || index < 0 || index >= clauses.length || nextIndex < 0 || nextIndex >= clauses.length) return clauses;
  const result = [...clauses];
  [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  return result;
}
