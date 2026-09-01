export function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}
export function thaiDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value))
    : "—";
}

export function thaiDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value))
    : "—";
}

export function dateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "ใช้งาน", inactive: "ปิดใช้งาน", suspended: "ระงับ", closed: "ปิดกิจการ",
    trialing: "ทดลองใช้ฟรี", past_due: "เกินกำหนด", readonly: "ดูได้อย่างเดียว", paused: "หยุดชั่วคราว", cancelled: "ยกเลิก",
    vacant: "ว่าง", occupied: "มีผู้เช่า", maintenance: "ซ่อมบำรุง", former: "ผู้เช่าเดิม", blocked: "บล็อก",
    draft: "ฉบับร่าง", ended: "สิ้นสุด", issued: "รอชำระ", partial: "ชำระบางส่วน", paid: "ชำระแล้ว", overdue: "เกินกำหนด",
    void: "ยกเลิกเอกสาร", confirmed: "ยืนยันแล้ว", pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธแล้ว", replaced: "เปลี่ยนแล้ว",
  };
  return labels[status] ?? status;
}

export function thaiBahtText(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "ศูนย์บาทถ้วน";
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const intPart = Math.floor(num);
  const str = intPart.toString();
  const len = str.length;
  let text = "";

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i]);
    const pos = len - i - 1;
    if (digit !== 0) {
      if (pos === 0 && digit === 1 && len > 1 && parseInt(str[i - 1]) !== 0) {
        text += "เอ็ด";
      } else if (pos === 1 && digit === 2) {
        text += "ยี่";
      } else if (pos === 1 && digit === 1) {
        // empty
      } else {
        text += digits[digit];
      }
      text += positions[pos];
    }
  }
  return text + "บาทถ้วน";
}
