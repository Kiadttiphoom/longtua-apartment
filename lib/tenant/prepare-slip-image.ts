"use client";
import { detectSlipType, MAX_SLIP_BYTES } from "./slip-validation.mjs";

export async function prepareSlipImage(file: File): Promise<File> {
  if (!file.size || file.size > 40 * 1024 * 1024) throw new Error("กรุณาเลือกภาพต้นฉบับขนาดไม่เกิน 40 MB");
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const format = detectSlipType(header);
  let source: Blob = file;
  if (!format) {
    if (!/\.(heic|heif)$/i.test(file.name) && !["image/heic", "image/heif"].includes(file.type)) throw new Error("แนบได้เฉพาะ PNG, JPG หรือภาพ HEIC/HEIF จาก iPhone");
    const { heicTo, isHeic } = await import("heic-to");
    if (!await isHeic(file)) throw new Error("ไฟล์ภาพ iPhone ไม่ถูกต้อง");
    source = await heicTo({ blob: file, type: "image/jpeg", quality: 0.95 });
  }
  const url = URL.createObjectURL(source);
  try {
    const img = new Image(); img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 4096 / Math.max(img.naturalWidth, img.naturalHeight));
    let width = Math.max(1, Math.round(img.naturalWidth * scale));
    let height = Math.max(1, Math.round(img.naturalHeight * scale));
    for (let attempt = 0; attempt < 12; attempt++) {
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("อุปกรณ์ไม่รองรับการแปลงภาพ");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const type = format?.type === "image/png" && attempt === 0 ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, Math.max(0.65, 0.92 - attempt * 0.04)));
      if (blob && blob.size <= MAX_SLIP_BYTES) return new File([blob], `slip.${type === "image/png" ? "png" : "jpg"}`, { type });
      width = Math.max(1, Math.round(width * 0.8)); height = Math.max(1, Math.round(height * 0.8));
    }
    throw new Error("ย่อภาพไม่สำเร็จ กรุณาเลือกภาพใหม่");
  } finally { URL.revokeObjectURL(url); }
}
