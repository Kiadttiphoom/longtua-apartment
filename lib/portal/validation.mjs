const text = (values, key) => String(values[key] ?? "").trim();
const number = (values, key) => Number(text(values, key));
const uuid = (value) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);

export function validateDormitory(values) {
  const errors = {};
  const name = text(values, "name");
  if (!name) errors.name = "กรุณากรอกชื่อหอพัก";
  else if (name.length > 160) errors.name = "ชื่อหอพักต้องไม่เกิน 160 ตัวอักษร";
  if (text(values, "phone").length > 30) errors.phone = "เบอร์โทรศัพท์ยาวเกินไป";
  return errors;
}

export function validateGuestroom(values) {
  const errors = {};
  if (!uuid(text(values, "propertyId"))) errors.propertyId = "กรุณาเลือกหอพัก";
  const rent = number(values, "baseRent");
  if (!text(values, "baseRent")) errors.baseRent = "กรุณากรอกค่าเช่าต่อเดือน";
  else if (!Number.isFinite(rent) || rent < 0) errors.baseRent = "ค่าเช่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป";
  if (text(values, "floor").length > 40) errors.floor = "ชั้นต้องไม่เกิน 40 ตัวอักษร";
  return errors;
}

export function validateTenant(values) {
  const errors = {};
  const fullName = text(values, "fullName");
  if (fullName.length < 2) errors.fullName = "กรุณากรอกชื่อผู้เช่าอย่างน้อย 2 ตัวอักษร";
  else if (fullName.length > 160) errors.fullName = "ชื่อผู้เช่าต้องไม่เกิน 160 ตัวอักษร";
  const email = text(values, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  const last4 = text(values, "idCardLast4");
  if (last4 && !/^\d{4}$/.test(last4)) errors.idCardLast4 = "กรอกเลขบัตรประชาชนเฉพาะ 4 ตัวท้าย";
  return errors;
}

export function validateLease(values) {
  const errors = {};
  for (const [key, message] of (values.leaseId ? [] : [["propertyId", "กรุณาเลือกหอพัก"], ["roomId", "กรุณาเลือกห้องพัก"], ["tenantId", "กรุณาเลือกผู้เช่า"]])) {
    if (!uuid(text(values, key))) errors[key] = message;
  }
  if (!text(values, "leaseNumber")) errors.leaseNumber = "กรุณากรอกเลขที่สัญญา";
  if (!text(values, "startDate")) errors.startDate = "กรุณาเลือกวันเริ่มสัญญา";
  const start = text(values, "startDate"), end = text(values, "endDate");
  if (start && end && end < start) errors.endDate = "วันสิ้นสุดต้องไม่ก่อนวันเริ่มสัญญา";
  for (const key of ["rentAmount", "depositAmount", "advanceAmount"]) {
    const value = number(values, key);
    if (!text(values, key) || !Number.isFinite(value) || value < 0) errors[key] = "กรุณากรอกจำนวนเงินตั้งแต่ 0 ขึ้นไป";
  }
  const occupants = number(values, "occupantCount");
  if (!Number.isInteger(occupants) || occupants < 1 || occupants > 50) errors.occupantCount = "จำนวนผู้พักต้องอยู่ระหว่าง 1–50 คน";
  return errors;
}

export function validateMeter(values) {
  const errors = {};
  if (!uuid(text(values, "propertyId"))) errors.propertyId = "กรุณาเลือกหอพัก";
  if (!uuid(text(values, "roomId"))) errors.roomId = "กรุณาเลือกห้องพัก";
  if (!/^\d{4}-\d{2}$/.test(text(values, "periodMonth"))) errors.periodMonth = "กรุณาเลือกรอบเดือน";
  const previous = number(values, "previousValue"), current = number(values, "currentValue");
  if (!text(values, "previousValue") || previous < 0) errors.previousValue = "กรุณากรอกเลขครั้งก่อนตั้งแต่ 0 ขึ้นไป";
  if (!text(values, "currentValue") || current < previous) errors.currentValue = "เลขครั้งนี้ต้องไม่น้อยกว่าเลขครั้งก่อน";
  return errors;
}

export function validateInvoice(values) {
  const errors = {};
  if (!values.invoiceId) {
    if (!uuid(text(values, "leaseId"))) errors.leaseId = "กรุณาเลือกสัญญาและห้องพัก";
    if (!/^\d{4}-\d{2}$/.test(text(values, "periodMonth"))) errors.periodMonth = "กรุณาเลือกรอบเดือน";
  }
  if (values.invoiceId && !text(values, "invoiceNumber")) errors.invoiceNumber = "ไม่พบเลขที่ใบแจ้งหนี้เดิม";
  if (!text(values, "dueAt")) errors.dueAt = "กรุณาเลือกวันครบกำหนด";
  const total = number(values, "total");
  if (text(values, "total") && total < 0) errors.total = "กรุณากรอกยอดรวมตั้งแต่ 0 ขึ้นไป";
  return errors;
}

export function validatePayment(values) {
  const errors = {};
  if (!uuid(text(values, "invoiceId"))) errors.invoiceId = "กรุณาเลือกใบแจ้งหนี้";
  if (!text(values, "receiptNumber")) errors.receiptNumber = "กรุณากรอกเลขที่ใบเสร็จ";
  const amount = number(values, "amount");
  if (!text(values, "amount") || amount <= 0) errors.amount = "ยอดรับชำระต้องมากกว่า 0";
  return errors;
}

export function validateSettings(values) {
  const errors = {};
  if (!uuid(text(values, "propertyId"))) errors.propertyId = "กรุณาเลือกหอพัก";
  if (!["meter", "per_person", "flat_room"].includes(text(values, "waterBillingMethod"))) errors.waterBillingMethod = "กรุณาเลือกวิธีคิดค่าน้ำ";
  for (const key of ["electricRate", "waterRate", "lateFee"]) {
    const value = number(values, key);
    if (!text(values, key) || value < 0) errors[key] = "กรุณากรอกอัตราตั้งแต่ 0 ขึ้นไป";
  }
  for (const key of ["billDay", "dueDay"]) {
    const value = number(values, key);
    if (!Number.isInteger(value) || value < 1 || value > 28) errors[key] = "กรุณากรอกวันที่ระหว่าง 1–28";
  }
  return errors;
}
