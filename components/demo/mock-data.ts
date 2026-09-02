import {
  Building2,
  CalendarRange,
  CircleDollarSign,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import type { Company, NavGroup, PageKey, Property, RoleKey } from "./types";

export const DEMO_ITEM_LIMIT = 25;
export const DEMO_ADD_COOLDOWN_MS = 700;
export const DEMO_STORAGE_KEY = "longtua-apartment-owner-demo-v38";

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-001",
    name: "ลงตัว เรสซิเดน 2",
    address: "51/23 Saranrat Road",
    phone: "",
    settings: {
      electricRate: 7.00,
      waterRate: 150,
      billDay: 1,
      dueDay: 5,
      lateFee: 50,
      promptpay: "0812345678",
      accountName: "สมชาย ใจดี",
      invoiceHeader: "ใบแจ้งหนี้ค่าเช่า ลงตัว เรสซิเดน 2",
      invoiceNote: "กรุณาชำระเงินภายในวันที่ 5 ของทุกเดือน ขอบคุณครับ",
      attachQR: true,
    },
    rooms: [
      { number: "101", tenant: "สมมุต ศรีสระเกษ", rent: 2500, prevElec: 12430, newElec: null, contractStart: "1 ม.ค. 2568", contractEnd: "29 ส.ค. 2570" },
      { number: "102", tenant: "", rent: 2500, prevElec: 8210, newElec: null, contractStart: "", contractEnd: "" },
      { number: "103", tenant: "", rent: 2500, prevElec: 4100, newElec: null, contractStart: "", contractEnd: "" },
      { number: "104", tenant: "", rent: 2500, prevElec: 3200, newElec: null, contractStart: "", contractEnd: "" },
      { number: "105", tenant: "", rent: 2500, prevElec: 1900, newElec: null, contractStart: "", contractEnd: "" },
      { number: "106", tenant: "", rent: 2500, prevElec: 1400, newElec: null, contractStart: "", contractEnd: "" },
      { number: "107", tenant: "", rent: 2500, prevElec: 2200, newElec: null, contractStart: "", contractEnd: "" },
      { number: "108", tenant: "", rent: 2500, prevElec: 3100, newElec: null, contractStart: "", contractEnd: "" },
      { number: "109", tenant: "", rent: 2500, prevElec: 1800, newElec: null, contractStart: "", contractEnd: "" },
      { number: "110", tenant: "", rent: 2500, prevElec: 2500, newElec: null, contractStart: "", contractEnd: "" },
      { number: "201", tenant: "", rent: 2500, prevElec: 5110, newElec: null, contractStart: "", contractEnd: "" },
      { number: "202", tenant: "", rent: 2500, prevElec: 2400, newElec: null, contractStart: "", contractEnd: "" },
      { number: "203", tenant: "", rent: 2500, prevElec: 3100, newElec: null, contractStart: "", contractEnd: "" },
      { number: "204", tenant: "", rent: 2500, prevElec: 1800, newElec: null, contractStart: "", contractEnd: "" },
      { number: "205", tenant: "", rent: 2500, prevElec: 2900, newElec: null, contractStart: "", contractEnd: "" },
      { number: "206", tenant: "", rent: 2500, prevElec: 1600, newElec: null, contractStart: "", contractEnd: "" },
      { number: "207", tenant: "", rent: 2500, prevElec: 2100, newElec: null, contractStart: "", contractEnd: "" },
      { number: "208", tenant: "", rent: 2500, prevElec: 3300, newElec: null, contractStart: "", contractEnd: "" },
      { number: "209", tenant: "", rent: 2500, prevElec: 1900, newElec: null, contractStart: "", contractEnd: "" },
      { number: "210", tenant: "", rent: 2500, prevElec: 2700, newElec: null, contractStart: "", contractEnd: "" },
    ],
    contracts: [
      { id: "สญ.-2568-001", roomNumber: "101", tenantName: "สมมุต ศรีสระเกษ", tenantIdCard: "1-9098-00123-68-11", tenantPhone: "", startDate: "1 ม.ค. 2568", endDate: "29 ส.ค. 2570", rent: 2500, deposit: 5000, advanceRent: 2500, customClauses: "ห้ามสูบบุหรี่ภายในห้องพักโดยเด็ดขาด", status: "active" },
    ],
  },
];

export const navGroups: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      { code: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
      { code: "properties", label: "หอพัก", icon: Building2 },
      { code: "users", label: "ผู้ใช้งาน", icon: Users },
    ],
  },
  {
    label: "จัดการหอพัก",
    items: [
      { code: "rooms", label: "ห้องพัก", icon: KeyRound },
      { code: "tenants", label: "ผู้เช่า", icon: Users },
      { code: "contracts", label: "สัญญาเช่า", icon: CalendarRange },
    ],
  },
  {
    label: "การเงิน",
    items: [
      { code: "meters", label: "มิเตอร์", icon: Gauge },
      { code: "invoices", label: "ใบแจ้งหนี้", icon: FileText },
      { code: "payments", label: "รับชำระ", icon: WalletCards },
      { code: "receivables", label: "ยอดค้าง", icon: ReceiptText },
      { code: "reports", label: "รายงาน", icon: CircleDollarSign },
    ],
  },
  {
    label: "บริการเสริม",
    items: [{ code: "line", label: "LINE แจ้งเตือน", icon: MessageCircle, addon: true }],
  },
  {
    label: "ระบบ",
    items: [
      { code: "subscriptions", label: "แพ็กเกจและบริการ", icon: CircleDollarSign },
      { code: "settings", label: "ตั้งค่าหอพัก", icon: Settings },
    ],
  },
];

export const roleInfo: Record<
  RoleKey,
  {
    label: string;
    scope: string;
    allowed: PageKey[];
    name: string;
    initials: string;
  }
> = {
  super_admin: {
    label: "Super Admin",
    scope: "ทุกกิจการในระบบ",
    allowed: [
      "dashboard",
      "companies",
      "properties",
      "users",
      "roles",
      "permissions",
      "subscriptions",
      "line",
      "rooms",
      "audit",
      "tenants",
      "contracts",
      "meters",
      "invoices",
      "payments",
      "receivables",
      "reports",
      "menus",
      "settings",
    ],
    name: "ผู้ดูแลระบบแพลตฟอร์ม",
    initials: "SA",
  },
  owner: {
    label: "เจ้าของกิจการ",
    scope: "ลงตัว เรสซิเดน 2",
    allowed: [
      "dashboard",
      "properties",
      "users",
      "rooms",
      "tenants",
      "contracts",
      "meters",
      "invoices",
      "payments",
      "receivables",
      "reports",
      "line",
      "subscriptions",
      "settings",
    ],
    name: "สมชาย ใจดี",
    initials: "ส",
  },
  manager: {
    label: "ผู้จัดการ",
    scope: "ลงตัว เรสซิเดน 2",
    allowed: [
      "dashboard",
      "properties",
      "rooms",
      "tenants",
      "contracts",
      "meters",
      "invoices",
      "payments",
      "receivables",
      "reports",
      "line",
    ],
    name: "วิภา แสงจันทร์",
    initials: "ว",
  },
  accounting: {
    label: "ฝ่ายการเงิน",
    scope: "ลงตัว เรสซิเดน 2",
    allowed: [
      "dashboard",
      "rooms",
      "tenants",
      "contracts",
      "meters",
      "invoices",
      "payments",
      "receivables",
      "reports",
    ],
    name: "สุภาวดี พรชัย",
    initials: "ส",
  },
  staff: {
    label: "เจ้าหน้าที่",
    scope: "ลงตัว เรสซิเดน 2",
    allowed: [
      "dashboard",
      "rooms",
      "tenants",
      "contracts",
      "meters",
    ],
    name: "อนันต์ ดีพร้อม",
    initials: "อ",
  },
};

export const companies: Company[] = [
  { name: "ลงตัว เรสซิเดน 2", owner: "สมชาย ใจดี", phone: "081-234-5678", dorms: 1, rooms: 20, plan: "Starter", status: "active", date: "25 ก.ย. 2569" },
];

export const roles = [
  { name: "Owner", code: "OWNER", scope: "ทุกหอพักของกิจการ", users: 1, permissions: 45, system: true },
  { name: "Manager", code: "MANAGER", scope: "หอพักที่ได้รับมอบหมาย", users: 2, permissions: 38, system: true },
  { name: "Accounting", code: "ACCOUNTING", scope: "การเงินและเอกสาร", users: 1, permissions: 22, system: true },
  { name: "Staff", code: "STAFF", scope: "ห้องพักและจดมิเตอร์", users: 1, permissions: 12, system: true },
  { name: "Auditor", code: "AUDITOR", scope: "ดูข้อมูลและรายงานอย่างเดียว", users: 0, permissions: 8, system: false },
];

export const permissionRows = [
  "จัดการกิจการและสาขา",
  "จัดการผู้ใช้งานและสิทธิ์",
  "จัดการห้องพักและอัตราค่าเช่า",
  "ทำสัญญาเช่าและผู้เช่า",
  "บันทึกมิเตอร์น้ำ-ไฟ",
  "ออกใบแจ้งหนี้และบิล",
  "บันทึกรับชำระและออกใบเสร็จ",
  "ดูรายงานและสถิติ",
];

export const permissionColumns = ["Owner", "Manager", "Accounting", "Staff", "Auditor"];
