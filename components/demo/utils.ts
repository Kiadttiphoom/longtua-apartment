import { useRef, useState } from "react";
import { toCsv } from "./demo-domain.mjs";
import { DEMO_ADD_COOLDOWN_MS, DEMO_ITEM_LIMIT } from "./mock-data";

export function thaiBahtText(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "ศูนย์บาทถ้วน";
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const intPart = Math.floor(num);
  const str = intPart.toString();
  const len = str.length;
  let text = "";

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i], 10);
    const pos = len - i - 1;
    if (digit !== 0) {
      if (pos === 0 && digit === 1 && len > 1 && parseInt(str[i - 1], 10) !== 0) {
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

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const blob = new Blob(["\uFEFF", toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useDemoCollection<T>(initialItems: T[], onToast: (message: string) => void, limit = DEMO_ITEM_LIMIT) {
  const [items, setItems] = useState(initialItems);
  const lastAddAt = useRef(0);

  function addItem(item: T) {
    const now = Date.now();
    if (now - lastAddAt.current < DEMO_ADD_COOLDOWN_MS) {
      onToast("กรุณารอสักครู่ก่อนเพิ่มรายการถัดไป");
      return false;
    }
    if (items.length >= limit) {
      onToast(`Demo เพิ่มได้สูงสุด ${limit} รายการต่อหน้า`);
      return false;
    }
    lastAddAt.current = now;
    setItems((current) => [...current, item]);
    return true;
  }

  function removeItem(index: number, message?: string) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    onToast(message || "ลบรายการออกจาก Demo แล้ว");
  }

  function updateItem(index: number, updated: T) {
    setItems((current) => {
      const next = [...current];
      if (index >= 0 && index < next.length) {
        next[index] = updated;
      }
      return next;
    });
  }

  return { items, addItem, removeItem, updateItem };
}
