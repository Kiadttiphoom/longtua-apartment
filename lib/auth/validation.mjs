const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/;

export function normalizeUsername(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateLoginInput(input) {
  const errors = {};
  const username = normalizeUsername(input.username);
  const password = String(input.password ?? "");

  if (!USERNAME_PATTERN.test(username)) {
    errors.username = "ชื่อผู้ใช้ต้องมี 4–30 ตัว ใช้ a-z, 0-9, จุด, _ หรือ -";
  }
  if (password.length < 8) {
    errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  }

  return errors;
}

export function validateRegistrationInput(input) {
  const errors = validateLoginInput(input);
  const operatorName = String(input.operatorName ?? "").trim();
  const phone = String(input.phone ?? "").replace(/[^0-9]/g, "");
  const password = String(input.password ?? "");

  if (operatorName.length < 2 || operatorName.length > 120) {
    errors.operatorName = "กรุณากรอกชื่อผู้ประกอบการ 2–120 ตัวอักษร";
  }
  if (phone && !/^0[0-9]{8,9}$/.test(phone)) {
    errors.phone = "กรุณากรอกเบอร์โทรศัพท์ไทยให้ถูกต้อง";
  }
  if (password.length >= 8 && (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) {
    errors.password = "รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข";
  }
  if (String(input.confirmPassword ?? "") !== password) {
    errors.confirmPassword = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  }
  if (input.accepted !== true) {
    errors.accepted = "กรุณายอมรับเงื่อนไขการใช้งาน";
  }

  return errors;
}

export function validateTrialRequestInput(input) {
  const errors = validateRegistrationInput(input);
  const propertyName = String(input.propertyName ?? "").trim();
  const contactEmail = String(input.contactEmail ?? "").trim().toLowerCase();
  const requestedRoomCount = Number(input.requestedRoomCount);
  const phone = String(input.phone ?? "").replace(/[^0-9]/g, "");

  if (propertyName.length < 2 || propertyName.length > 160) {
    errors.propertyName = "กรุณากรอกชื่อหอพัก 2–160 ตัวอักษร";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254) {
    errors.contactEmail = "กรุณากรอกอีเมลติดต่อให้ถูกต้อง";
  }
  if (!/^0[0-9]{8,9}$/.test(phone)) {
    errors.phone = "กรุณากรอกเบอร์โทรศัพท์ไทยสำหรับยืนยันตัวตน";
  }
  if (!Number.isInteger(requestedRoomCount) || requestedRoomCount < 1 || requestedRoomCount > 100) {
    errors.requestedRoomCount = "จำนวนห้องต้องอยู่ระหว่าง 1–100 ห้อง";
  }

  return errors;
}

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits || null;
}
