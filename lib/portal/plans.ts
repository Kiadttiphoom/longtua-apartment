export type SubscriptionPlanCode = "trial" | "starter" | "growth" | "pro" | "business";

export type SubscriptionPlan = {
  code: SubscriptionPlanCode;
  name: string;
  priceMonthly: number;
  maxProperties: number;
  maxRooms: number;
  maxUsers: number; // -1 for unlimited
  maxSlipVerifications: number;
  description: string;
  targetAudience: string;
  popular?: boolean;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, SubscriptionPlan> = {
  trial: {
    code: "trial",
    name: "ทดลองใช้ฟรี",
    priceMonthly: 0,
    maxProperties: 1,
    maxRooms: 10,
    maxUsers: 1,
    maxSlipVerifications: 15,
    description: "ทดลองระบบ 30 วันเต็มรูปแบบ",
    targetAudience: "ทดลองระบบกับตึกแรก",
  },
  starter: {
    code: "starter",
    name: "Starter",
    priceMonthly: 199,
    maxProperties: 1,
    maxRooms: 30,
    maxUsers: 2,
    maxSlipVerifications: 45,
    description: "แพ็กเกจเริ่มต้นราคาประหยัด",
    targetAudience: "เจ้าของหอเดี่ยวขนาดเล็ก",
  },
  growth: {
    code: "growth",
    name: "Growth",
    priceMonthly: 399,
    maxProperties: 3,
    maxRooms: 100,
    maxUsers: 5,
    maxSlipVerifications: 150,
    description: "แพ็กเกจยอดนิยม คุ้มค่าที่สุด",
    targetAudience: "เจ้าของหลายอาคาร",
    popular: true,
  },
  pro: {
    code: "pro",
    name: "Pro",
    priceMonthly: 699,
    maxProperties: 10,
    maxRooms: 300,
    maxUsers: -1, // Unlimited
    maxSlipVerifications: 450,
    description: "สำหรับธุรกิจหอพักมืออาชีพ",
    targetAudience: "ธุรกิจหลายหอและมีทีมงาน",
  },
  business: {
    code: "business",
    name: "Business",
    priceMonthly: 1299,
    maxProperties: 999, // Practically unlimited
    maxRooms: 500,
    maxUsers: -1,
    maxSlipVerifications: 1000,
    description: "สำหรับเครืออพาร์ตเมนต์ขนาดใหญ่",
    targetAudience: "เครืออพาร์ตเมนต์ขนาดใหญ่",
  },
};

export function getPlanByQuota(maxProperties: number | null | undefined, maxRooms: number | null | undefined): SubscriptionPlan {
  const rooms = maxRooms ?? 10;
  if (rooms <= 10) return SUBSCRIPTION_PLANS.trial;
  if (rooms <= 30) return SUBSCRIPTION_PLANS.starter;
  if (rooms <= 100) return SUBSCRIPTION_PLANS.growth;
  if (rooms <= 300) return SUBSCRIPTION_PLANS.pro;
  return SUBSCRIPTION_PLANS.business;
}

export interface PublicPlanItem {
  id: SubscriptionPlanCode;
  code: SubscriptionPlanCode;
  name: string;
  badge?: string | null;
  popular?: boolean;
  priceMonthly: number;
  period: string;
  targetAudience: string;
  maxProperties: number;
  maxPropertiesLabel: string;
  maxRooms: number;
  maxRoomsLabel: string;
  maxUsers: number;
  maxUsersLabel: string;
  maxSlipVerifications: number;
  maxSlipVerificationsLabel: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "secondary" | "outline";
  sortOrder?: number;
}

export const FALLBACK_PUBLIC_PLANS: PublicPlanItem[] = [
  {
    id: "trial",
    code: "trial",
    name: "ทดลองใช้ฟรี",
    badge: "ฟรี 30 วัน",
    popular: false,
    priceMonthly: 0,
    period: "30 วัน",
    targetAudience: "ทดลองระบบกับตึกแรก ไม่ต้องใช้บัตรเครดิต",
    maxProperties: 1,
    maxPropertiesLabel: "1 หอพัก",
    maxRooms: 10,
    maxRoomsLabel: "สูงสุด 10 ห้อง",
    maxUsers: 1,
    maxUsersLabel: "ผู้ใช้งาน 1 คน",
    maxSlipVerifications: 15,
    maxSlipVerificationsLabel: "ตรวจสลิป 15 ครั้ง (ฟรี)",
    features: [
      "ฟังก์ชันครบทุกอย่างเหมือนแพ็กเกจจริง",
      "ระบบตรวจสลิปโอนเงินอัตโนมัติ 15 ครั้ง",
      "จดมิเตอร์น้ำ-ไฟ คำนวณยอดอัตโนมัติ",
      "ออกใบแจ้งหนี้พร้อม QR PromptPay",
      "พอร์ทัลผู้เช่า ดูบิลและแจ้งชำระเงิน",
      "พิมพ์สัญญาเช่ามาตรฐาน",
    ],
    ctaLabel: "เริ่มทดลองใช้ฟรี 30 วัน",
    ctaHref: "https://apartment.longtua.com/register",
    ctaVariant: "secondary",
    sortOrder: 1,
  },
  {
    id: "starter",
    code: "starter",
    name: "Starter",
    badge: null,
    popular: false,
    priceMonthly: 199,
    period: "เดือน",
    targetAudience: "เจ้าของหอเดี่ยวขนาดเล็ก เริ่มต้นระบบดิจิทัล",
    maxProperties: 1,
    maxPropertiesLabel: "1 หอพัก",
    maxRooms: 30,
    maxRoomsLabel: "สูงสุด 30 ห้อง",
    maxUsers: 2,
    maxUsersLabel: "ผู้ใช้งาน 2 คน",
    maxSlipVerifications: 45,
    maxSlipVerificationsLabel: "ตรวจสลิป 45 ครั้ง / เดือน",
    features: [
      "ตรวจสลิปโอนเงินอัตโนมัติ 45 ครั้ง/เดือน",
      "บันทึกมิเตอร์น้ำ-ไฟ ประจำงวด",
      "ใบแจ้งหนี้ & ใบเสร็จรับเงินดิจิทัล",
      "QR PromptPay รับเงินเข้าบัญชีโดยตรง",
      "พอร์ทัลผู้เช่า ดูบิลผ่านมือถือ",
      "รายงานสรุปรายรับและอัตราเข้าพัก",
    ],
    ctaLabel: "เลือกแพ็กเกจ Starter",
    ctaHref: "/contact?plan=starter",
    ctaVariant: "secondary",
    sortOrder: 2,
  },
  {
    id: "growth",
    code: "growth",
    name: "Growth",
    badge: "⭐ ยอดนิยม คุ้มค่าที่สุด",
    popular: true,
    priceMonthly: 399,
    period: "เดือน",
    targetAudience: "เจ้าของหลายอาคาร หรือหอพักขนาดกลาง",
    maxProperties: 3,
    maxPropertiesLabel: "สูงสุด 3 หอพัก",
    maxRooms: 100,
    maxRoomsLabel: "รวมสูงสุด 100 ห้อง",
    maxUsers: 5,
    maxUsersLabel: "ผู้ใช้งาน 5 คน",
    maxSlipVerifications: 150,
    maxSlipVerificationsLabel: "ตรวจสลิป 150 ครั้ง / เดือน",
    features: [
      "ทุกฟังก์ชันในแพ็กเกจ Starter",
      "ตรวจสลิปโอนเงินอัตโนมัติ 150 ครั้ง/เดือน",
      "บริหารแยกหลายตึกในบัญชีเดียว",
      "กำหนดสิทธิ์ทีมงาน (ผู้จัดการ / บัญชี / ช่าง)",
      "รายงานวิเคราะห์กระแสเงินสดแยกอาคาร",
    ],
    ctaLabel: "เลือกแพ็กเกจ Growth",
    ctaHref: "/contact?plan=growth",
    ctaVariant: "primary",
    sortOrder: 3,
  },
  {
    id: "pro",
    code: "pro",
    name: "Pro",
    badge: null,
    popular: false,
    priceMonthly: 699,
    period: "เดือน",
    targetAudience: "ธุรกิจหอพักมืออาชีพ และทีมบริหารจัดการ",
    maxProperties: 10,
    maxPropertiesLabel: "สูงสุด 10 หอพัก",
    maxRooms: 300,
    maxRoomsLabel: "รวมสูงสุด 300 ห้อง",
    maxUsers: -1,
    maxUsersLabel: "ผู้ใช้งานไม่จำกัด",
    maxSlipVerifications: 450,
    maxSlipVerificationsLabel: "ตรวจสลิป 450 ครั้ง / เดือน",
    features: [
      "ทุกฟังก์ชันในแพ็กเกจ Growth",
      "ตรวจสลิปโอนเงินอัตโนมัติ 450 ครั้ง/เดือน",
      "รองรับเครือข่ายหอพักขนาดใหญ่",
      "เพิ่มทีมงานและผู้ดูแลได้ไม่จำกัด",
      "รายงานสรุปบัญชีและภาษีระดับมืออาชีพ",
      "บริการดูแลและซัพพอร์ตระดับพรีเมียม",
    ],
    ctaLabel: "เลือกแพ็กเกจ Pro",
    ctaHref: "/contact?plan=pro",
    ctaVariant: "secondary",
    sortOrder: 4,
  },
  {
    id: "business",
    code: "business",
    name: "Business",
    badge: "สำหรับองค์กร",
    popular: false,
    priceMonthly: 1299,
    period: "เดือน (เริ่มต้น)",
    targetAudience: "เครืออพาร์ตเมนต์ขนาดใหญ่ หรือนิติบุคคล",
    maxProperties: 999,
    maxPropertiesLabel: "ไม่จำกัดจำนวนหอพัก",
    maxRooms: 500,
    maxRoomsLabel: "รวม 500 ห้องขึ้นไป",
    maxUsers: -1,
    maxUsersLabel: "ผู้ใช้งานไม่จำกัด",
    maxSlipVerifications: 1000,
    maxSlipVerificationsLabel: "ตรวจสลิป 1,000+ ครั้ง / เดือน",
    features: [
      "ไม่จำกัดจำนวนอาคารและผู้ใช้งาน",
      "ตรวจสลิป 1,000+ ครั้ง หรือเชื่อม API Key ตัวเอง",
      "บริการช่วยนำเข้าข้อมูลห้องพักและผู้เช่าตั้งต้น",
      "ปรับแต่งฟอร์มสัญญาและใบเสร็จเฉพาะองค์กร",
      "ทีมวิศวกรดูแลระบบและสำรองข้อมูลพิเศษ",
      "Service Level Agreement (SLA) ดูแลด่วน",
    ],
    ctaLabel: "ติดต่อปรึกษาฝ่ายขาย",
    ctaHref: "/contact?plan=business",
    ctaVariant: "outline",
    sortOrder: 5,
  },
];
