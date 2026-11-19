import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TelegramSettings = {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyTrialRequests: boolean;
  notifyPaymentSubmissions: boolean;
  notifyRepairRequests: boolean;
};

export const defaultTelegramSettings: TelegramSettings = {
  enabled: false,
  botToken: "",
  chatId: "",
  notifyTrialRequests: true,
  notifyPaymentSubmissions: true,
  notifyRepairRequests: true,
};

function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("system_settings")
      .select("value")
      .eq("key", "telegram_settings")
      .maybeSingle();

    if (error || !data?.value) {
      return defaultTelegramSettings;
    }

    const val = data.value as Partial<TelegramSettings>;
    return {
      enabled: val.enabled === true,
      botToken: typeof val.botToken === "string" ? val.botToken.trim() : "",
      chatId: typeof val.chatId === "string" ? val.chatId.trim() : "",
      notifyTrialRequests: val.notifyTrialRequests !== false,
      notifyPaymentSubmissions: val.notifyPaymentSubmissions !== false,
      notifyRepairRequests: val.notifyRepairRequests !== false,
    };
  } catch (err) {
    console.error("[telegram] Failed to read telegram_settings:", err);
    return defaultTelegramSettings;
  }
}

export async function sendTelegramMessage(
  text: string,
  customSettings?: TelegramSettings,
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = customSettings ?? (await getTelegramSettings());
    if (!settings.enabled && !customSettings) {
      return { success: false, error: "การแจ้งเตือน Telegram ถูกปิดอยู่" };
    }
    if (!settings.botToken || !settings.chatId) {
      return {
        success: false,
        error: "กรุณาระบุ Telegram Bot Token และ Chat ID ให้ครบถ้วน",
      };
    }

    const endpoint = `https://api.telegram.org/bot${encodeURIComponent(settings.botToken.trim())}/sendMessage`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chatId.trim(),
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      const desc = data.description || `HTTP ${response.status}`;
      console.error("[telegram] API Error:", data);
      return { success: false, error: desc };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[telegram] Request error:", err);
    return { success: false, error: msg };
  }
}

// Deduplication cache: keeps track of notified event keys to prevent sending duplicate Telegram messages
const notifiedKeys = new Map<string, number>();
const DEDUP_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isDuplicateNotification(keys: string[]): boolean {
  const now = Date.now();
  // Evict expired entries
  for (const [k, time] of notifiedKeys.entries()) {
    if (now - time > DEDUP_EXPIRY_MS) {
      notifiedKeys.delete(k);
    }
  }

  for (const key of keys) {
    if (key && notifiedKeys.has(key)) {
      return true;
    }
  }
  return false;
}

export function markNotified(keys: string[]) {
  const now = Date.now();
  for (const key of keys) {
    if (key) {
      notifiedKeys.set(key, now);
    }
  }
}

export async function testTelegramMessage(
  customSettings?: TelegramSettings,
): Promise<{ success: boolean; error?: string }> {
  const settings = customSettings ?? (await getTelegramSettings());
  if (!settings.botToken || !settings.chatId) {
    return { success: false, error: "กรุณาระบุ Bot Token และ Chat ID ก่อนทดสอบ" };
  }

  const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const message = [
    `🤖 <b>[Longtua Apartment] ทดสอบการเชื่อมต่อ Telegram</b>`,
    ``,
    `✅ เชื่อมต่อกับระบบสำเร็จเรียบร้อยแล้ว!`,
    `ข้อความแจ้งเตือนคำขอและกิจกรรมสำคัญในระบบจะถูกส่งมายังแชตนี้`,
    ``,
    `⏰ <i>เวลาที่ทดสอบ: ${escapeHtml(now)}</i>`,
  ].join("\n");

  return sendTelegramMessage(message, { ...settings, enabled: true });
}

export async function notifyNewTrialRequest(data: {
  requestId?: string;
  operatorName: string;
  propertyName: string;
  contactEmail: string;
  phone: string;
  username: string;
  requestedRoomCount: number;
}) {
  try {
    const settings = await getTelegramSettings();
    if (!settings.enabled || !settings.notifyTrialRequests) return;
    if (!settings.botToken || !settings.chatId) return;

    // Deduplication check: prevent sending duplicate notifications for the same trial request
    const dedupKeys = [
      data.requestId ? `trial_id:${data.requestId}` : "",
      data.username ? `trial_user:${data.username.toLowerCase().trim()}` : "",
      data.contactEmail
        ? `trial_email:${data.contactEmail.toLowerCase().trim()}`
        : "",
      data.phone ? `trial_phone:${data.phone.replace(/\D/g, "")}` : "",
    ].filter(Boolean);

    if (isDuplicateNotification(dedupKeys)) {
      console.log(
        `[telegram] Duplicate trial notification skipped for: ${dedupKeys.join(", ")}`,
      );
      return;
    }

    // Mark as notified before sending to prevent race conditions from concurrent calls
    markNotified(dedupKeys);

    const appUrl =
      process.env.APARTMENT_APP_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:3000";
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    const message = [
      `🔔 <b>มีคำขอทดลองใช้ระบบใหม่ (New Trial Request)</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🏢 <b>หอพัก/อพาร์ตเมนต์:</b> ${escapeHtml(data.propertyName)}`,
      `👤 <b>ผู้ติดต่อ:</b> ${escapeHtml(data.operatorName)} (@${escapeHtml(data.username)})`,
      `📞 <b>เบอร์โทร:</b> <code>${escapeHtml(data.phone)}</code>`,
      `✉️ <b>อีเมล:</b> ${escapeHtml(data.contactEmail)}`,
      `🚪 <b>แพ็กเกจเริ่มต้น:</b> ทดลองใช้ฟรี (${escapeHtml(data.requestedRoomCount)} ห้อง)`,
      `⏰ <b>เวลาส่งคำขอ:</b> ${escapeHtml(now)}`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${appUrl}/admin/trial-requests">เปิดตรวจสอบและอนุมัติใน Admin</a>`,
    ].join("\n");

    const result = await sendTelegramMessage(message, settings);
    if (!result.success) {
      console.error(
        "[telegram] Failed to send trial notification:",
        result.error,
      );
    }
  } catch (err) {
    console.error("[telegram] notifyNewTrialRequest error:", err);
  }
}

export async function notifyNewPaymentSubmission(data: {
  propertyName?: string;
  roomNumber?: string;
  tenantName?: string;
  amount: number;
  invoiceNumber?: string;
  paidAt?: string;
}) {
  try {
    const settings = await getTelegramSettings();
    if (!settings.enabled || !settings.notifyPaymentSubmissions) return;

    const appUrl =
      process.env.APARTMENT_APP_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:3000";
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    const lines = [
      `💸 <b>มีผู้เช่าส่งสลิปชำระเงินใหม่ (Payment Slip)</b>`,
      `━━━━━━━━━━━━━━━━━━`,
    ];
    if (data.propertyName)
      lines.push(`🏢 <b>หอพัก:</b> ${escapeHtml(data.propertyName)}`);
    if (data.roomNumber)
      lines.push(
        `🚪 <b>ห้อง:</b> ${escapeHtml(data.roomNumber)}${data.tenantName ? ` (${escapeHtml(data.tenantName)})` : ""}`,
      );
    lines.push(
      `💰 <b>ยอดเงิน:</b> ฿${Number(data.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
    );
    if (data.invoiceNumber)
      lines.push(`🧾 <b>เลขที่ใบแจ้งหนี้:</b> ${escapeHtml(data.invoiceNumber)}`);
    lines.push(`⏰ <b>เวลา:</b> ${escapeHtml(data.paidAt || now)}`);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`👉 <a href="${appUrl}/payments">เปิดดูสลิปในระบบ</a>`);

    await sendTelegramMessage(lines.join("\n"), settings);
  } catch (err) {
    console.error("[telegram] notifyNewPaymentSubmission error:", err);
  }
}

export async function notifyNewRepairRequest(data: {
  propertyName?: string;
  roomNumber?: string;
  tenantName?: string;
  title: string;
  createdAt?: string;
}) {
  try {
    const settings = await getTelegramSettings();
    if (!settings.enabled || !settings.notifyRepairRequests) return;

    const appUrl =
      process.env.APARTMENT_APP_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:3000";
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    const lines = [
      `🔧 <b>มีผู้เช่าแจ้งซ่อมใหม่ (Repair Request)</b>`,
      `━━━━━━━━━━━━━━━━━━`,
    ];
    if (data.propertyName)
      lines.push(`🏢 <b>หอพัก:</b> ${escapeHtml(data.propertyName)}`);
    if (data.roomNumber)
      lines.push(
        `🚪 <b>ห้อง:</b> ${escapeHtml(data.roomNumber)}${data.tenantName ? ` (${escapeHtml(data.tenantName)})` : ""}`,
      );
    lines.push(`📝 <b>หัวข้อ:</b> ${escapeHtml(data.title)}`);
    lines.push(`⏰ <b>เวลา:</b> ${escapeHtml(data.createdAt || now)}`);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`👉 <a href="${appUrl}/dashboard">เปิดดูในระบบ</a>`);

    await sendTelegramMessage(lines.join("\n"), settings);
  } catch (err) {
    console.error("[telegram] notifyNewRepairRequest error:", err);
  }
}
