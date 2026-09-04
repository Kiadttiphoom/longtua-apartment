import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_PUBLIC_PLANS, type PublicPlanItem } from "@/lib/portal/plans";

export const runtime = "nodejs";

const PRICING_FAQS = [
  {
    question: "ช่วงทดลองใช้ฟรี 30 วัน มีค่าใช้จ่ายหรือต้องผูกบัตรเครดิตไหม?",
    answer: "ไม่มีค่าใช้จ่ายใดๆ และไม่ต้องกรอกข้อมูลบัตรเครดิตครับ คุณสามารถเริ่มทดลองใช้ได้ทันที 30 วันเต็มรูปแบบ พร้อมระบบตรวจสลิป 15 ครั้งและฟังก์ชันครบถ้วนทุกอย่าง",
  },
  {
    question: "หากโควตาตรวจสลิปโอนเงินอัตโนมัติหมด จะเกิดอะไรขึ้น?",
    answer: "ระบบจะไม่บล็อกการชำระเงินของผู้เช่าครับ ผู้เช่ายังสามารถอัปโหลดสลิปแจ้งชำระเงินได้ตามปกติ โดยระบบจะสลับเป็นสถานะ 'รอตรวจสอบด้วยตนเอง' ให้เจ้าของหอหรือผู้จัดการตรวจสอบสลิปด้วยตาเปล่าได้ ทำให้ธุรกิจดำเนินต่อไปได้ไม่มีสะดุด และสามารถเลือกอัปเกรดแพ็กเกจได้ตลอดเวลา",
  },
  {
    question: "คิดค่าบริการอย่างไรหากมีจำนวนห้องเพิ่มขึ้นในอนาคต?",
    answer: "Longtua ใช้ระบบเหมาจ่ายตามช่วงแพ็กเกจ (เช่น 30 ห้อง, 100 ห้อง, 300 ห้อง) โดยไม่มีการหักเปอร์เซ็นต์ส่วนแบ่งยอดโอน ช่วยให้เจ้าของหอควบคุมต้นทุนได้อย่างแม่นยำครับ",
  },
  {
    question: "สามารถเปลี่ยนแพ็กเกจหรืออัปเกรดภายหลังได้หรือไม่?",
    answer: "สามารถปรับเปลี่ยนแพ็กเกจได้ตลอดเวลาครับ เมื่อธุรกิจของคุณขยายตัว เพียงแจ้งผ่านระบบหรือติดต่อเจ้าหน้าที่ ระบบจะปรับโควตาหอพัก ห้องพัก และโควตาตรวจสลิปให้ทันที",
  },
  {
    question: "หากหมดระยะเวลาทดลองใช้ ข้อมูลในระบบจะหายหรือไม่?",
    answer: "ข้อมูลของท่านจะไม่สูญหายครับ เมื่อหมดระยะเวลาทดลองใช้ ระบบจะเปลี่ยนเป็นสถานะเปิดดูข้อมูล (Read-only) เพื่อให้ท่านสามารถตรวจสอบประวัติได้ตลอดเวลา จนกว่าจะพร้อมต่ออายุการใช้งาน",
  },
];

function hasValidApiKey(request: NextRequest): boolean {
  const configured = (process.env.LONGTUA_PUBLIC_API_KEY || process.env.TRIAL_REQUEST_API_SECRET)?.trim();
  if (!configured) return false;

  // Check x-api-key header first, then Authorization: Bearer <key>
  const apiKeyHeader = request.headers.get("x-api-key")?.trim() ?? "";
  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  const supplied = apiKeyHeader || bearerToken;
  if (!supplied) return false;

  const expectedHash = createHash("sha256").update(configured).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();

  return timingSafeEqual(expectedHash, suppliedHash);
}

export async function GET(request: NextRequest) {
  // Validate API key
  if (!hasValidApiKey(request)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "ไม่อนุญาตให้เข้าถึงข้อมูล (Invalid or missing API key)",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  let plans: PublicPlanItem[] = FALLBACK_PUBLIC_PLANS;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      plans = data.map((row: any) => ({
        id: row.code,
        code: row.code,
        name: row.name,
        badge: row.badge,
        popular: Boolean(row.popular),
        priceMonthly: Number(row.price_monthly ?? 0),
        period: row.period || "เดือน",
        targetAudience: row.target_audience || "",
        maxProperties: Number(row.max_properties ?? 1),
        maxPropertiesLabel: row.max_properties_label || `${row.max_properties} หอพัก`,
        maxRooms: Number(row.max_rooms ?? 10),
        maxRoomsLabel: row.max_rooms_label || `สูงสุด ${row.max_rooms} ห้อง`,
        maxUsers: Number(row.max_users ?? 1),
        maxUsersLabel: row.max_users_label || (row.max_users === -1 ? "ผู้ใช้งานไม่จำกัด" : `ผู้ใช้งาน ${row.max_users} คน`),
        maxSlipVerifications: Number(row.max_slip_verifications ?? 15),
        maxSlipVerificationsLabel: row.max_slip_verifications_label || `ตรวจสลิป ${row.max_slip_verifications} ครั้ง`,
        features: Array.isArray(row.features) ? row.features : [],
        ctaLabel: row.cta_label || "เลือกแพ็กเกจ",
        ctaHref: row.cta_href || "/contact",
        ctaVariant: row.cta_variant || "secondary",
        sortOrder: row.sort_order,
      }));
    }
  } catch (err) {
    // If DB query fails or table not yet migrated, smoothly fallback to hardcoded plans
    console.error("[api/public/plans] Failed to query subscription_plans from DB, using fallback:", err);
  }

  return NextResponse.json(
    {
      success: true,
      data: plans,
      faqs: PRICING_FAQS,
      updatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
