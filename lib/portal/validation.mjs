import { getBangkokToday } from "./meter-reading.mjs";

const text = (values, key) => String(values[key] ?? "").trim();
const number = (values, key) => Number(text(values, key));
const uuid = (value) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
const floorPattern = /^[A-Za-zก-๙0-9 /-]+$/;

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateFloor(value) {
  const floor = String(value ?? "").trim();
  if (!floor) return "กรุณาระบุชั้น เช่น 1, G หรือ B1";
  if (floor.length > 40) return "ชั้นต้องไม่เกิน 40 ตัวอักษร";
  if (!floorPattern.test(floor)) return "ชั้นใช้ได้เฉพาะภาษาไทย อังกฤษ ตัวเลข ช่องว่าง / และ -";
  return "";
}

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
  const floorError = validateFloor(values.floor);
  if (floorError) errors.floor = floorError;
  return errors;
}

export function validateTenant(values) {
  const errors = {};
  const fullName = text(values, "fullName");
  if (fullName.length < 2) errors.fullName = "กรุณากรอกชื่อผู้เช่าอย่างน้อย 2 ตัวอักษร";
  else if (fullName.length > 160) errors.fullName = "ชื่อผู้เช่าต้องไม่เกิน 160 ตัวอักษร";
  const email = text(values, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  else if (email.length > 254) errors.email = "อีเมลต้องไม่เกิน 254 ตัวอักษร";
  const last4 = text(values, "idCardLast4");
  if (last4 && !/^\d{4}$/.test(last4)) errors.idCardLast4 = "กรอกเลขบัตรประชาชนเฉพาะ 4 ตัวท้าย";
  const phone = text(values, "phone");
  if (phone && !/^\d{9,15}$/.test(phone)) errors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–15 หลัก";
  if (text(values, "address").length > 500) errors.address = "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร";
  const birthDate = text(values, "birthDate");
  if (birthDate && !isIsoDate(birthDate)) {
    errors.birthDate = "วันเกิดไม่ถูกต้อง";
  } else if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) {
    errors.birthDate = "วันเกิดต้องไม่เป็นวันที่ในอนาคต";
  } else if (birthDate && birthDate < "1900-01-01") {
    errors.birthDate = "วันเกิดต้องไม่ก่อนปี พ.ศ. 2443";
  }
  const emergencyName = text(values, "emergencyContactName");
  const emergencyRelationship = text(values, "emergencyContactRelationship");
  const emergencyPhone = text(values, "emergencyContactPhone");
  if (emergencyName || emergencyRelationship || emergencyPhone) {
    if (!emergencyName) errors.emergencyContactName = "กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน";
    if (!emergencyRelationship) errors.emergencyContactRelationship = "กรุณาระบุความสัมพันธ์";
    if (!emergencyPhone) errors.emergencyContactPhone = "กรุณากรอกเบอร์ผู้ติดต่อฉุกเฉิน";
  }
  if (emergencyName.length > 160) errors.emergencyContactName = "ชื่อต้องไม่เกิน 160 ตัวอักษร";
  if (emergencyRelationship.length > 80) errors.emergencyContactRelationship = "ความสัมพันธ์ต้องไม่เกิน 80 ตัวอักษร";
  if (emergencyPhone && !/^\d{9,15}$/.test(emergencyPhone)) errors.emergencyContactPhone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–15 หลัก";
  if (text(values, "vehiclePlate").length > 40) errors.vehiclePlate = "ทะเบียนรถต้องไม่เกิน 40 ตัวอักษร";
  if (text(values, "lineId").length > 100) errors.lineId = "LINE ID ต้องไม่เกิน 100 ตัวอักษร";
  if (text(values, "notes").length > 2000) errors.notes = "หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร";
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

export function validateMeter(values, today = getBangkokToday()) {
  const errors = {};
  if (!uuid(text(values, "propertyId"))) errors.propertyId = "กรุณาเลือกหอพัก";
  if (!uuid(text(values, "roomId"))) errors.roomId = "กรุณาเลือกห้องพัก";
  const periodMonth = text(values, "periodMonth");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodMonth)) errors.periodMonth = "กรุณาเลือกรอบเดือน";
  else if (periodMonth > today.slice(0, 7)) errors.periodMonth = "ไม่สามารถจดมิเตอร์ล่วงหน้าเกินเดือนปัจจุบันได้";
  const recordedAt = text(values, "recordedAt");
  if (!isIsoDate(recordedAt)) errors.recordedAt = "กรุณาเลือกวันที่จดจริง";
  else if (recordedAt > today) errors.recordedAt = "วันที่จดจริงต้องไม่เกินวันนี้";
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
