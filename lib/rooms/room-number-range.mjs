export const MAX_BULK_ROOMS = 200;

export function buildRoomNumberRange({ prefix = "", start, end, padding = 0 }) {
  const normalizedPrefix = String(prefix).trim();
  if (String(start).trim() === "" || String(end).trim() === "") {
    return { roomNumbers: [], error: "กรุณากรอกเลขเริ่มต้นและเลขสิ้นสุดให้ครบ" };
  }
  const first = Number(start);
  const last = Number(end);
  const digits = Number(padding);

  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 0 || last < first) {
    return { roomNumbers: [], error: "กรุณากรอกเลขเริ่มต้นและเลขสิ้นสุดให้ถูกต้อง" };
  }
  if (!Number.isInteger(digits) || digits < 0 || digits > 6) {
    return { roomNumbers: [], error: "จำนวนหลักต้องอยู่ระหว่าง 0–6" };
  }

  const count = last - first + 1;
  if (count > MAX_BULK_ROOMS) {
    return { roomNumbers: [], error: `เพิ่มได้สูงสุด ${MAX_BULK_ROOMS} ห้องต่อครั้ง` };
  }

  const roomNumbers = Array.from({ length: count }, (_, index) => {
    const value = String(first + index).padStart(digits, "0");
    return `${normalizedPrefix}${value}`;
  });
  if (roomNumbers.some((roomNumber) => roomNumber.length > 40)) {
    return { roomNumbers: [], error: "หมายเลขห้องต้องยาวไม่เกิน 40 ตัวอักษร" };
  }

  return { roomNumbers, error: null };
}
