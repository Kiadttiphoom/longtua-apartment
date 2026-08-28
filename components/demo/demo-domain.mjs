export function calculateInvoice(room, settings) {
  if (!room.tenant || room.tenant === "(ว่าง)" || room.newElec === null || room.newElec < room.prevElec) return null;

  const units = room.newElec - room.prevElec;
  const electricCost = units * settings.electricRate;
  return {
    units,
    electricCost,
    waterCost: settings.waterRate,
    total: room.rent + electricCost + settings.waterRate,
  };
}

export function filterRows(rows, searchTerm, columnFilters = []) {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("th");
  return rows.filter((row) => {
    const matchesSearch = !normalizedSearch || row.some((cell) =>
      String(cell).toLocaleLowerCase("th").includes(normalizedSearch));
    const matchesFilters = columnFilters.every(({ column, value }) =>
      !value || row[column] === value);
    return matchesSearch && matchesFilters;
  });
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  if (password.length < 8) errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  return errors;
}

export function validateRegistration(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = "กรุณากรอกชื่อ";
  if (!values.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
  if (!/^0\d{8,9}$/.test(values.phone.replace(/[-\s]/g, ""))) errors.phone = "กรุณากรอกเบอร์โทร 9–10 หลัก";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  if (values.password.length < 8) errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  if (!values.accepted) errors.accepted = "กรุณายอมรับเงื่อนไขการใช้งาน";
  return errors;
}

export function toCsv(headers, rows) {
  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
