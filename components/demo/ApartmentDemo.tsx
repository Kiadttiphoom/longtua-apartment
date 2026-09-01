"use client";
// apartment demo – updated

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { calculateInvoice, filterRows, toCsv } from "@/components/demo/demo-domain.mjs";
import {
  Download,
  Hotel,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Banknote,
  DoorOpen,
  Droplets,
  Eye,
  FilePlus,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  ListFilter,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideProps,
} from "lucide-react";

type RoleKey = "super_admin" | "owner" | "accounting" | "staff";
type SubscriptionState = "trialing" | "active" | "expired";
type PageKey =
  | "dashboard" | "companies" | "properties" | "rooms" | "tenants" | "contracts"
  | "meters" | "invoices" | "payments" | "receivables" | "reports" | "line"
  | "users" | "roles" | "permissions" | "menus" | "subscriptions" | "audit" | "settings";

type NavItem = { code: PageKey; label: string; icon: ComponentType<LucideProps>; addon?: boolean };
type NavGroup = { label: string; items: NavItem[] };
type Company = (typeof companies)[number];

const DEMO_ITEM_LIMIT = 25;
const DEMO_ADD_COOLDOWN_MS = 700;
const DEMO_STORAGE_KEY = "longtua-apartment-owner-demo-v2";

// ── Shared settings type ──
type AppSettings = {
  electricRate: number;
  waterRate: number;
  billDay: number;
  dueDay: number;
  lateFee: number;
  promptpay: string;
  accountName: string;
  invoiceHeader: string;
  invoiceNote: string;
  attachQR: boolean;
};

// ── Shared room record (meter source of truth) ──
type RoomRecord = {
  number: string;
  tenant: string;
  rent: number;
  prevElec: number;
  newElec: number | null;
  contractStart: string;
  contractEnd: string;
};

// ── Shared contract record ──
type ContractRecord = {
  id: string;
  roomNumber: string;
  tenantName: string;
  tenantIdCard: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  advanceRent: number;
  customClauses: string;
  status: "active" | "expired" | "draft";
};

// ── Property (หอพัก) — ข้อมูลแยกต่อหอ ──
type Property = {
  id: string;
  name: string;
  address: string;
  phone: string;
  settings: AppSettings;
  rooms: RoomRecord[];
  contracts: ContractRecord[];
};

function thaiBahtText(num: number): string {
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

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const blob = new Blob(["\uFEFF", toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-001",
    name: "สมชายแมนชั่น",
    address: "123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา 90110",
    phone: "074-200-001",
    settings: {
      electricRate: 3.50,
      waterRate: 50,
      billDay: 1,
      dueDay: 5,
      lateFee: 50,
      promptpay: "0812345678",
      accountName: "นายสมชาย ใจดี",
      invoiceHeader: "ใบแจ้งหนี้ค่าเช่า สมชายแมนชั่น",
      invoiceNote: "กรุณาชำระภายในกำหนด ขอบคุณครับ",
      attachQR: true,
    },
    rooms: [
      { number: "101", tenant: "สมชาย ใจดี",     rent: 4500, prevElec: 12430, newElec: null, contractStart: "1 ม.ค. 2568",  contractEnd: "31 ธ.ค. 2568" },
      { number: "102", tenant: "อารยา พรดี",      rent: 4500, prevElec:  8210, newElec: null, contractStart: "15 ก.พ. 2568", contractEnd: "14 ก.พ. 2569" },
      { number: "201", tenant: "ธนกร แสงงาม",    rent: 5000, prevElec:  5110, newElec: null, contractStart: "1 มี.ค. 2568", contractEnd: "28 ก.พ. 2569" },
      { number: "301", tenant: "ปิยะ สุขสวัสดิ์", rent: 5500, prevElec:  3290, newElec: null, contractStart: "1 มิ.ย. 2568", contractEnd: "31 พ.ค. 2569" },
      { number: "302", tenant: "กมลา ดีงาม",     rent: 5000, prevElec:  7840, newElec: null, contractStart: "10 ก.ค. 2568", contractEnd: "9 ก.ค. 2569"  },
      { number: "401", tenant: "นันท์นภัส วารี",  rent: 6000, prevElec:  1050, newElec: null, contractStart: "1 ส.ค. 2568",  contractEnd: "31 ก.ค. 2569" },
    ],
    contracts: [
      { id: "สญ.-2568-001", roomNumber: "101", tenantName: "สมชาย ใจดี",     tenantIdCard: "1-9098-00123-45-1", tenantPhone: "081-234-5678", startDate: "1 ม.ค. 2568",   endDate: "31 ธ.ค. 2568", rent: 4500, deposit: 9000,  advanceRent: 4500, customClauses: "ห้ามสูบบุหรี่ภายในห้องพักโดยเด็ดขาด", status: "active" },
      { id: "สญ.-2568-002", roomNumber: "102", tenantName: "อารยา พรดี",      tenantIdCard: "3-8401-00244-12-9", tenantPhone: "089-876-5432", startDate: "15 ก.พ. 2568",  endDate: "14 ก.พ. 2569", rent: 4500, deposit: 9000,  advanceRent: 4500, customClauses: "อนุญาตจอดรถจักรยานยนต์ 1 คัน (ช่อง M-02)", status: "active" },
      { id: "สญ.-2568-003", roomNumber: "201", tenantName: "ธนกร แสงงาม",    tenantIdCard: "1-1004-00892-31-0", tenantPhone: "082-345-6789", startDate: "1 มี.ค. 2568",  endDate: "28 ก.พ. 2569", rent: 5000, deposit: 10000, advanceRent: 5000, customClauses: "สิทธิ์จอดรถยนต์ช่อง A-04 พร้อมคีย์การ์ดเข้าออก 1 ใบ", status: "active" },
      { id: "สญ.-2568-004", roomNumber: "301", tenantName: "ปิยะ สุขสวัสดิ์", tenantIdCard: "3-9002-00561-88-2", tenantPhone: "086-554-3321", startDate: "1 มิ.ย. 2568",  endDate: "31 พ.ค. 2569", rent: 5500, deposit: 11000, advanceRent: 5500, customClauses: "ห้องปรับอากาศ เครื่องทำน้ำอุ่น และเฟอร์นิเจอร์ครบชุด", status: "active" },
      { id: "สญ.-2568-005", roomNumber: "302", tenantName: "กมลา ดีงาม",     tenantIdCard: "5-8001-00312-77-4", tenantPhone: "095-443-2211", startDate: "10 ก.ค. 2568", endDate: "9 ก.ค. 2569",  rent: 5000, deposit: 10000, advanceRent: 5000, customClauses: "ห้ามเลี้ยงสัตว์เลี้ยงทุกชนิดภายในห้องและอาคาร", status: "active" },
      { id: "สญ.-2568-006", roomNumber: "401", tenantName: "นันท์นภัส วารี",  tenantIdCard: "1-7009-00432-11-8", tenantPhone: "084-332-1100", startDate: "1 ส.ค. 2568",  endDate: "31 ก.ค. 2569", rent: 6000, deposit: 12000, advanceRent: 6000, customClauses: "ห้องชั้นบนสุด รวมระเบียงวิวสวน", status: "active" },
    ],
  },
  {
    id: "prop-002",
    name: "สมชายเพลส 2",
    address: "45 ถ.ราษฎร์ยินดี อ.เมือง จ.สงขลา 90000",
    phone: "074-300-002",
    settings: {
      electricRate: 8.00,
      waterRate: 100,
      billDay: 1,
      dueDay: 10,
      lateFee: 100,
      promptpay: "0898765432",
      accountName: "นายสมชาย ใจดี",
      invoiceHeader: "ใบแจ้งหนี้ค่าเช่า สมชายเพลส 2",
      invoiceNote: "กรุณาโอนและแจ้งสลิปภายในกำหนด ขอบคุณครับ",
      attachQR: true,
    },
    rooms: [
      { number: "A01", tenant: "วรพจน์ บุญมี",   rent: 3500, prevElec: 4320, newElec: null, contractStart: "1 มี.ค. 2568", contractEnd: "28 ก.พ. 2569" },
      { number: "A02", tenant: "พิมพ์ชนก วารี",  rent: 3500, prevElec: 6100, newElec: null, contractStart: "1 เม.ย. 2568", contractEnd: "31 มี.ค. 2569" },
      { number: "A03", tenant: "ณัฐพล แก้วใส",   rent: 4000, prevElec: 2890, newElec: null, contractStart: "15 พ.ค. 2568", contractEnd: "14 พ.ค. 2569" },
      { number: "B01", tenant: "(ว่าง)",          rent: 3500, prevElec: 9500, newElec: null, contractStart: "",             contractEnd: "" },
      { number: "B02", tenant: "สุภาวดี พรชัย",  rent: 4000, prevElec: 3210, newElec: null, contractStart: "1 มิ.ย. 2568", contractEnd: "31 พ.ค. 2569" },
    ],
    contracts: [
      { id: "สญ.-P2-001", roomNumber: "A01", tenantName: "วรพจน์ บุญมี",  tenantIdCard: "1-9001-00111-22-3", tenantPhone: "081-111-2233", startDate: "1 มี.ค. 2568",  endDate: "28 ก.พ. 2569", rent: 3500, deposit: 7000,  advanceRent: 3500, customClauses: "ห้ามสูบบุหรี่และห้ามนำของมึนเมาเข้าพัก", status: "active" },
      { id: "สญ.-P2-002", roomNumber: "A02", tenantName: "พิมพ์ชนก วารี", tenantIdCard: "3-8500-00222-33-4", tenantPhone: "089-222-3344", startDate: "1 เม.ย. 2568", endDate: "31 มี.ค. 2569", rent: 3500, deposit: 7000,  advanceRent: 3500, customClauses: "อนุญาตจอดรถจักรยานยนต์ 1 คัน",         status: "active" },
      { id: "สญ.-P2-003", roomNumber: "A03", tenantName: "ณัฐพล แก้วใส",  tenantIdCard: "1-7800-00333-44-5", tenantPhone: "082-333-4455", startDate: "15 พ.ค. 2568", endDate: "14 พ.ค. 2569", rent: 4000, deposit: 8000,  advanceRent: 4000, customClauses: "เฟอร์นิเจอร์ครบ ห้องใหม่",                status: "active" },
      { id: "สญ.-P2-004", roomNumber: "B02", tenantName: "สุภาวดี พรชัย", tenantIdCard: "5-9200-00444-55-6", tenantPhone: "086-444-5566", startDate: "1 มิ.ย. 2568",  endDate: "31 พ.ค. 2569", rent: 4000, deposit: 8000,  advanceRent: 4000, customClauses: "ห้ามเลี้ยงสัตว์",                            status: "active" },
    ],
  },
];


const navGroups: NavGroup[] = [
  { label: "ภาพรวม", items: [{ code: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard }] },
  { label: "กิจการของฉัน", items: [
    { code: "companies", label: "กิจการ", icon: Building2 },
    { code: "properties", label: "หอพักของฉัน", icon: Hotel },
    { code: "users", label: "ทีมงาน", icon: Users },
  ] },
  { label: "จัดการหอพัก", items: [
    { code: "rooms", label: "ห้องพัก", icon: KeyRound },
    { code: "tenants", label: "ผู้เช่า", icon: Users },
    { code: "contracts", label: "สัญญาเช่า", icon: ClipboardList },
  ] },
  { label: "การเงิน", items: [
    { code: "meters", label: "มิเตอร์", icon: Gauge },
    { code: "invoices", label: "ใบแจ้งหนี้", icon: FileText },
    { code: "payments", label: "รับชำระ", icon: WalletCards },
    { code: "receivables", label: "ยอดค้าง", icon: ReceiptText },
    { code: "reports", label: "รายงาน", icon: BookOpenCheck },
  ] },
  { label: "บริการเสริม", items: [{ code: "line", label: "LINE แจ้งเตือน", icon: MessageCircle, addon: true }] },
  { label: "ระบบ", items: [
    { code: "subscriptions", label: "แพ็กเกจและบริการ", icon: CircleDollarSign },
    { code: "settings", label: "ตั้งค่าระบบ", icon: Settings },
  ] },
];

const roleInfo: Record<RoleKey, { label: string; name: string; initials: string; allowed: PageKey[] }> = {
  super_admin: {
    label: "Super Admin", name: "พงศกร · Longtua", initials: "พ",
    allowed: navGroups.flatMap((group) => group.items.map((item) => item.code)),
  },
  owner: {
    label: "เจ้าของกิจการ", name: "สมชาย ใจดี", initials: "ส",
    allowed: ["dashboard", "properties", "users", "rooms", "tenants", "contracts", "meters", "invoices", "payments", "receivables", "reports", "line", "subscriptions", "settings"],
  },
  accounting: {
    label: "ฝ่ายบัญชี", name: "สุภาวดี พรชัย", initials: "ส",
    allowed: ["dashboard", "meters", "invoices", "payments", "receivables", "reports", "line"],
  },
  staff: {
    label: "พนักงาน", name: "อนันต์ ดีพร้อม", initials: "อ",
    allowed: ["dashboard", "rooms", "tenants", "contracts", "meters"],
  },
};

const companies = [
  { name: "บริษัท สมชายอพาร์ทเมนท์", owner: "สมชาย ใจดี", plan: "Business", properties: 3, users: 8, status: "active", date: "25 ก.ย. 2569" },
  { name: "สุขใจเรสซิเดนซ์", owner: "นฤมล สุขใจ", plan: "Trial", properties: 1, users: 3, status: "trial", date: "อีก 3 วัน" },
  { name: "บ้านสวนหอพัก", owner: "วรพจน์ บุญมี", plan: "Starter", properties: 2, users: 4, status: "active", date: "10 ต.ค. 2569" },
  { name: "ชลธารแมนชั่น", owner: "พิมพ์ชนก วารี", plan: "Trial", properties: 1, users: 2, status: "expired", date: "หมดอายุแล้ว" },
  { name: "เดอะเนสท์ อพาร์ตเมนต์", owner: "ธนกร มากทรัพย์", plan: "Business", properties: 4, users: 12, status: "active", date: "1 พ.ย. 2569" },
];

const roles = [
  { name: "Super Admin", code: "super_admin", scope: "ทุกกิจการ", users: 2, permissions: 96, system: true },
  { name: "เจ้าของกิจการ", code: "owner", scope: "ทั้งกิจการ", users: 18, permissions: 72, system: true },
  { name: "ผู้จัดการ", code: "manager", scope: "หอที่ได้รับมอบหมาย", users: 11, permissions: 54, system: true },
  { name: "ฝ่ายบัญชี", code: "accounting", scope: "หอที่ได้รับมอบหมาย", users: 9, permissions: 28, system: false },
  { name: "พนักงาน", code: "staff", scope: "หอที่ได้รับมอบหมาย", users: 24, permissions: 22, system: false },
];

const permissionRows = ["ห้องพัก", "ผู้เช่า", "สัญญาเช่า", "มิเตอร์", "ใบแจ้งหนี้", "รับชำระ", "ยอดค้าง", "ผู้ใช้งาน"];
const permissionColumns = ["เห็นเมนู", "ดู", "เพิ่ม", "แก้ไข", "ยกเลิก", "Export"];

export function ApartmentDemo({
  showDemoControls = true,
  currentUserName,
  currentUserRoleLabel,
  currentOrganizationName,
  initialSubscription = "active",
  trialDaysRemaining,
  trialEndsAtText,
  logoutAction,
}: {
  showDemoControls?: boolean;
  currentUserName?: string;
  currentUserRoleLabel?: string;
  currentOrganizationName?: string;
  initialSubscription?: SubscriptionState;
  trialDaysRemaining?: number;
  trialEndsAtText?: string;
  logoutAction?: () => Promise<void>;
}) {
  const role: RoleKey = "owner";
  const [subscription, setSubscription] = useState<SubscriptionState>(initialSubscription);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [hasRestoredDemo, setHasRestoredDemo] = useState(!showDemoControls);
  const companyCollection = useDemoCollection(companies, showToast);

  // ── Multi-property state ──
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [activePropertyId, setActivePropertyId] = useState<string>(INITIAL_PROPERTIES[0].id);
  const [showPropertySwitcher, setShowPropertySwitcher] = useState(false);
  const [showAddPropertyWizard, setShowAddPropertyWizard] = useState(false);

  // ── Modal state ──
  const [viewingContract, setViewingContract] = useState<ContractRecord | null>(null);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<RoomRecord | null>(null);

  useEffect(() => {
    if (!showDemoControls) return;
    const restoreTimer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as {
            properties?: Property[];
            activePropertyId?: string;
            subscription?: SubscriptionState;
            lineEnabled?: boolean;
          };
          if (saved.properties?.length) setProperties(saved.properties);
          if (saved.activePropertyId) setActivePropertyId(saved.activePropertyId);
          if (saved.subscription) setSubscription(saved.subscription);
          if (typeof saved.lineEnabled === "boolean") setLineEnabled(saved.lineEnabled);
        }
      } catch {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
      } finally {
        setHasRestoredDemo(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [showDemoControls]);

  useEffect(() => {
    if (!hasRestoredDemo || !showDemoControls) return;
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({
      properties,
      activePropertyId,
      subscription,
      lineEnabled,
    }));
  }, [activePropertyId, hasRestoredDemo, lineEnabled, properties, showDemoControls, subscription]);

  // ── Derived: active property data ──
  const activeProperty = properties.find(p => p.id === activePropertyId) ?? properties[0];
  const appSettings = activeProperty.settings;
  const meterRooms = activeProperty.rooms;
  const contracts = activeProperty.contracts;

  const currentRole = roleInfo[role];
  const displayUserName = currentUserName ?? currentRole.name;
  const displayUserRole = currentUserRoleLabel ?? currentRole.label;
  const displayUserContext = currentOrganizationName
    ? `${displayUserRole} · ${currentOrganizationName}`
    : displayUserRole;
  const displayInitials = displayUserName.trim().slice(0, 1) || currentRole.initials;
  const visibleGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => currentRole.allowed.includes(item.code)) }))
    .filter((group) => group.items.length > 0), [currentRole]);
  const isLocked = subscription === "expired";

  function navigate(page: PageKey) {
    setActivePage(page);
    setIsMobileOpen(false);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  // ── Property-scoped helpers ──
  function updateActiveProperty(updater: (p: Property) => Property) {
    setProperties(prev => prev.map(p => p.id === activePropertyId ? updater(p) : p));
  }

  function updateMeter(roomNumber: string, newElec: number | null) {
    updateActiveProperty(p => ({
      ...p,
      rooms: p.rooms.map(r => r.number === roomNumber ? { ...r, newElec } : r),
    }));
  }

  function saveContract(updated: ContractRecord) {
    updateActiveProperty(p => {
      const idx = p.contracts.findIndex(c => c.id === updated.id);
      const nextContracts = idx >= 0
        ? p.contracts.map((c, i) => i === idx ? updated : c)
        : [updated, ...p.contracts];
      const nextRooms = p.rooms.map(r => r.number === updated.roomNumber
        ? { ...r, tenant: updated.tenantName, rent: updated.rent, contractStart: updated.startDate, contractEnd: updated.endDate }
        : r);
      return { ...p, contracts: nextContracts, rooms: nextRooms };
    });
    if (viewingContract && viewingContract.id === updated.id) setViewingContract(updated);
  }

  function deleteContract(id: string) {
    updateActiveProperty(p => ({ ...p, contracts: p.contracts.filter(c => c.id !== id) }));
    showToast("ลบสัญญาเช่าเรียบร้อยแล้ว");
  }

  function updateSettings(s: AppSettings) {
    updateActiveProperty(p => ({ ...p, settings: s }));
  }

  function addProperty(prop: Property) {
    setProperties(prev => [...prev, prop]);
    setActivePropertyId(prop.id);
    setShowAddPropertyWizard(false);
    navigate("dashboard");
    showToast(`เพิ่มหอพัก "${prop.name}" เรียบร้อยแล้ว`);
  }

  function addRoom(room: RoomRecord) {
    updateActiveProperty((property) => ({ ...property, rooms: [...property.rooms, room] }));
    showToast(`เพิ่มห้อง ${room.number} เรียบร้อยแล้ว`);
  }

  function resetDemo() {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    setSubscription(initialSubscription);
    setLineEnabled(false);
    setActivePage("dashboard");
    setProperties(INITIAL_PROPERTIES);
    setActivePropertyId(INITIAL_PROPERTIES[0].id);
    setGlobalSearch("");
    showToast("รีเซ็ตข้อมูล Demo กลับค่าเริ่มต้นแล้ว");
  }

  function submitGlobalSearch() {
    const term = globalSearch.trim().toLocaleLowerCase("th");
    if (!term) return;
    const target = visibleGroups.flatMap((group) => group.items)
      .find((item) => item.label.toLocaleLowerCase("th").includes(term) || item.code.includes(term));
    if (target) {
      navigate(target.code);
      showToast(`เปิดหน้า ${target.label} จากการค้นหาแล้ว`);
      return;
    }
    if (properties.some((property) => property.name.toLocaleLowerCase("th").includes(term))) {
      navigate("properties");
      showToast("พบหอพักที่ค้นหาในหน้าหอพัก");
      return;
    }
    if (properties.some((property) => property.rooms.some((room) => `${room.number} ${room.tenant}`.toLocaleLowerCase("th").includes(term)))) {
      navigate("rooms");
      showToast("พบห้องหรือผู้เช่าที่ค้นหาในหน้าห้องพัก");
      return;
    }
    showToast("ไม่พบข้อมูลที่ตรงกับคำค้นหา");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <button className="brand-button" type="button" onClick={() => navigate("dashboard")}>
            <BrandLogo className="sidebar-brand-logo" />
          </button>
          <button className="icon-button sidebar-close" aria-label="ปิดเมนู" onClick={() => setIsMobileOpen(false)}><X size={20} /></button>
        </div>

        <div className="property-switcher-wrap">
            <button
              className="context-selector"
              type="button"
              onClick={() => setShowPropertySwitcher(v => !v)}
            >
              <span className="context-icon"><Building2 size={18} /></span>
              <span>
                <small>หอพักที่กำลังจัดการ</small>
                <strong>{activeProperty.name}</strong>
              </span>
              <ChevronDown size={16} style={{ transform: showPropertySwitcher ? "rotate(180deg)" : "none", transition: "0.2s" }} />
            </button>
            {showPropertySwitcher && (
              <div className="property-dropdown">
                {properties.map(p => (
                  <button
                    key={p.id}
                    className={`property-option${p.id === activePropertyId ? " active" : ""}`}
                    onClick={() => {
                      setActivePropertyId(p.id);
                      setShowPropertySwitcher(false);
                      navigate("dashboard");
                    }}
                  >
                    <Building2 size={15} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.rooms.length} ห้อง · {p.rooms.filter(r => r.tenant && r.tenant !== "(ว่าง)").length} มีผู้เช่า</small>
                    </span>
                    {p.id === activePropertyId && <ShieldCheck size={14} style={{ color: "var(--primary)", marginLeft: "auto" }} />}
                  </button>
                ))}
                <div className="property-dropdown-sep" />
                <button
                  className="property-option add-property"
                  onClick={() => {
                    setShowPropertySwitcher(false);
                    setShowAddPropertyWizard(true);
                  }}
                >
                  <Plus size={15} />
                  <span><strong>เพิ่มหอพักใหม่</strong></span>
                </button>
              </div>
            )}
          </div>

        <nav className="sidebar-nav" aria-label="เมนูหลัก">
          {visibleGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const addonLocked = item.addon && !lineEnabled;
                return (
                  <button className={activePage === item.code ? "active" : ""} key={item.code} onClick={() => navigate(item.code)} type="button">
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {addonLocked ? <LockKeyhole className="menu-lock" size={14} /> : null}
                  </button>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{displayInitials}</span>
          <span><strong>{displayUserName}</strong><small title={displayUserContext}>{displayUserContext}</small></span>
          {logoutAction ? (
            <form action={logoutAction}>
              <button className="sidebar-logout" aria-label="ออกจากระบบ" title="ออกจากระบบ" type="submit"><LogOut size={17} /></button>
            </form>
          ) : <MoreHorizontal size={18} />}
        </div>
      </aside>

      {isMobileOpen ? <button className="sidebar-backdrop" aria-label="ปิดเมนู" onClick={() => setIsMobileOpen(false)} /> : null}
      {showPropertySwitcher ? <button className="sidebar-backdrop" style={{ zIndex: 19 }} aria-label="ปิด" onClick={() => setShowPropertySwitcher(false)} /> : null}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="เปิดเมนู" onClick={() => setIsMobileOpen(true)}><Menu size={21} /></button>
          <label className="global-search"><Search size={18} /><input aria-label="ค้นหาทั่วระบบ" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitGlobalSearch(); }} placeholder="ค้นหาห้อง ผู้เช่า หรือเมนู แล้วกด Enter" /></label>
          {showDemoControls ? <div className="demo-controls">
            <span className="demo-owner-badge"><ShieldCheck size={15} /> บัญชีเจ้าของ · ข้อมูลตัวอย่าง</span>
            <button className="icon-button reset-demo" type="button" title="รีเซ็ตข้อมูล Demo" aria-label="รีเซ็ตข้อมูล Demo" onClick={resetDemo}><RotateCcw size={17} /></button>
          </div> : null}
          <button className="icon-button notification" aria-label="การแจ้งเตือน"><Bell size={19} /><i /></button>
          <span className="top-avatar">{displayInitials}</span>
        </header>

        <main className="content">
          {subscription === "trialing" ? (
            <div className="trial-banner"><span><Zap size={18} /><strong>{trialDaysRemaining === undefined ? "ช่วงทดลองใช้ฟรี 30 วัน" : `ทดลองใช้ฟรีเหลือ ${trialDaysRemaining} วัน`}</strong><small>{trialEndsAtText ? `ใช้งานได้ถึง ${trialEndsAtText}` : "ใช้งานได้ถึง 7 กันยายน 2569"}</small></span><button onClick={() => navigate("subscriptions")}>ดูแพ็กเกจ <ChevronRight size={16} /></button></div>
          ) : null}
          {isLocked ? (
            <div className="expired-banner"><span><LockKeyhole size={19} /><strong>ระยะเวลาการใช้งานสิ้นสุดแล้ว</strong><small>ข้อมูลยังอยู่ครบ แต่ไม่สามารถเพิ่มหรือแก้ไขรายการได้</small></span><button onClick={() => navigate("subscriptions")}>ต่ออายุบริการ</button></div>
          ) : null}

          <PageContent
            activePage={activePage}
            role={role}
            isLocked={isLocked}
            lineEnabled={lineEnabled}
            onLineChange={setLineEnabled}
            onOpenPanel={() => setIsPanelOpen(true)}
            onNavigate={navigate}
            onToast={showToast}
            companies={companyCollection.items}
            onDeleteCompany={companyCollection.removeItem}
            appSettings={appSettings}
            onSettingsChange={updateSettings}
            meterRooms={meterRooms}
            onMeterChange={updateMeter}
            contracts={contracts}
            onViewContract={setViewingContract}
            onEditContract={setEditingContract}
            onDeleteContract={deleteContract}
            onViewInvoice={setViewingInvoice}
            activeProperty={activeProperty}
            ownerName={displayUserName}
            properties={properties}
            onSwitchProperty={(id) => { setActivePropertyId(id); navigate("dashboard"); }}
            onAddProperty={() => setShowAddPropertyWizard(true)}
            onAddRoom={addRoom}
          />
        </main>
      </div>

      {isPanelOpen ? <CompanyPanel onClose={() => setIsPanelOpen(false)} onSave={(company) => {
        if (!companyCollection.addItem(company)) return;
        setIsPanelOpen(false);
        showToast("เพิ่มกิจการตัวอย่างเรียบร้อยแล้ว");
      }} /> : null}

      {editingContract !== null ? (
        <ContractFormModal
          contract={editingContract}
          onClose={() => setEditingContract(null)}
          onSave={(saved) => {
            saveContract(saved);
            setEditingContract(null);
            showToast("บันทึกสัญญาเช่าเรียบร้อยแล้ว");
          }}
          onSaveAndView={(saved) => {
            saveContract(saved);
            setEditingContract(null);
            setViewingContract(saved);
            showToast("บันทึกและเปิดตัวอย่างสัญญา");
          }}
        />
      ) : null}

      {viewingContract ? (
        <ContractModal
          contract={viewingContract}
          settings={appSettings}
          onClose={() => setViewingContract(null)}
          onEdit={() => {
            const target = viewingContract;
            setViewingContract(null);
            setEditingContract(target);
          }}
        />
      ) : null}

      {viewingInvoice ? <InvoiceModal room={viewingInvoice} settings={appSettings} onClose={() => setViewingInvoice(null)} /> : null}

      {showAddPropertyWizard ? (
        <AddPropertyWizard
          existingSettings={appSettings}
          onClose={() => setShowAddPropertyWizard(false)}
          onSave={addProperty}
        />
      ) : null}

      {toast ? <div className="toast"><span><ShieldCheck size={18} /></span>{toast}</div> : null}
    </div>
  );
}





type PageContentProps = {
  activePage: PageKey; role: RoleKey; isLocked: boolean; lineEnabled: boolean;
  onLineChange: (value: boolean) => void; onOpenPanel: () => void;
  onNavigate: (page: PageKey) => void; onToast: (message: string) => void;
  companies: Company[]; onDeleteCompany: (index: number) => void;
  appSettings: AppSettings; onSettingsChange: (s: AppSettings) => void;
  meterRooms: RoomRecord[]; onMeterChange: (roomNumber: string, newElec: number | null) => void;
  contracts: ContractRecord[];
  onViewContract: (contract: ContractRecord) => void;
  onEditContract: (contract: ContractRecord | null) => void;
  onDeleteContract: (id: string) => void;
  onViewInvoice: (room: RoomRecord) => void;
  activeProperty: Property;
  ownerName: string;
  properties: Property[];
  onSwitchProperty: (id: string) => void;
  onAddProperty: () => void;
  onAddRoom: (room: RoomRecord) => void;
};


function PageContent(props: PageContentProps) {
  if (props.activePage === "dashboard") return <DashboardPage {...props} />;
  if (props.activePage === "companies") return <CompaniesPage {...props} />;
  if (props.activePage === "properties") return <PropertiesPage {...props} />;
  if (props.activePage === "users") return <UsersPage {...props} />;
  if (props.activePage === "roles") return <RolesPage {...props} />;
  if (props.activePage === "permissions") return <PermissionsPage {...props} />;
  if (props.activePage === "subscriptions") return <SubscriptionsPage {...props} />;
  if (props.activePage === "line") return <LinePage {...props} />;
  if (props.activePage === "rooms") return <RoomsPage {...props} />;
  if (props.activePage === "audit") return <AuditPage />;
  if (props.activePage === "tenants") return <TenantsPage {...props} />;
  if (props.activePage === "contracts") return <ContractsPage {...props} />;
  if (props.activePage === "meters") return <MetersPage {...props} />;
  if (props.activePage === "invoices") return <InvoicesPage {...props} />;
  if (props.activePage === "payments") return <PaymentsPage {...props} />;
  if (props.activePage === "receivables") return <ReceivablesPage {...props} />;
  if (props.activePage === "reports") return <ReportsPage {...props} />;
  if (props.activePage === "menus") return <MenusPage {...props} />;
  if (props.activePage === "settings") return <SettingsPage {...props} />;
  return null;
}




function DashboardPage({ role, ownerName, isLocked, onOpenPanel, onNavigate, activeProperty, meterRooms, contracts }: PageContentProps) {
  const admin = role === "super_admin";
  return (
    <>
      <PageHeader eyebrow={admin ? "ภาพรวมแพลตฟอร์ม" : `ภาพรวมเจ้าของ · ${activeProperty.name}`} title={admin ? "แดชบอร์ด" : `สวัสดีครับ คุณ${ownerName}`} description={admin ? "ติดตามลูกค้า การใช้งาน และสถานะบริการทั้งหมด" : "ตัวเลขสำคัญและงานที่ต้องจัดการของหอพักวันนี้"}>
        {admin ? <button className="button primary" onClick={onOpenPanel}><Plus size={17} /> เพิ่มกิจการ</button> : <><button className="button secondary" disabled={isLocked} onClick={() => onNavigate("meters")}><Gauge size={17} /> จดมิเตอร์</button><button className="button primary" disabled={isLocked} onClick={() => onNavigate("payments")}><Plus size={17} /> รับชำระ</button></>}
      </PageHeader>
      {admin ? <AdminDashboard onNavigate={onNavigate} /> : <CustomerDashboard isLocked={isLocked} onNavigate={onNavigate} activeProperty={activeProperty} meterRooms={meterRooms} contracts={contracts} />}
    </>
  );
}

function AdminDashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <>
      <section className="metric-grid">
        <Metric label="กิจการทั้งหมด" value="28" delta="+4 เดือนนี้" icon={Building2} tone="blue" />
        <Metric label="หอพักในระบบ" value="46" delta="2,184 ห้อง" icon={Hotel} tone="violet" />
        <Metric label="Subscription Active" value="21" delta="75% ของลูกค้า" icon={CircleDollarSign} tone="green" />
        <Metric label="Trial ใกล้หมด" value="4" delta="ภายใน 7 วัน" icon={Gauge} tone="orange" />
      </section>
      <section className="dashboard-grid">
        <div className="panel wide-panel">
          <PanelHeading title="สถานะลูกค้า" description="กิจการที่ต้องติดตามในรอบนี้" action="ดูลูกค้าทั้งหมด" onAction={() => onNavigate("companies")} />
          <div className="status-overview">
            <div className="donut" aria-label="75 เปอร์เซ็นต์ Active"><span><strong>75%</strong><small>Active</small></span></div>
            <div className="status-bars">
              <StatusBar label="ชำระแล้ว" value={21} total={28} color="green" />
              <StatusBar label="กำลังทดลอง" value={5} total={28} color="blue" />
              <StatusBar label="หมดอายุ" value={2} total={28} color="red" />
            </div>
          </div>
        </div>
        <div className="panel attention-panel">
          <PanelHeading title="ต้องดำเนินการ" description="รายการสำคัญวันนี้" />
          <button onClick={() => onNavigate("subscriptions")}><span className="attention-icon orange"><Gauge size={18} /></span><span><strong>Trial ใกล้หมด</strong><small>4 กิจการ ภายใน 7 วัน</small></span><ChevronRight size={17} /></button>
          <button onClick={() => onNavigate("subscriptions")}><span className="attention-icon red"><CircleDollarSign size={18} /></span><span><strong>เกินกำหนดชำระ</strong><small>2 กิจการ รวม ฿3,180</small></span><ChevronRight size={17} /></button>
          <button onClick={() => onNavigate("users")}><span className="attention-icon blue"><Users size={18} /></span><span><strong>คำเชิญรอยืนยัน</strong><small>6 ผู้ใช้งาน</small></span><ChevronRight size={17} /></button>
        </div>
      </section>
      <section className="panel table-panel">
        <PanelHeading title="กิจการล่าสุด" description="ลูกค้าและสถานะบริการที่มีการเปลี่ยนแปลงล่าสุด" action="ดูทั้งหมด" onAction={() => onNavigate("companies")} />
        <CompanyTable rows={companies.slice(0, 4)} />
      </section>
    </>
  );
}

function CustomerDashboard({
  isLocked, onNavigate, activeProperty, meterRooms, contracts,
}: {
  isLocked: boolean;
  onNavigate: (page: PageKey) => void;
  activeProperty: Property;
  meterRooms: RoomRecord[];
  contracts: ContractRecord[];
}) {
  const totalRooms = meterRooms.length;
  const occupied = meterRooms.filter(r => r.tenant && r.tenant !== "(ว่าง)").length;
  const occupancy = totalRooms > 0 ? ((occupied / totalRooms) * 100).toFixed(1) : "0.0";
  const monthlyRent = contracts.filter(c => c.status === "active").reduce((s, c) => s + c.rent, 0);
  const needMeter = meterRooms.filter(r => r.newElec === null).length;
  const soonExpiry = contracts.filter(c => c.status === "active").length;
  const collected = Math.round(monthlyRent * 0.78);
  const outstanding = Math.max(monthlyRent - collected, 0);
  const collectionRate = monthlyRent > 0 ? Math.round((collected / monthlyRent) * 100) : 0;

  return (
    <>
      <section className="owner-quick-actions" aria-label="งานด่วน">
        <button disabled={isLocked} onClick={() => onNavigate("meters")}><span className="quick-action-icon blue"><Gauge size={19} /></span><span><strong>จดมิเตอร์</strong><small>{needMeter} ห้องยังไม่บันทึก</small></span><ChevronRight size={17} /></button>
        <button disabled={isLocked} onClick={() => onNavigate("invoices")}><span className="quick-action-icon violet"><FileText size={19} /></span><span><strong>ออกบิลประจำเดือน</strong><small>พร้อมตรวจสอบก่อนส่ง</small></span><ChevronRight size={17} /></button>
        <button disabled={isLocked} onClick={() => onNavigate("payments")}><span className="quick-action-icon green"><WalletCards size={19} /></span><span><strong>บันทึกรับชำระ</strong><small>ออกใบเสร็จได้ทันที</small></span><ChevronRight size={17} /></button>
        <button disabled={isLocked} onClick={() => onNavigate("contracts")}><span className="quick-action-icon orange"><Users size={19} /></span><span><strong>เพิ่มผู้เช่า</strong><small>ทำสัญญาและเข้าพัก</small></span><ChevronRight size={17} /></button>
      </section>
      <section className="metric-grid owner-metrics">
        <Metric label="รายรับเดือนนี้" value={`฿${collected.toLocaleString()}`} delta={`${collectionRate}% ของค่าเช่าที่เรียกเก็บ`} icon={CircleDollarSign} tone="green" />
        <Metric label="ค้างชำระ" value={`฿${outstanding.toLocaleString()}`} delta="ติดตาม 3 ห้อง" icon={ReceiptText} tone="orange" />
        <Metric label="ห้องว่าง" value={String(totalRooms - occupied)} delta={`จากทั้งหมด ${totalRooms} ห้อง`} icon={KeyRound} tone="blue" />
        <Metric label="อัตราเข้าพัก" value={`${occupancy}%`} delta={`${occupied} ห้องมีผู้เช่า`} icon={Building2} tone="violet" />
      </section>
      <section className="dashboard-grid">
        <div className="panel task-panel">
          <PanelHeading title="งานที่ต้องทำ" description="กดเพื่อไปจัดการรายการต่อได้ทันที" />
          {[
            [`ต้องอ่านมิเตอร์`, `${needMeter} ห้อง`, "meters"],
            ["ยังไม่ออกบิล", "3 ห้อง", "invoices"],
            ["ครบกำหนดวันนี้", "5 บิล", "receivables"],
            [`สัญญา Active`, `${soonExpiry} ฉบับ`, "contracts"],
          ].map(([label, count, page]) => (
            <button disabled={isLocked} key={label} onClick={() => onNavigate(page as PageKey)}><span>{label}</span><strong>{count}</strong><ChevronRight size={17} /></button>
          ))}
        </div>
        <div className="panel owner-finance-panel">
          <PanelHeading title="สรุปรายรับเดือนนี้" description="เทียบกับยอดที่ควรเรียกเก็บ" action="ดูรายงาน" onAction={() => onNavigate("reports")} />
          <div className="owner-finance-summary">
            <span><small>รับแล้ว</small><strong>฿{collected.toLocaleString()}</strong></span>
            <span><small>เป้าหมาย</small><strong>฿{monthlyRent.toLocaleString()}</strong></span>
          </div>
          <div className="collection-progress" aria-label={`เก็บค่าเช่าแล้ว ${collectionRate} เปอร์เซ็นต์`}><i style={{ width: `${collectionRate}%` }} /></div>
          <div className="owner-finance-note"><CalendarDays size={17} /><span><strong>รอบบิลเดือนสิงหาคม</strong><small>ครบกำหนดชำระวันที่ {activeProperty.settings.dueDay}</small></span></div>
          <button className="owner-outstanding-link" onClick={() => onNavigate("receivables")}><span>ยอดที่ต้องติดตาม</span><strong>฿{outstanding.toLocaleString()}</strong><ChevronRight size={17} /></button>
          </div>
      </section>
    </>
  );
}


function CompaniesPage({ onOpenPanel, companies: companyItems, onDeleteCompany }: PageContentProps) {
  return (
    <>
      <PageHeader eyebrow="จัดการลูกค้า" title="กิจการ" description="จัดการลูกค้า เจ้าของกิจการ และสถานะการให้บริการ"><button className="button primary" onClick={onOpenPanel}><Plus size={17} /> เพิ่มกิจการ</button></PageHeader>
      <FilterBar placeholder="ค้นหาชื่อกิจการ เจ้าของ หรือเบอร์โทร" filters={[{ label: "ทุกสถานะ", options: ["Active", "Trial", "หมดอายุ"] }, { label: "ทุกแพ็กเกจ", options: ["Starter", "Business"] }]} />
      <section className="panel table-panel"><div className="list-summary"><span>รายการใน Demo <strong>{companyItems.length} กิจการ</strong></span><span>ข้อมูลหลักจะถูกเก็บไว้ในเบราว์เซอร์จนกดรีเซ็ต Demo</span></div><CompanyTable rows={companyItems} onDelete={onDeleteCompany} /></section>
    </>
  );
}

function PropertiesPage({ role, isLocked, properties, activeProperty, onSwitchProperty, onAddProperty, onToast, onNavigate }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  return (
    <>
      <PageHeader
        eyebrow="จัดการลูกค้า"
        title="หอพัก"
        description={
          role === "super_admin"
            ? "หอพักทั้งหมดในระบบและกิจการที่เป็นเจ้าของ"
            : "หอพักภายในกิจการของคุณ · คลิกเพื่อสลับหอพักที่กำลังจัดการ"
        }
      >
        <button disabled={isLocked} className="button primary" onClick={onAddProperty}>
          <Plus size={17} /> เพิ่มหอพักใหม่
        </button>
      </PageHeader>

      <div className="meter-summary-bar">
        <span><strong>หอพักทั้งหมด</strong>{properties.length} แห่ง</span>
        <span><strong>หอพักที่เลือกอยู่</strong>{activeProperty.name}</span>
        <span><strong>ห้องพักรวม</strong>{properties.reduce((s, p) => s + p.rooms.length, 0)} ห้อง</span>
        <span><strong>ผู้เช่ารวม</strong>{properties.reduce((s, p) => s + p.contracts.filter(c => c.status === "active").length, 0)} คน</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ชื่อหอพัก</th>
                  <th>ที่อยู่</th>
                  <th>เบอร์ติดต่อ</th>
                  <th>จำนวนห้อง</th>
                  <th>ผู้เช่า</th>
                  <th>อัตราค่าไฟ / ค่าน้ำ</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => {
                  const isActive = p.id === activeProperty.id;
                  const occupiedCount = p.rooms.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length;
                  return (
                    <tr key={p.id} style={isActive ? { background: "#f0f7ff" } : {}}>
                      <td>
                        <span className="company-cell">
                          <i style={{ background: isActive ? "var(--primary)" : "#e2e8f0", color: isActive ? "white" : "var(--ink)" }}>🏢</i>
                          <span>
                            <strong>{p.name}</strong>
                            {isActive && <small style={{ color: "var(--primary)", fontWeight: 600 }}>กำลังใช้งานอยู่</small>}
                          </span>
                        </span>
                      </td>
                      <td><small>{p.address || "—"}</small></td>
                      <td>{p.phone || "—"}</td>
                      <td><strong>{p.rooms.length}</strong> ห้อง</td>
                      <td><strong>{occupiedCount}</strong> / {p.rooms.length}</td>
                      <td><small>ไฟ ฿{p.settings.electricRate}/หน่วย · น้ำ ฿{p.settings.waterRate}/ด.</small></td>
                      <td>
                        {isActive ? (
                          <span className="badge success"><i />กำลังใช้งาน</span>
                        ) : (
                          <span className="badge neutral"><i />พร้อมใช้งาน</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {!isActive ? (
                          <button
                            className="button secondary"
                            style={{ fontSize: 12, minHeight: 32, padding: "0 12px" }}
                            onClick={() => {
                              onSwitchProperty(p.id);
                              onToast(`สลับไปยัง "${p.name}" แล้ว`);
                            }}
                          >
                            สลับไปหอนี้
                          </button>
                        ) : (
                          <button
                            className="button secondary"
                            style={{ fontSize: 12, minHeight: 32, padding: "0 12px" }}
                            onClick={() => onNavigate("rooms")}
                          >
                            ดูห้องพัก
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="portal-dormitory-grid">
          {filteredProperties.map((p) => {
            const isActive = p.id === activeProperty.id;
            const occupiedCount = p.rooms.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length;
            const vacantCount = p.rooms.length - occupiedCount;

            return (
              <article className="portal-dormitory-card" key={p.id}>
                <header>
                  <span>
                    <Building2 aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{p.name}</h2>
                    {isActive ? (
                      <span className="badge success" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                        <i /> กำลังใช้งาน
                      </span>
                    ) : (
                      <span className="badge neutral" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                        <i /> พร้อมใช้งาน
                      </span>
                    )}
                  </div>
                </header>

                <div className="portal-dormitory-contact">
                  <p>
                    <MapPin aria-hidden="true" size={15} />
                    <span>{p.address || "123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา"}</span>
                  </p>
                  <p>
                    <Phone aria-hidden="true" size={15} />
                    <span>{p.phone || "074-200-001"}</span>
                  </p>
                </div>

                <dl>
                  <div>
                    <dt>ห้องทั้งหมด</dt>
                    <dd>{p.rooms.length}</dd>
                  </div>
                  <div>
                    <dt>ห้องว่าง</dt>
                    <dd style={{ color: "#1d4ed8" }}>{vacantCount}</dd>
                  </div>
                  <div>
                    <dt>มีผู้เช่า</dt>
                    <dd style={{ color: "#0d9488" }}>{occupiedCount}</dd>
                  </div>
                </dl>

                <footer className="portal-dormitory-card-footer">
                  <div className="portal-lease-card-actions-grid">
                    <button
                      className="portal-lease-card-btn view"
                      onClick={() => {
                        if (!isActive) onSwitchProperty(p.id);
                        onNavigate("rooms");
                      }}
                      title="ดูห้องพัก"
                      type="button"
                    >
                      <DoorOpen size={15} />
                      <span>จัดการห้องพัก ({p.rooms.length})</span>
                    </button>
                    {!isActive ? (
                      <button
                        className="portal-lease-card-btn edit"
                        onClick={() => {
                          onSwitchProperty(p.id);
                          onToast(`สลับไปยัง "${p.name}" แล้ว`);
                        }}
                        title="สลับไปหอนี้"
                        type="button"
                      >
                        <ShieldCheck size={15} />
                        <span>สลับไปหอนี้</span>
                      </button>
                    ) : (
                      <button
                        className="portal-lease-card-btn edit"
                        onClick={() => onNavigate("settings")}
                        title="ตั้งค่าหอนี้"
                        type="button"
                      >
                        <Settings size={15} />
                        <span>ตั้งค่าหอนี้</span>
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}



function UsersPage({ isLocked, onToast }: PageContentProps) {
  const initialRows = [
    ["สมชาย ใจดี", "owner@somchai.com", "เจ้าของกิจการ", "ทุกหอ", "ใช้งานอยู่"],
    ["สุภาวดี พรชัย", "account@somchai.com", "ฝ่ายบัญชี", "2 หอพัก", "ใช้งานอยู่"],
    ["อนันต์ ดีพร้อม", "anan@somchai.com", "พนักงาน", "สมชายแมนชั่น", "ใช้งานอยู่"],
    ["จารุวรรณ แสงดี", "jaruwan@sukjai.com", "ผู้จัดการ", "สุขใจเพลส", "รอยืนยัน"],
  ];
  const collection = useDemoCollection(initialRows, onToast);
  return <><PageHeader eyebrow="การเข้าถึงระบบ" title="ผู้ใช้งาน" description="กำหนด Role และขอบเขตกิจการหรือหอพักที่เข้าถึงได้"><button disabled={isLocked} className="button primary" onClick={() => collection.addItem([`ผู้ใช้ Demo ${collection.items.length + 1}`, `demo${collection.items.length + 1}@example.com`, "พนักงาน", "สมชายแมนชั่น", "รอยืนยัน"])}><Plus size={17} /> เชิญผู้ใช้งาน</button></PageHeader><FilterBar placeholder="ค้นหาชื่อ อีเมล หรือ Role" filters={[{ label: "ทุกกิจการ", options: ["สมชายอพาร์ทเมนท์", "สุขใจเรสซิเดนซ์"] }, { label: "ทุก Role", options: ["Owner", "Manager", "Accounting", "Staff"] }, { label: "ทุกสถานะ", options: ["ใช้งานอยู่", "รอยืนยัน", "ระงับ"] }]} /><SimpleTable headers={["ผู้ใช้งาน", "อีเมล", "Role", "ขอบเขตข้อมูล", "สถานะ"]} rows={collection.items} onDelete={collection.removeItem} disableDelete={isLocked} /></>;
}

function RolesPage({ isLocked, onNavigate, onToast }: PageContentProps) {
  const collection = useDemoCollection(roles, onToast, 12);
  return <><PageHeader eyebrow="สิทธิ์และการเข้าถึง" title="Role" description="กลุ่มสิทธิ์สำหรับกำหนดหน้าที่และขอบเขตการทำงาน"><button disabled={isLocked} className="button primary" onClick={() => collection.addItem({ name: `Role Demo ${collection.items.length + 1}`, code: `demo_role_${collection.items.length + 1}`, scope: "หอที่ได้รับมอบหมาย", users: 0, permissions: 0, system: false })}><Plus size={17} /> เพิ่ม Role</button></PageHeader><section className="role-grid">{collection.items.map((item, index) => <article className="role-card" key={`${item.code}-${index}`}><div className="role-card-head"><span className="role-icon"><ShieldCheck size={20} /></span>{item.system ? <span className="badge neutral">Role ระบบ</span> : <button className="icon-button delete-button" type="button" disabled={isLocked} aria-label={`ลบ ${item.name}`} title="ลบ Role" onClick={() => collection.removeItem(index)}><Trash2 size={17} /></button>}</div><h3>{item.name}</h3><code>{item.code}</code><dl><div><dt>ขอบเขต</dt><dd>{item.scope}</dd></div><div><dt>ผู้ใช้งาน</dt><dd>{item.users} คน</dd></div><div><dt>สิทธิ์ที่เปิด</dt><dd>{item.permissions} รายการ</dd></div></dl><button onClick={() => onNavigate("permissions")} className="button secondary full">จัดการสิทธิ์</button></article>)}</section></>;
}

function PermissionsPage({ isLocked, onToast }: PageContentProps) {
  const [selectedRole, setSelectedRole] = useState("owner");
  return <><PageHeader eyebrow="สิทธิ์และการเข้าถึง" title="กำหนดสิทธิ์" description="เลือกสิทธิ์ของแต่ละ Role แยกตามเมนูและการกระทำ"><button disabled={isLocked} onClick={() => onToast("บันทึก Permission Matrix แล้ว")} className="button primary">บันทึกสิทธิ์</button></PageHeader><section className="permission-layout"><aside className="role-list panel"><p>เลือก Role</p>{roles.slice(1).map((item) => <button key={item.code} className={selectedRole === item.code ? "active" : ""} onClick={() => setSelectedRole(item.code)}><span><strong>{item.name}</strong><small>{item.scope}</small></span><ChevronRight size={16} /></button>)}</aside><div className="panel permission-panel"><div className="permission-head"><span><strong>{roles.find((item) => item.code === selectedRole)?.name}</strong><small>เลือกสิทธิ์ที่ต้องการให้ Role นี้ใช้งานได้</small></span><label className="check-label"><input type="checkbox" /> เลือกทั้งหมด</label></div><div className="permission-table"><table><thead><tr><th>เมนู</th>{permissionColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{permissionRows.map((row, rowIndex) => <tr key={row}><td><strong>{row}</strong></td>{permissionColumns.map((column, columnIndex) => <td key={column}><input disabled={isLocked} aria-label={`${row} ${column}`} type="checkbox" defaultChecked={(rowIndex + columnIndex) % 4 !== 3} /></td>)}</tr>)}</tbody></table></div></div></section></>;
}

function SubscriptionsPage({ role, lineEnabled, onLineChange, onToast }: PageContentProps) {
  const admin = role === "super_admin";
  return <><PageHeader eyebrow="แพ็กเกจและบริการ" title={admin ? "Subscription" : "แพ็กเกจของคุณ"} description={admin ? "จัดการรอบบริการและบริการเสริมของทุกกิจการ" : "ตรวจสอบแพ็กเกจ รอบบิล และบริการเสริม"}>{!admin ? <button onClick={() => onToast("เปิดหน้าชำระเงินตัวอย่างแล้ว")} className="button primary">ต่ออายุบริการ</button> : null}</PageHeader>{admin ? <><section className="metric-grid compact"><Metric label="รายได้เดือนนี้" value="฿42,870" delta="+12.4%" icon={CircleDollarSign} tone="green" /><Metric label="Active" value="21" delta="75%" icon={ShieldCheck} tone="blue" /><Metric label="Trial" value="5" delta="4 ใกล้หมด" icon={Gauge} tone="orange" /><Metric label="MRR" value="฿38,640" delta="บริการรายเดือน" icon={WalletCards} tone="violet" /></section><SimpleTable headers={["กิจการ", "แพ็กเกจ", "ค่าบริการ", "รอบถัดไป", "บริการเสริม", "สถานะ"]} rows={companies.map((company, index) => [company.name, company.plan, index % 2 ? "฿990/เดือน" : "฿1,590/เดือน", company.date, index % 2 ? "–" : "LINE", company.status === "active" ? "Active" : company.status === "trial" ? "Trial" : "หมดอายุ"])} /></> : <PlanCards lineEnabled={lineEnabled} onLineChange={onLineChange} onToast={onToast} />}</>;
}

function LinePage({ role, lineEnabled, onLineChange, onToast, isLocked }: PageContentProps) {
  const collection = useDemoCollection([["แจ้งบิลเดือนสิงหาคม", "ผู้เช่า 48 คน", "26 ส.ค. 2569 09:00", "ส่งแล้ว 46"], ["เตือนครบกำหนดชำระ", "ผู้เช่า 12 คน", "28 ส.ค. 2569 08:00", "กำหนดเวลา"], ["ติดตามยอดค้าง 7 วัน", "ผู้เช่า 7 คน", "25 ส.ค. 2569 10:30", "ส่งแล้ว 7"]], onToast);
  if (!lineEnabled && role !== "super_admin") return <section className="addon-locked-page"><span className="addon-logo"><MessageCircle size={28} /></span><span className="badge purple">บริการเสริม</span><h1>LINE แจ้งเตือน</h1><p>ส่งใบแจ้งหนี้ แจ้งเตือนก่อนครบกำหนด และติดตามยอดค้างผ่าน LINE Official Account</p><div className="addon-benefits"><span><ShieldCheck size={18} />ส่งบิลเป็นรายห้อง</span><span><Bell size={18} />ตั้งเวลาแจ้งเตือนอัตโนมัติ</span><span><ReceiptText size={18} />ติดตามผลการส่งย้อนหลัง</span></div><div className="addon-price"><strong>฿299</strong><span>/ เดือน / กิจการ</span></div><button className="button primary large" onClick={() => { onLineChange(true); onToast("เปิด LINE Add-on สำหรับ Demo แล้ว"); }}>เปิดใช้งาน LINE</button><small>ยกเลิกได้ทุกเมื่อ ข้อมูลเดิมยังอยู่ครบ</small></section>;
  return <><PageHeader eyebrow="บริการเสริม" title="LINE แจ้งเตือน" description={role === "super_admin" ? "จัดการสถานะบริการ LINE ของกิจการต่าง ๆ" : "ส่งและติดตามข้อความถึงผู้เช่าผ่าน LINE"}><button disabled={isLocked} className="button primary" onClick={() => collection.addItem([`ข้อความ Demo ${collection.items.length + 1}`, "ผู้เช่า 1 คน", "วันนี้", "ฉบับร่าง"])}><Plus size={17} /> สร้างข้อความ</button></PageHeader><div className="integration-banner"><span className="line-mark"><MessageCircle size={22} /></span><span><strong>LINE Official Account เชื่อมต่อแล้ว</strong><small>@somchaimansion · อัปเดตล่าสุด 2 นาทีที่แล้ว</small></span><span className="badge success">พร้อมใช้งาน</span></div><SimpleTable headers={["แคมเปญ", "ผู้รับ", "วันที่ส่ง", "ผลลัพธ์"]} rows={collection.items} onDelete={collection.removeItem} disableDelete={isLocked} /></>;
}

function RoomsPage({ isLocked, onToast, onNavigate, meterRooms, activeProperty, onAddRoom }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);

  const roomRows = meterRooms.map((room) => [
    room.number,
    room.tenant,
    room.tenant === "(ว่าง)" ? "ว่าง" : "มีผู้เช่า",
  ]);
  const visibleRoomNumbers = new Set(
    (filterRows(roomRows, searchTerm, [{ column: 2, value: occupancy }]) as string[][]).map((row) => row[0])
  );
  const visibleRooms = meterRooms.filter((room) => visibleRoomNumbers.has(room.number));

  return (
    <>
      <PageHeader
        eyebrow="จัดการหอพัก"
        title="ห้องพัก"
        description={`${activeProperty.name} · แสดงสถานะห้องพักทั้งหมด (${meterRooms.length} ห้อง)`}
      >
        <button
          disabled={isLocked}
          className="button primary"
          onClick={() => setShowAddRoom(true)}
        >
          <Plus size={17} /> เพิ่มห้อง
        </button>
      </PageHeader>

      <div className="meter-summary-bar">
        <span><strong>หอพัก</strong>{activeProperty.name}</span>
        <span><strong>ห้องทั้งหมด</strong>{meterRooms.length} ห้อง</span>
        <span><strong>มีผู้เช่า</strong>{meterRooms.filter(r => r.tenant && r.tenant !== "(ว่าง)").length} ห้อง</span>
        <span><strong>ว่าง</strong>{meterRooms.filter(r => !r.tenant || r.tenant === "(ว่าง)").length} ห้อง</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาเลขห้องหรือชื่อผู้เช่า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="มีผู้เช่า">มีผู้เช่า</option>
          <option value="ว่าง">ห้องว่าง</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ห้องพัก</th>
                  <th>ผู้เช่าปัจจุบัน</th>
                  <th>ค่าเช่าต่อเดือน</th>
                  <th>ระยะเวลาสัญญา</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleRooms.map((room) => {
                  const isVacant = !room.tenant || room.tenant === "(ว่าง)";
                  return (
                    <tr key={room.number}>
                      <td>
                        <span className="portal-lease-room-pill" style={{ margin: 0 }}>
                          {room.number}
                        </span>
                      </td>
                      <td>
                        <strong>{isVacant ? "— (ว่าง)" : room.tenant}</strong>
                      </td>
                      <td>฿{room.rent.toLocaleString()}/ด.</td>
                      <td>
                        <small>{isVacant ? "ไม่มีสัญญา" : `สัญญาถึง ${room.contractEnd || "—"}`}</small>
                      </td>
                      <td>
                        {isVacant ? (
                          <span className="badge info"><i />ห้องว่าง</span>
                        ) : (
                          <span className="badge success"><i />มีผู้เช่า</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="portal-table-actions-cell">
                          <button
                            className="portal-table-action-btn view"
                            onClick={() => onNavigate("contracts")}
                            title={isVacant ? "ทำสัญญาใหม่" : "ดูสัญญาเช่า"}
                            type="button"
                          >
                            <FileText size={13} />
                            <span>{isVacant ? "ทำสัญญา" : "ดูสัญญา"}</span>
                          </button>
                          <button
                            className="portal-table-action-btn edit"
                            onClick={() => onNavigate("meters")}
                            title="บันทึกมิเตอร์"
                            type="button"
                          >
                            <Zap size={13} />
                            <span>มิเตอร์</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="portal-room-grid">
          {visibleRooms.map((room) => {
            const isVacant = !room.tenant || room.tenant === "(ว่าง)";
            const status = isVacant ? "vacant" : "occupied";
            return (
              <article className="portal-room-card" data-status={status} key={room.number}>
                <header>
                  <div>
                    <span>ห้อง</span>
                    <strong>{room.number}</strong>
                  </div>
                  {isVacant ? (
                    <span className="badge info"><i />ห้องว่าง</span>
                  ) : (
                    <span className="badge success"><i />มีผู้เช่า</span>
                  )}
                </header>

                <dl>
                  <div>
                    <dt>ชั้น</dt>
                    <dd>{room.number.length >= 3 ? `ชั้น ${room.number[0]}` : "ชั้น 1"}</dd>
                  </div>
                  <div>
                    <dt>ค่าเช่าต่อเดือน</dt>
                    <dd>฿{room.rent.toLocaleString()}</dd>
                  </div>
                </dl>

                <div className="portal-room-tenant-strip">
                  {!isVacant ? (
                    <div>
                      <UserRound size={14} />
                      <span>
                        <strong>{room.tenant}</strong>
                        <small> · สัญญาถึง {room.contractEnd || "—"}</small>
                      </span>
                    </div>
                  ) : (
                    <span className="vacant-note">ห้องว่าง พร้อมทำสัญญาเช่า</span>
                  )}
                </div>

                <footer className="portal-room-card-footer">
                  <div className="portal-lease-card-actions-grid">
                    {isVacant ? (
                      <button
                        className="portal-lease-card-btn view"
                        onClick={() => onNavigate("contracts")}
                        title="ทำสัญญาเช่า"
                        type="button"
                      >
                        <FilePlus size={14} />
                        <span>ทำสัญญา</span>
                      </button>
                    ) : (
                      <button
                        className="portal-lease-card-btn view"
                        onClick={() => onNavigate("contracts")}
                        title="ดูสัญญาเช่า"
                        type="button"
                      >
                        <FileText size={14} />
                        <span>ดูสัญญา</span>
                      </button>
                    )}
                    <button
                      className="portal-lease-card-btn edit"
                      onClick={() => onNavigate("meters")}
                      title="บันทึกมิเตอร์"
                      type="button"
                    >
                      <Zap size={14} />
                      <span>มิเตอร์</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      {visibleRooms.length === 0 ? <EmptyState message="ไม่พบห้องพักที่ตรงกับการค้นหา" /> : null}
      {showAddRoom ? <AddRoomModal existingRooms={meterRooms} onClose={() => setShowAddRoom(false)} onSave={(room) => { onAddRoom(room); setShowAddRoom(false); }} onToast={onToast} /> : null}
    </>
  );
}


function AuditPage() {
  const rows = [["แก้ไข Permission", "พงศกร · Super Admin", "Role ฝ่ายบัญชี", "วันนี้ 15:10"], ["เปิด LINE Add-on", "พงศกร · Super Admin", "บริษัท สมชายอพาร์ทเมนท์", "วันนี้ 14:42"], ["เพิ่มผู้ใช้งาน", "สมชาย ใจดี", "account@somchai.com", "วันนี้ 11:18"], ["ต่อ Trial", "พงศกร · Super Admin", "สุขใจเรสซิเดนซ์ +7 วัน", "เมื่อวาน 16:05"]];
  return <><PageHeader eyebrow="ความปลอดภัย" title="Audit Log" description="ประวัติการเปลี่ยนแปลงข้อมูล สิทธิ์ และบริการสำคัญ" /><FilterBar placeholder="ค้นหาผู้กระทำหรือรายการ" /><SimpleTable headers={["การกระทำ", "ผู้ดำเนินการ", "รายละเอียด", "เวลา"]} rows={rows} /></>;
}


// ───────────────────────────────────────────────
// ผู้เช่า
// ───────────────────────────────────────────────
function TenantsPage({ isLocked, onToast, onNavigate }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const initialRows = [
    ["สมชาย ใจดี", "101", "1 ม.ค. 2568", "31 ธ.ค. 2568", "฿4,500", "อยู่ระหว่างเช่า"],
    ["อารยา พรดี", "102", "15 ก.พ. 2568", "14 ก.พ. 2569", "฿4,500", "อยู่ระหว่างเช่า"],
    ["ธนกร แสงงาม", "201", "1 มี.ค. 2568", "28 ก.พ. 2569", "฿5,000", "อยู่ระหว่างเช่า"],
    ["วริษา มั่นคง", "202", "1 เม.ย. 2567", "31 มี.ค. 2568", "฿4,500", "สัญญาหมด"],
    ["ปิยะ สุขสวัสดิ์", "301", "1 มิ.ย. 2568", "31 พ.ค. 2569", "฿5,500", "อยู่ระหว่างเช่า"],
    ["กมลา ดีงาม", "302", "10 ก.ค. 2568", "9 ก.ค. 2569", "฿5,000", "อยู่ระหว่างเช่า"],
    ["นันท์นภัส วารี", "401", "1 ส.ค. 2568", "31 ก.ค. 2569", "฿6,000", "อยู่ระหว่างเช่า"],
  ];
  const collection = useDemoCollection(initialRows, onToast);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const visibleRows = filterRows(collection.items, searchTerm, [{ column: 5, value: status }]) as string[][];

  return (
    <>
      <PageHeader eyebrow="จัดการหอพัก" title="ผู้เช่า" description="รายชื่อผู้เช่าทั้งหมดพร้อมข้อมูลสัญญาและสถานะ">
        <button disabled={isLocked} className="button primary" onClick={() => collection.addItem([`ผู้เช่าใหม่ ${collection.items.length + 1}`, `${collection.items.length + 5}01`, "วันนี้", "อีก 1 ปี", "฿4,500", "รอทำสัญญา"])}>
          <Plus size={17} /> เพิ่มผู้เช่า
        </button>
      </PageHeader>

      <div className="meter-summary-bar">
        <span><strong>ผู้เช่าทั้งหมด</strong>{collection.items.length} คน</span>
        <span><strong>อยู่ระหว่างเช่า</strong>{collection.items.filter(r => r[5] === "อยู่ระหว่างเช่า").length} คน</span>
        <span><strong>สัญญาหมด</strong>{collection.items.filter(r => r[5] === "สัญญาหมด").length} คน</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาชื่อผู้เช่า หรือเลขห้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="อยู่ระหว่างเช่า">อยู่ระหว่างเช่า</option>
          <option value="สัญญาหมด">สัญญาหมด</option>
          <option value="รอทำสัญญา">รอทำสัญญา</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ผู้เช่า</th>
                  <th>ห้อง</th>
                  <th>วันเข้าพัก</th>
                  <th>วันหมดสัญญา</th>
                  <th>ค่าเช่า/เดือน</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((item, idx) => (
                  <tr key={`${item[0]}-${idx}`}>
                    <td>
                      <span className="company-cell">
                        <i>{item[0].charAt(0)}</i>
                        <span>
                          <strong>{item[0]}</strong>
                          <small>081-{String(1000000 + idx * 111111).slice(-7)}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="portal-lease-room-pill" style={{ margin: 0 }}>
                        {item[1]}
                      </span>
                    </td>
                    <td>{item[2]}</td>
                    <td>{item[3]}</td>
                    <td><strong>{item[4]}</strong></td>
                    <td>
                      {item[5] === "อยู่ระหว่างเช่า" ? (
                        <span className="badge success"><i />{item[5]}</span>
                      ) : (
                        <span className="badge neutral"><i />{item[5]}</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="portal-table-actions-cell">
                        <button
                          className="portal-table-action-btn account"
                          onClick={() => onToast(`เปิดหน้าจัดการบัญชีสำหรับคุณ "${item[0]}" แล้ว`)}
                          title="จัดการบัญชีผู้เช่า"
                          type="button"
                        >
                          <UserRoundCheck size={13} />
                          <span>บัญชี</span>
                        </button>
                        <button
                          className="portal-table-action-btn view"
                          onClick={() => onNavigate("contracts")}
                          title="ดูสัญญาเช่า"
                          type="button"
                        >
                          <FileText size={13} />
                          <span>ดูสัญญา</span>
                        </button>
                        <button
                          className="portal-table-action-btn delete"
                          disabled={isLocked}
                          onClick={() => collection.removeItem(collection.items.indexOf(item))}
                          title="ลบข้อมูลผู้เช่า"
                          type="button"
                        >
                          <Trash2 size={13} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {visibleRows.map((item, idx) => {
            const isRenting = item[5] === "อยู่ระหว่างเช่า";
            return (
              <article className="portal-record-card" key={`${item[0]}-${idx}`}>
                <header>
                  <span className="portal-record-icon">
                    <UserRound aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{item[0]}</h2>
                    <small>ห้อง {item[1]} · บัตรประชาชน •••• {String(1000 + idx).slice(-4)}</small>
                  </div>
                  {isRenting ? (
                    <span className="badge success"><i />{item[5]}</span>
                  ) : (
                    <span className="badge neutral"><i />{item[5]}</span>
                  )}
                </header>

                <div className="portal-record-details">
                  <p>
                    <Phone aria-hidden="true" size={15} />
                    <span>081-{String(1000000 + idx * 111111).slice(-7)}</span>
                  </p>
                  <p>
                    <CalendarDays aria-hidden="true" size={15} />
                    <span>สัญญา: {item[2]} ถึง {item[3]}</span>
                  </p>
                  <p>
                    <WalletCards aria-hidden="true" size={15} />
                    <span>ค่าเช่า <strong>{item[4]}</strong> / เดือน</span>
                  </p>
                </div>

                <footer className="portal-lease-card-footer">
                  <div className="portal-lease-card-meta-row">
                    <span>
                      <UserRoundCheck size={13} style={{ display: "inline", marginRight: 4 }} />
                      บัญชี Tenant Portal: พร้อมใช้งาน
                    </span>
                  </div>
                  <div className="portal-lease-card-actions-grid">
                    <button
                      className="portal-lease-card-btn account"
                      onClick={() => onToast(`เปิดหน้าจัดการบัญชีสำหรับคุณ "${item[0]}" แล้ว`)}
                      title="จัดการบัญชีผู้เช่า"
                      type="button"
                    >
                      <UserRoundCheck size={15} />
                      <span>จัดการบัญชี</span>
                    </button>
                    <button
                      className="portal-lease-card-btn view"
                      onClick={() => onNavigate("contracts")}
                      title="ดูสัญญาเช่า"
                      type="button"
                    >
                      <FileText size={15} />
                      <span>ดูสัญญา</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────
// สัญญาเช่า
// ───────────────────────────────────────────────
function ContractsPage({ isLocked, contracts, onViewContract, onEditContract, onDeleteContract }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.roomNumber.includes(searchTerm) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeader
        eyebrow="จัดการหอพัก"
        title="สัญญาเช่า"
        description="สร้างและแก้ไขสัญญาเช่ามาตรฐานทางการ ดูตัวอย่างเอกสาร พร้อมพิมพ์และส่งออกเป็น PDF"
      >
        <button
          disabled={isLocked}
          className="button primary"
          onClick={() => {
            const nextNo = `สญ.-2569-${String(contracts.length + 1).padStart(3, "0")}`;
            onEditContract({
              id: nextNo,
              roomNumber: "101",
              tenantName: "",
              tenantIdCard: "",
              tenantPhone: "",
              startDate: "1 มี.ค. 2568",
              endDate: "28 ก.พ. 2569",
              rent: 4500,
              deposit: 9000,
              advanceRent: 4500,
              customClauses: "ห้ามสูบบุหรี่และห้ามเลี้ยงสัตว์ภายในห้องพัก",
              status: "active",
            });
          }}
        >
          <Plus size={17} /> ทำสัญญาใหม่
        </button>
      </PageHeader>

      <div className="meter-summary-bar">
        <span><strong>สัญญาทั้งหมด</strong>{contracts.length} ฉบับ</span>
        <span><strong>มีผลอยู่ (Active)</strong>{contracts.filter(c => c.status === "active").length} ฉบับ</span>
        <span><strong>ค่าเช่ารวม</strong>฿{contracts.reduce((s, c) => s + (c.status === "active" ? c.rent : 0), 0).toLocaleString()}/เดือน</span>
        <span><strong>เงินประกันรวม</strong>฿{contracts.reduce((s, c) => s + (c.status === "active" ? c.deposit : 0), 0).toLocaleString()}</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาเลขที่สัญญา, ชื่อผู้เช่า หรือเลขห้อง..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          <option value="active">มีผลอยู่</option>
          <option value="draft">ร่างสัญญา</option>
          <option value="expired">หมดอายุ</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>เลขที่สัญญา</th>
                  <th>ห้อง / ผู้เช่า</th>
                  <th>ระยะเวลาสัญญา</th>
                  <th>ค่าเช่า / ประกัน</th>
                  <th>ข้อตกลงพิเศษ</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right", paddingRight: 16 }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                      ไม่พบรายการสัญญาที่ตรงกับการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td><strong>{contract.id}</strong></td>
                      <td>
                        <span className="company-cell">
                          <i>{contract.roomNumber}</i>
                          <span>
                            <strong>{contract.tenantName || "—"}</strong>
                            <small>โทร. {contract.tenantPhone || "—"}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{contract.startDate}</strong>
                          <small style={{ display: "block", color: "var(--muted)" }}>ถึง {contract.endDate}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>฿{contract.rent.toLocaleString()}</strong>/ด.
                          <small style={{ display: "block", color: "var(--muted)" }}>ประกัน ฿{contract.deposit.toLocaleString()}</small>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contract.customClauses || "—"}
                      </td>
                      <td>
                        {contract.status === "active" ? (
                          <span className="badge success"><i />มีผลอยู่</span>
                        ) : contract.status === "draft" ? (
                          <span className="badge info"><i />ร่าง</span>
                        ) : (
                          <span className="badge neutral"><i />หมดอายุ</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="portal-table-actions-cell">
                          <button
                            className="portal-table-action-btn view"
                            onClick={() => onViewContract(contract)}
                            title="ดูสัญญาทางการ"
                            type="button"
                          >
                            <FileText size={13} />
                            <span>ดูสัญญา</span>
                          </button>
                          <button
                            className="portal-table-action-btn print"
                            onClick={() => {
                              onViewContract(contract);
                              setTimeout(() => window.print(), 150);
                            }}
                            title="พิมพ์สัญญา A4"
                            type="button"
                          >
                            <Printer size={13} />
                            <span>พิมพ์ A4</span>
                          </button>
                          <button
                            className="portal-table-action-btn edit"
                            disabled={isLocked}
                            onClick={() => onEditContract(contract)}
                            title="แก้ไขข้อมูลสัญญา"
                            type="button"
                          >
                            <Pencil size={13} />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            className="portal-table-action-btn delete"
                            disabled={isLocked}
                            onClick={() => onDeleteContract(contract.id)}
                            title="ลบสัญญา"
                            type="button"
                          >
                            <Trash2 size={13} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {filteredContracts.map((contract) => (
            <article className="portal-lease-card" key={contract.id}>
              <header className="portal-lease-card-header">
                <div>
                  <span className="portal-lease-room-pill">{contract.roomNumber}</span>
                  <div className="portal-lease-card-title">
                    <strong>{contract.id}</strong>
                    <small>ห้อง {contract.roomNumber}</small>
                  </div>
                </div>
                {contract.status === "active" ? (
                  <span className="badge success"><i />มีผลอยู่</span>
                ) : contract.status === "draft" ? (
                  <span className="badge info"><i />ร่าง</span>
                ) : (
                  <span className="badge neutral"><i />หมดอายุ</span>
                )}
              </header>

              <div className="portal-lease-card-tenant">
                <div className="portal-lease-card-tenant-info">
                  <strong>{contract.tenantName || "—"}</strong>
                  <small>โทร. {contract.tenantPhone || "—"}</small>
                </div>
              </div>

              <dl className="portal-lease-card-metrics">
                <div>
                  <dt>ค่าเช่าต่อเดือน</dt>
                  <dd>฿{contract.rent.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>เงินประกัน</dt>
                  <dd>฿{contract.deposit.toLocaleString()}</dd>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <dt>ระยะเวลาสัญญา</dt>
                  <dd>{contract.startDate} ถึง {contract.endDate}</dd>
                </div>
              </dl>

              <footer className="portal-lease-card-footer">
                <div className="portal-lease-card-meta-row">
                  <span>ข้อตกลง: {contract.customClauses || "ตามระเบียบอาคาร"}</span>
                </div>
                <div className="portal-lease-card-actions-grid">
                  <button
                    className="portal-lease-card-btn view"
                    onClick={() => onViewContract(contract)}
                    title="ดูสัญญาเช่า"
                    type="button"
                  >
                    <FileText size={15} />
                    <span>ดูสัญญา</span>
                  </button>
                  <button
                    className="portal-lease-card-btn print"
                    onClick={() => {
                      onViewContract(contract);
                      setTimeout(() => window.print(), 150);
                    }}
                    title="พิมพ์สัญญา A4"
                    type="button"
                  >
                    <Printer size={15} />
                    <span>พิมพ์ A4</span>
                  </button>
                  <button
                    className="portal-lease-card-btn edit"
                    disabled={isLocked}
                    onClick={() => onEditContract(contract)}
                    title="แก้ไขสัญญา"
                    type="button"
                  >
                    <Pencil size={15} />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    className="portal-lease-card-btn delete"
                    disabled={isLocked}
                    onClick={() => onDeleteContract(contract.id)}
                    title="ลบสัญญา"
                    type="button"
                  >
                    <Trash2 size={15} />
                    <span>ลบ</span>
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
function MetersPage({ isLocked, onToast, onNavigate, meterRooms, onMeterChange, appSettings }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("all");

  const billableRooms = meterRooms.filter((room) => room.tenant && room.tenant !== "(ว่าง)");
  const filteredRooms = billableRooms.filter((r) => {
    const matchesSearch = r.number.includes(searchTerm) || r.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    const isDone = r.newElec !== null && r.newElec >= r.prevElec;
    const matchesFilter = filterState === "all" || (filterState === "done" ? isDone : !isDone);
    return matchesSearch && matchesFilter;
  });

  const doneCount = billableRooms.filter(r => r.newElec !== null && r.newElec >= r.prevElec).length;
  const allDone = doneCount === billableRooms.length;
  const totalElec = billableRooms.reduce((s, r) => {
    if (r.newElec === null) return s;
    const u = r.newElec - r.prevElec;
    return s + (u >= 0 ? u * appSettings.electricRate : 0);
  }, 0);

  return (
    <>
      <PageHeader eyebrow="การเงิน" title="บันทึกมิเตอร์" description={`รอบบิล สิงหาคม 2569 · กรอกเลขมิเตอร์ใหม่แล้วระบบคำนวณให้อัตโนมัติ`}>
        <button className="button secondary" disabled={isLocked} onClick={() => {
          downloadCsv("meter-august-2569.csv", ["ห้อง", "ผู้เช่า", "มิเตอร์เก่า", "มิเตอร์ใหม่"], meterRooms.map((room) => [room.number, room.tenant, room.prevElec, room.newElec ?? ""]));
          onToast("ดาวน์โหลดข้อมูลมิเตอร์แล้ว");
        }}><Download size={16} /> Export</button>
        <button
          className="button primary"
          disabled={isLocked || !allDone}
          title={!allDone ? `กรอกมิเตอร์ให้ครบทุกห้องที่มีผู้เช่าก่อน (เหลือ ${billableRooms.length - doneCount} ห้อง)` : ""}
          onClick={() => { onNavigate("invoices"); onToast("สร้างใบแจ้งหนี้ทุกห้องแล้ว"); }}
        >
          <FileText size={17} /> สร้างบิลทุกห้อง
        </button>
      </PageHeader>
      <div className="meter-summary-bar">
        <span><strong>รอบบิล</strong>สิงหาคม 2569</span>
        <span><strong>บันทึกแล้ว</strong>{doneCount}/{billableRooms.length} ห้องที่มีผู้เช่า</span>
        <span><strong>ค่าไฟรวม</strong>฿{totalElec.toFixed(2)}</span>
        <span><strong>ค่าน้ำรวม</strong>฿{(billableRooms.length * appSettings.waterRate).toFixed(2)}</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาห้องหรือชื่อผู้เช่า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)}>
          <option value="all">ทุกสถานะการจด</option>
          <option value="done">บันทึกแล้ว</option>
          <option value="pending">รอบันทึก</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ห้อง / ผู้เช่า</th>
                  <th>มิเตอร์เก่า</th>
                  <th>มิเตอร์ใหม่</th>
                  <th>หน่วยใช้</th>
                  <th>ค่าไฟ ({appSettings.electricRate} ฿/หน่วย)</th>
                  <th>ค่าน้ำ</th>
                  <th>รวมสาธารณูปโภค</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(room => {
                  const units = room.newElec !== null ? room.newElec - room.prevElec : null;
                  const valid = units === null || units >= 0;
                  const elecCost = (valid && units !== null) ? units * appSettings.electricRate : null;
                  const total = elecCost !== null ? elecCost + appSettings.waterRate : null;
                  return (
                    <tr key={room.number} style={room.newElec !== null && valid ? { background: "#f6fef9" } : {}}>
                      <td>
                        <span className="company-cell">
                          <i>{room.number}</i>
                          <span><strong>{room.tenant}</strong><small>ค่าเช่า ฿{room.rent.toLocaleString()}/เดือน</small></span>
                        </span>
                      </td>
                      <td>{room.prevElec.toLocaleString()}</td>
                      <td>
                        <input
                          className={`meter-input${!valid ? " meter-input-error" : room.newElec !== null ? " meter-input-done" : ""}`}
                          type="number"
                          min={room.prevElec}
                          placeholder="กรอกเลข"
                          value={room.newElec ?? ""}
                          disabled={isLocked}
                          onChange={e => onMeterChange(room.number, e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </td>
                      <td>
                        {units !== null
                          ? (valid ? <strong>{units} หน่วย</strong> : <span style={{ color: "var(--red)", fontWeight: 600 }}>❌ ติดลบ</span>)
                          : <span style={{ color: "var(--subtle)" }}>—</span>}
                      </td>
                      <td>{elecCost !== null ? <strong>฿{elecCost.toFixed(2)}</strong> : <span style={{ color: "var(--subtle)" }}>—</span>}</td>
                      <td>฿{appSettings.waterRate.toFixed(2)}</td>
                      <td>{total !== null ? <strong style={{ color: "var(--primary)" }}>฿{total.toFixed(2)}</strong> : <span style={{ color: "var(--subtle)" }}>—</span>}</td>
                      <td>
                        {room.newElec !== null && valid
                          ? <span className="badge success"><i />บันทึกแล้ว</span>
                          : <span className="badge neutral"><i />รอบันทึก</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {filteredRooms.map((room) => {
            const units = room.newElec !== null ? room.newElec - room.prevElec : null;
            const valid = units === null || units >= 0;
            const elecCost = (valid && units !== null) ? units * appSettings.electricRate : null;
            const total = elecCost !== null ? elecCost + appSettings.waterRate : null;

            return (
              <article className="portal-record-card meter-card" key={room.number}>
                <header>
                  <span className="portal-record-icon electric">
                    <Zap aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>ห้อง {room.number}</h2>
                    <small>ผู้เช่า: {room.tenant}</small>
                  </div>
                  {room.newElec !== null && valid ? (
                    <span className="badge success"><i />บันทึกแล้ว</span>
                  ) : (
                    <span className="badge neutral"><i />รอบันทึก</span>
                  )}
                </header>

                <div className="portal-meter-reading">
                  <div>
                    <small>ครั้งก่อน</small>
                    <strong>{room.prevElec.toLocaleString()}</strong>
                  </div>
                  <span>
                    <Gauge aria-hidden="true" size={17} />
                    {units !== null && valid ? `${units} หน่วย` : "รอจด"}
                  </span>
                  <div>
                    <small>ครั้งนี้</small>
                    <input
                      style={{
                        width: 90,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                      type="number"
                      min={room.prevElec}
                      placeholder="กรอกเลข"
                      value={room.newElec ?? ""}
                      disabled={isLocked}
                      onChange={(e) => onMeterChange(room.number, e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                </div>

                <footer className="portal-lease-card-footer">
                  <div className="portal-lease-card-meta-row">
                    <span>
                      ค่าไฟ: <strong>{elecCost !== null ? `฿${elecCost.toFixed(2)}` : "—"}</strong> · ค่าน้ำ: <strong>฿{appSettings.waterRate.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="portal-lease-card-actions-grid">
                    <button
                      className="portal-lease-card-btn view"
                      onClick={() => onNavigate("invoices")}
                      title="ดูใบแจ้งหนี้"
                      type="button"
                    >
                      <FileText size={15} />
                      <span>ดูบิลห้องนี้</span>
                    </button>
                    <button
                      className="portal-lease-card-btn edit"
                      onClick={() => onToast(`บันทึกมิเตอร์ห้อง ${room.number} เรียบร้อยแล้ว`)}
                      title="ยืนยันค่ามิเตอร์"
                      type="button"
                    >
                      <ShieldCheck size={15} />
                      <span>ยืนยันตัวเลข</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────
// ใบแจ้งหนี้ — สร้างจากข้อมูลมิเตอร์จริง
// ───────────────────────────────────────────────
function InvoicesPage({ isLocked, onToast, onNavigate, onLineChange, meterRooms, appSettings, onViewInvoice }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const billableRooms = meterRooms.filter((room) => room.tenant && room.tenant !== "(ว่าง)");
  const done = billableRooms.filter((room) => calculateInvoice(room, appSettings) !== null);
  const pending = billableRooms.filter((room) => calculateInvoice(room, appSettings) === null);
  const totalBilled = done.reduce((sum, room) => sum + calculateInvoice(room, appSettings)!.total, 0);

  const filteredRooms = billableRooms.filter((r) => {
    const matchesSearch = r.number.includes(searchTerm) || r.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    const invoice = calculateInvoice(r, appSettings);
    const hasMeter = invoice !== null;
    const matchesStatus = statusFilter === "all" || (statusFilter === "ready" ? hasMeter : !hasMeter);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeader eyebrow="การเงิน" title="ใบแจ้งหนี้" description="ออกบิล ดูรายละเอียด และส่งให้ผู้เช่า · รอบสิงหาคม 2569">
        <button disabled={isLocked || done.length === 0} className="button secondary" onClick={() => {
          downloadCsv("invoices-august-2569.csv", ["ห้อง", "ผู้เช่า", "ค่าเช่า", "ค่าไฟ", "ค่าน้ำ", "รวม"], done.map((room) => {
            const invoice = calculateInvoice(room, appSettings)!;
            return [room.number, room.tenant, room.rent, invoice.electricCost, invoice.waterCost, invoice.total];
          }));
          onToast("ดาวน์โหลดรายการใบแจ้งหนี้แล้ว");
        }}><Download size={16} /> Export</button>
        <button disabled={isLocked || done.length === 0} className="button primary" onClick={() => { onLineChange(true); onNavigate("line"); onToast("สร้างแคมเปญส่งบิลผ่าน LINE แล้ว"); }}>
          <MessageCircle size={17} /> ส่งผ่าน LINE
        </button>
      </PageHeader>

      {pending.length > 0 && (
        <div className="trial-banner" style={{ marginBottom: 14 }}>
          <span><Gauge size={18} /><strong>ยังไม่บันทึกมิเตอร์ {pending.length} ห้อง</strong><small>บันทึกมิเตอร์ก่อนเพื่อสร้างบิลพร้อมค่าไฟ/น้ำ</small></span>
          <button onClick={() => onNavigate("meters")}>ไปบันทึกมิเตอร์ <ChevronRight size={16} /></button>
        </div>
      )}

      <div className="meter-summary-bar">
        <span><strong>รอบบิล</strong>สิงหาคม 2569</span>
        <span><strong>มีข้อมูลมิเตอร์</strong>{done.length} ห้อง</span>
        <span><strong>รอมิเตอร์</strong>{pending.length} ห้อง</span>
        <span><strong>ยอดรวม</strong>฿{totalBilled.toFixed(2)}</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาเลขห้องหรือชื่อผู้เช่า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">ทุกสถานะบิล</option>
          <option value="ready">พร้อมออกบิล</option>
          <option value="pending">รอมิเตอร์</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>เลขที่บิล</th><th>ห้อง / ผู้เช่า</th><th>ค่าเช่า</th><th>ค่าไฟ</th><th>ค่าน้ำ</th>
                  <th>รวม</th><th>กำหนดชำระ</th><th>สถานะ</th><th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, idx) => {
                  const invoice = calculateInvoice(room, appSettings);
                  const hasMeter = invoice !== null;
                  const elecCost = invoice?.electricCost ?? null;
                  const total = invoice?.total ?? null;
                  return (
                    <tr key={room.number}>
                      <td><strong>{hasMeter ? `INV-2569-09${String(idx + 1).padStart(2, "0")}` : "—"}</strong></td>
                      <td>
                        <span className="company-cell">
                          <i>{room.number}</i>
                          <span><strong>{room.tenant}</strong></span>
                        </span>
                      </td>
                      <td>฿{room.rent.toLocaleString()}</td>
                      <td>{elecCost !== null ? `฿${elecCost.toFixed(2)}` : <span style={{ color: "var(--subtle)" }}>—</span>}</td>
                      <td>฿{appSettings.waterRate.toFixed(2)}</td>
                      <td>{total !== null ? <strong>฿{total.toFixed(2)}</strong> : <span style={{ color: "var(--subtle)" }}>—</span>}</td>
                      <td>{hasMeter ? "5 ก.ย. 2569" : <span style={{ color: "var(--subtle)" }}>—</span>}</td>
                      <td>
                        {hasMeter
                          ? <span className="badge info"><i />รอชำระ</span>
                          : <span className="badge neutral"><i />รอมิเตอร์</span>}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="portal-table-actions-cell">
                          <button
                            className="portal-table-action-btn view"
                            disabled={!hasMeter}
                            onClick={() => hasMeter && onViewInvoice(room)}
                            title="ดูใบแจ้งหนี้"
                            type="button"
                          >
                            <FileText size={13} />
                            <span>ดูบิล</span>
                          </button>
                          <button
                            className="portal-table-action-btn print"
                            disabled={!hasMeter}
                            onClick={() => {
                              if (hasMeter) {
                                onViewInvoice(room);
                                setTimeout(() => window.print(), 150);
                              }
                            }}
                            title="พิมพ์บิล A4"
                            type="button"
                          >
                            <Printer size={13} />
                            <span>พิมพ์ A4</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {filteredRooms.map((room, idx) => {
            const invoice = calculateInvoice(room, appSettings);
            const hasMeter = invoice !== null;
            const elecCost = invoice?.electricCost ?? 0;
            const total = invoice?.total ?? room.rent;
            const invNumber = `INV-2569-09${String(idx + 1).padStart(2, "0")}`;

            return (
              <article className="portal-record-card invoice-card" key={room.number}>
                <header>
                  <span className="portal-record-icon">
                    <ReceiptText aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{hasMeter ? invNumber : `ห้อง ${room.number}`}</h2>
                    <small>ห้อง {room.number} · ผู้เช่า: {room.tenant}</small>
                  </div>
                  {hasMeter ? (
                    <span className="badge info"><i />รอชำระ</span>
                  ) : (
                    <span className="badge neutral"><i />รอมิเตอร์</span>
                  )}
                </header>

                <div className="portal-invoice-balance">
                  <div>
                    <small>ยอดรวม</small>
                    <strong>฿{total.toFixed(2)}</strong>
                  </div>
                  <div className="outstanding">
                    <small>คงเหลือ</small>
                    <strong>฿{total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="portal-room-tenant-strip" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: "12px", color: "#334155" }}>
                    ค่าเช่า ฿{room.rent.toLocaleString()} · ไฟ ฿{elecCost.toFixed(2)} · น้ำ ฿{appSettings.waterRate.toFixed(2)}
                  </span>
                </div>

                <footer className="portal-lease-card-footer">
                  <div className="portal-lease-card-meta-row">
                    <span>
                      <CalendarClock size={13} style={{ display: "inline", marginRight: 4 }} />
                      ครบกำหนด: 5 ก.ย. 2569
                    </span>
                  </div>
                  <div className="portal-lease-card-actions-grid">
                    <button
                      className="portal-lease-card-btn view"
                      disabled={!hasMeter}
                      onClick={() => hasMeter && onViewInvoice(room)}
                      title="ดูใบแจ้งหนี้"
                      type="button"
                    >
                      <FileText size={15} />
                      <span>ดูใบแจ้งหนี้</span>
                    </button>
                    <button
                      className="portal-lease-card-btn print"
                      disabled={!hasMeter}
                      onClick={() => {
                        if (hasMeter) {
                          onViewInvoice(room);
                          setTimeout(() => window.print(), 150);
                        }
                      }}
                      title="พิมพ์บิล A4"
                      type="button"
                    >
                      <Printer size={15} />
                      <span>พิมพ์บิล A4</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────
// รับชำระ
// ───────────────────────────────────────────────
function PaymentsPage({ isLocked, onToast }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const initialRows = [
    ["27 ส.ค. 2569", "201 · ธนกร แสงงาม", "INV-2569-0803", "฿5,315.50", "โอนเงิน", "RCP-001"],
    ["26 ส.ค. 2569", "101 · สมชาย ใจดี", "INV-2569-0707", "฿4,788", "เงินสด", "RCP-002"],
    ["25 ส.ค. 2569", "102 · อารยา พรดี", "INV-2569-0708", "฿4,763.50", "พร้อมเพย์", "RCP-003"],
    ["10 ก.ค. 2569", "301 · ปิยะ สุขสวัสดิ์", "INV-2569-0604", "฿5,500", "โอนเงิน", "RCP-004"],
  ];
  const collection = useDemoCollection(initialRows, onToast);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentChannel, setPaymentChannel] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const visibleRows = filterRows(collection.items, searchTerm, [{ column: 4, value: paymentChannel }]) as string[][];

  return (
    <>
      <PageHeader eyebrow="การเงิน" title="รับชำระ" description="บันทึกการรับเงินและออกใบเสร็จให้ผู้เช่า">
        <button disabled={isLocked} className="button secondary" onClick={() => {
          downloadCsv("payments-august-2569.csv", ["วันที่รับ", "ห้อง / ผู้เช่า", "เลขที่บิล", "ยอด", "ช่องทาง", "เลขที่ใบเสร็จ"], collection.items);
          onToast("ดาวน์โหลดรายการรับชำระแล้ว");
        }}>
          <Download size={16} /> Export
        </button>
        <button disabled={isLocked} className="button primary" onClick={() => setShowPaymentForm(true)}>
          <Plus size={17} /> บันทึกรับชำระ
        </button>
      </PageHeader>

      <div className="meter-summary-bar">
        <span><strong>เดือนนี้</strong> ยอดรับ ฿10,079</span>
        <span><strong>เดือนก่อน</strong> ฿185,400</span>
        <span><strong>รายการทั้งหมด</strong> {collection.items.length} รายการ</span>
      </div>

      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            placeholder="ค้นหาห้อง ชื่อผู้เช่า หรือเลขที่บิล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <select value={paymentChannel} onChange={(e) => setPaymentChannel(e.target.value)}>
          <option value="">ช่องทางทั้งหมด</option>
          <option value="เงินสด">เงินสด</option>
          <option value="โอนเงิน">โอนเงิน</option>
          <option value="พร้อมเพย์">พร้อมเพย์</option>
        </select>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>วันที่รับ</th>
                  <th>ห้อง / ผู้เช่า</th>
                  <th>เลขที่บิล</th>
                  <th>ยอด</th>
                  <th>ช่องทาง</th>
                  <th>เลขที่ใบเสร็จ</th>
                  <th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((item) => (
                  <tr key={item[5]}>
                    <td><strong>{item[0]}</strong></td>
                    <td>{item[1]}</td>
                    <td>{item[2]}</td>
                    <td><strong style={{ color: "#16a34a" }}>{item[3]}</strong></td>
                    <td><span className="badge success"><i />{item[4]}</span></td>
                    <td><code>{item[5]}</code></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="portal-table-actions-cell">
                        <button
                          className="portal-table-action-btn view"
                          onClick={() => onToast(`แสดงใบเสร็จรับเงิน ${item[5]}`)}
                          title="ดูใบเสร็จ"
                          type="button"
                        >
                          <FileText size={13} />
                          <span>ดูใบเสร็จ</span>
                        </button>
                        <button
                          className="portal-table-action-btn print"
                          onClick={() => {
                            onToast(`สั่งพิมพ์ใบเสร็จ ${item[5]}`);
                            setTimeout(() => window.print(), 150);
                          }}
                          title="พิมพ์ใบเสร็จ A4"
                          type="button"
                        >
                          <Printer size={13} />
                          <span>พิมพ์ A4</span>
                        </button>
                        <button
                          className="portal-table-action-btn delete"
                          disabled={isLocked}
                          onClick={() => collection.removeItem(collection.items.indexOf(item))}
                          title="ลบรายการรับชำระ"
                          type="button"
                        >
                          <Trash2 size={13} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {visibleRows.map((item, idx) => (
            <article className="portal-record-card" key={`${item[5]}-${idx}`}>
              <header>
                <span className="portal-record-icon success">
                  <Banknote aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2>{item[5]}</h2>
                  <small>{item[1]}</small>
                </div>
                <span className="badge success"><i />ชำระแล้ว</span>
              </header>

              <div className="portal-payment-amount">
                <small>ยอดรับชำระ</small>
                <strong>{item[3]}</strong>
              </div>

              <dl className="portal-record-metrics">
                <div>
                  <dt>ช่องทาง</dt>
                  <dd><CreditCard size={14} /> {item[4]}</dd>
                </div>
                <div>
                  <dt>เลขที่บิล</dt>
                  <dd>{item[2]}</dd>
                </div>
              </dl>

              <footer className="portal-lease-card-footer">
                <div className="portal-lease-card-meta-row">
                  <span>
                    <CalendarCheck size={14} style={{ display: "inline", marginRight: 4 }} />
                    รับชำระเมื่อ {item[0]}
                  </span>
                </div>
                <div className="portal-lease-card-actions-grid">
                  <button
                    className="portal-lease-card-btn view"
                    onClick={() => onToast(`แสดงใบเสร็จรับเงิน ${item[5]}`)}
                    title="ดูใบเสร็จ"
                    type="button"
                  >
                    <FileText size={15} />
                    <span>ดูใบเสร็จ</span>
                  </button>
                  <button
                    className="portal-lease-card-btn print"
                    onClick={() => {
                      onToast(`พิมพ์ใบเสร็จรับเงิน ${item[5]}`);
                      window.print();
                    }}
                    title="พิมพ์ใบเสร็จ A4"
                    type="button"
                  >
                    <Printer size={15} />
                    <span>พิมพ์ใบเสร็จ</span>
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </section>
      )}

      {showPaymentForm ? <PaymentModal receiptNumber={`RCP-${String(collection.items.length + 100).padStart(3, "0")}`} onClose={() => setShowPaymentForm(false)} onSave={(row) => {
        if (!collection.addItem(row)) return;
        setShowPaymentForm(false);
        onToast("บันทึกรับชำระและออกเลขที่ใบเสร็จแล้ว");
      }} /> : null}
    </>
  );
}

// ───────────────────────────────────────────────
// ยอดค้าง
// ───────────────────────────────────────────────
function ReceivablesPage({ isLocked, onToast }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const initialRows = [
    ["101 · สมชาย ใจดี", "INV-2569-0801", "฿4,788", "22 วัน", "เตือนแล้ว 1 ครั้ง"],
    ["102 · อารยา พรดี", "INV-2569-0802", "฿4,763.50", "22 วัน", "ยังไม่เตือน"],
    ["302 · กมลา ดีงาม", "INV-2569-0602", "฿5,000", "57 วัน", "เตือนแล้ว 3 ครั้ง"],
  ];
  const [rows, setRows] = useState(initialRows);

  return (
    <>
      <PageHeader eyebrow="การเงิน" title="ยอดค้างชำระ" description="ติดตามและเร่งรัดยอดค้างแยกตามอายุหนี้">
        <button disabled={isLocked} className="button primary" onClick={() => {
          setRows((current) => current.map((row) => [...row.slice(0, 4), row[4].startsWith("เตือนแล้ว") ? row[4] : "เตือนแล้ว 1 ครั้ง"]));
          onToast("อัปเดตสถานะการแจ้งเตือนยอดค้างแล้ว");
        }}>
          <Bell size={17} /> แจ้งเตือนทั้งหมด
        </button>
      </PageHeader>

      <section className="receivable-summary">
        <div className="receivable-card orange">
          <strong>฿9,551.50</strong>
          <span>ค้างชำระรวม</span>
          <small>3 ห้อง</small>
        </div>
        <div className="receivable-card blue">
          <strong>2 ห้อง</strong>
          <span>ค้าง 1–30 วัน</span>
          <small>฿9,551.50</small>
        </div>
        <div className="receivable-card red">
          <strong>1 ห้อง</strong>
          <span>ค้างเกิน 30 วัน</span>
          <small>฿5,000</small>
        </div>
      </section>

      <div className="filter-bar">
        <div style={{ flex: 1 }}>
          <small style={{ color: "#64748b", fontWeight: 600 }}>พบ 3 รายการยอดค้างชำระ</small>
        </div>
        <div className="portal-view-toggle">
          <button
            aria-label="มุมมองตาราง"
            className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} />
            <span>ตาราง</span>
          </button>
          <button
            aria-label="มุมมองการ์ด"
            className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <LayoutGrid size={15} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ห้อง / ผู้เช่า</th>
                  <th>เลขที่บิล</th>
                  <th>ยอดค้าง</th>
                  <th>ค้างมา</th>
                  <th>การติดตาม</th>
                  <th style={{ textAlign: "right" }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[1]}>
                    <td><strong>{row[0]}</strong></td>
                    <td><code>{row[1]}</code></td>
                    <td><strong style={{ color: "#e11d48" }}>{row[2]}</strong></td>
                    <td><span className="badge danger"><i />{row[3]}</span></td>
                    <td>{row[4]}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="portal-table-actions-cell">
                        <button
                          className="portal-table-action-btn account"
                          onClick={() => onToast(`ส่งข้อความแจ้งเตือนไปยัง ${row[0]} แล้ว`)}
                          title="แจ้งเตือนผู้เช่า"
                          type="button"
                        >
                          <MessageCircle size={13} />
                          <span>แจ้งเตือน</span>
                        </button>
                        <button
                          className="portal-table-action-btn view"
                          onClick={() => onToast(`เปิดหน้าบันทึกรับชำระสำหรับบิล ${row[1]}`)}
                          title="รับชำระยอดนี้"
                          type="button"
                        >
                          <CreditCard size={13} />
                          <span>รับชำระ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="portal-collection-grid">
          {rows.map((row, idx) => (
            <article className="portal-record-card" key={row[1]}>
              <header>
                <span className="portal-record-icon" style={{ background: "#fee2e2", color: "#e11d48" }}>
                  <ReceiptText aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2>{row[1]}</h2>
                  <small>{row[0]}</small>
                </div>
                <span className="badge danger"><i />เกินกำหนด</span>
              </header>

              <div className="portal-invoice-balance">
                <div>
                  <small>ยอดเรียกเก็บ</small>
                  <strong>{row[2]}</strong>
                </div>
                <div className="outstanding">
                  <small>ยอดค้างชำระ</small>
                  <strong>{row[2]}</strong>
                </div>
              </div>

              <dl className="portal-record-metrics" style={{ marginTop: 10 }}>
                <div>
                  <dt>ค้างชำระมาแล้ว</dt>
                  <dd style={{ color: "#e11d48", fontWeight: 700 }}>{row[3]}</dd>
                </div>
                <div>
                  <dt>สถานะการติดตาม</dt>
                  <dd>{row[4]}</dd>
                </div>
              </dl>

              <footer className="portal-lease-card-footer">
                <div className="portal-lease-card-actions-grid">
                  <button
                    className="portal-lease-card-btn view"
                    onClick={() => onToast(`ส่งข้อความทวงถามสำหรับ ${row[0]}`)}
                    title="ส่งข้อความทวงถาม"
                    type="button"
                  >
                    <MessageCircle size={15} />
                    <span>แจ้งเตือนผู้เช่า</span>
                  </button>
                  <button
                    className="portal-lease-card-btn edit"
                    onClick={() => onToast(`เปิดฟอร์มรับชำระเงินสำหรับ ${row[0]}`)}
                    title="รับชำระเงิน"
                    type="button"
                  >
                    <WalletCards size={15} />
                    <span>รับชำระยอดนี้</span>
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────
// รายงาน
// ───────────────────────────────────────────────
function ReportsPage({ onToast }: PageContentProps) {
  const monthlyRows = [
    ["สิงหาคม 2569", "฿10,079", "3 ห้อง", "฿9,551.50", "47.8%"],
    ["กรกฎาคม 2569", "฿185,400", "52 ห้อง", "฿25,140", "86.7%"],
    ["มิถุนายน 2569", "฿178,920", "50 ห้อง", "฿18,600", "83.3%"],
    ["พฤษภาคม 2569", "฿182,250", "51 ห้อง", "฿12,000", "85.0%"],
    ["เมษายน 2569", "฿174,600", "49 ห้อง", "฿22,500", "81.7%"],
  ];
  return (
    <>
      <PageHeader eyebrow="การเงิน" title="รายงาน" description="สรุปรายรับ อัตราเข้าพัก และยอดค้างรายเดือน">
        <button className="button secondary" onClick={() => {
          downloadCsv("monthly-report-2569.csv", ["เดือน", "รายรับ", "ห้องที่ชำระ", "ยอดค้าง", "Occupancy"], monthlyRows);
          onToast("ดาวน์โหลดรายงาน CSV สำหรับเปิดใน Excel แล้ว");
        }}>
          <Download size={16} /> Export Excel
        </button>
        <button className="button primary" onClick={() => { window.print(); onToast("เปิดหน้าต่างพิมพ์สำหรับบันทึก PDF แล้ว"); }}>
          Export PDF
        </button>
      </PageHeader>
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <Metric label="รายรับเดือนนี้" value="฿10,079" delta="vs ฿185,400 เดือนก่อน" icon={WalletCards} tone="green" />
        <Metric label="อัตราเข้าพักเฉลี่ย" value="84.9%" delta="เฉลี่ย 5 เดือน" icon={Gauge} tone="blue" />
        <Metric label="ยอดค้างรวม" value="฿9,551.50" delta="3 ห้อง" icon={ReceiptText} tone="orange" />
        <Metric label="รายรับสะสมปีนี้" value="฿731,249" delta="8 เดือน" icon={CircleDollarSign} tone="violet" />
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <span><h2>สรุปรายเดือน</h2><p>รายรับ ยอดค้าง และอัตราเข้าพักย้อนหลัง</p></span>
          <select defaultValue="" style={{ height: 34, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 7, fontSize: 12, background: "white" }}>
            <option value="">ปี 2569</option>
            <option>ปี 2568</option>
          </select>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>เดือน</th>
                <th>รายรับ</th>
                <th>ห้องที่ชำระ</th>
                <th>ยอดค้าง</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row[0]}>
                  <td><strong>{row[0]}</strong></td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td style={{ color: "var(--red)" }}>{row[3]}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 60, height: 7, borderRadius: 10, background: "#edf0f3", overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", borderRadius: 10, background: "var(--green)", width: row[4] }} />
                      </span>
                      {row[4]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ───────────────────────────────────────────────
// จัดการเมนู
// ───────────────────────────────────────────────
function MenusPage({ isLocked, onToast }: PageContentProps) {
  const initialRows = [
    ["แดชบอร์ด", "dashboard", "1", "ภาพรวม", "เปิด"],
    ["หอพัก", "properties", "2", "จัดการลูกค้า", "เปิด"],
    ["ห้องพัก", "rooms", "1", "จัดการหอพัก", "เปิด"],
    ["ผู้เช่า", "tenants", "2", "จัดการหอพัก", "เปิด"],
    ["สัญญาเช่า", "contracts", "3", "จัดการหอพัก", "เปิด"],
    ["มิเตอร์", "meters", "1", "การเงิน", "เปิด"],
    ["ใบแจ้งหนี้", "invoices", "2", "การเงิน", "เปิด"],
    ["รับชำระ", "payments", "3", "การเงิน", "เปิด"],
    ["ยอดค้าง", "receivables", "4", "การเงิน", "เปิด"],
    ["รายงาน", "reports", "5", "การเงิน", "เปิด"],
    ["LINE แจ้งเตือน", "line", "1", "บริการเสริม", "Add-on"],
  ];
  const collection = useDemoCollection(initialRows, onToast, 20);
  return (
    <>
      <PageHeader eyebrow="ระบบ" title="จัดการเมนู" description="กำหนดชื่อ ลำดับ และหมวดหมู่ของเมนูในระบบ">
        <button disabled={isLocked} className="button primary" onClick={() => onToast("บันทึกลำดับเมนูแล้ว")}>
          บันทึก
        </button>
      </PageHeader>
      <SimpleTable
        headers={["ชื่อเมนู", "รหัส", "ลำดับ", "หมวด", "สถานะ"]}
        rows={collection.items}
        onDelete={collection.removeItem}
        disableDelete={isLocked}
      />
    </>
  );
}

// ───────────────────────────────────────────────
// ตั้งค่าระบบ
// ───────────────────────────────────────────────
function SettingsPage({ isLocked, onToast, appSettings, onSettingsChange }: PageContentProps) {
  const [local, setLocal] = useState<AppSettings>(appSettings);
  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setLocal(prev => ({ ...prev, [key]: value }));
  }
  return (
    <>
      <PageHeader eyebrow="ระบบ" title="ตั้งค่าระบบ" description="ข้อมูลกิจการ อัตราค่าสาธารณูปโภค และการตั้งค่าทั่วไป">
        <button disabled={isLocked} className="button secondary" onClick={() => setLocal(appSettings)}>ยกเลิก</button>
        <button disabled={isLocked} className="button primary" onClick={() => { onSettingsChange(local); onToast("บันทึกแล้ว — อัตราค่าไฟ/น้ำจะมีผลกับมิเตอร์ทันที"); }}>บันทึก</button>
      </PageHeader>
      <div className="settings-grid">
        <section className="panel settings-section">
          <div className="settings-section-head"><h2>ข้อมูลกิจการ</h2></div>
          <div className="settings-body">
            <label className="settings-field"><span>ชื่อกิจการ</span><input defaultValue="บริษัท สมชายอพาร์ทเมนท์ จำกัด" disabled={isLocked} /></label>
            <label className="settings-field"><span>เลขประจำตัวผู้เสียภาษี</span><input defaultValue="0123456789012" disabled={isLocked} /></label>
            <label className="settings-field"><span>เบอร์ติดต่อ</span><input defaultValue="074-200-001" disabled={isLocked} /></label>
            <label className="settings-field"><span>อีเมลกิจการ</span><input type="email" defaultValue="contact@somchai-apt.com" disabled={isLocked} /></label>
            <label className="settings-field"><span>ที่อยู่</span><input defaultValue="123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา 90110" disabled={isLocked} /></label>
          </div>
        </section>
        <section className="panel settings-section">
          <div className="settings-section-head"><h2>⚡ อัตราค่าสาธารณูปโภค — ใช้คำนวณมิเตอร์จริง</h2></div>
          <div className="settings-body">
            <label className="settings-field">
              <span>ค่าไฟต่อหน่วย (฿/หน่วย) — ใช้คำนวณในหน้ามิเตอร์และบิล</span>
              <input type="number" step="0.01" min="0" value={local.electricRate} disabled={isLocked}
                onChange={e => update("electricRate", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="settings-field">
              <span>ค่าน้ำต่อเดือน/ห้อง (฿ เหมาจ่าย) — ใช้คำนวณในหน้ามิเตอร์และบิล</span>
              <input type="number" step="1" min="0" value={local.waterRate} disabled={isLocked}
                onChange={e => update("waterRate", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="settings-field">
              <span>วันออกบิลทุกเดือน (วันที่)</span>
              <input type="number" min="1" max="28" value={local.billDay} disabled={isLocked}
                onChange={e => update("billDay", parseInt(e.target.value) || 1)} />
            </label>
            <label className="settings-field">
              <span>วันครบกำหนดชำระ (วันที่)</span>
              <input type="number" min="1" max="28" value={local.dueDay} disabled={isLocked}
                onChange={e => update("dueDay", parseInt(e.target.value) || 5)} />
            </label>
            <label className="settings-field">
              <span>ค่าปรับชำระช้า (฿/วัน)</span>
              <input type="number" min="0" value={local.lateFee} disabled={isLocked}
                onChange={e => update("lateFee", parseFloat(e.target.value) || 0)} />
            </label>
          </div>
        </section>
        <section className="panel settings-section">
          <div className="settings-section-head"><h2>การรับชำระเงิน</h2></div>
          <div className="settings-body">
            <label className="settings-field">
              <span>เลขพร้อมเพย์</span>
              <input value={local.promptpay} disabled={isLocked} onChange={e => update("promptpay", e.target.value)} />
            </label>
            <label className="settings-field">
              <span>ชื่อบัญชีรับเงิน</span>
              <input value={local.accountName} disabled={isLocked} onChange={e => update("accountName", e.target.value)} />
            </label>
            <label className="settings-field toggle-field">
              <span>แนบ QR พร้อมเพย์ในบิล</span>
              <input type="checkbox" checked={local.attachQR} disabled={isLocked} onChange={e => update("attachQR", e.target.checked)} />
            </label>
          </div>
        </section>
        <section className="panel settings-section">
          <div className="settings-section-head"><h2>เอกสาร</h2></div>
          <div className="settings-body">
            <label className="settings-field">
              <span>ชื่อหัวใบแจ้งหนี้</span>
              <input value={local.invoiceHeader} disabled={isLocked} onChange={e => update("invoiceHeader", e.target.value)} />
            </label>
            <label className="settings-field">
              <span>หมายเหตุท้ายบิล</span>
              <input value={local.invoiceNote} disabled={isLocked} onChange={e => update("invoiceNote", e.target.value)} />
            </label>
            <label className="settings-field toggle-field">
              <span>แจ้งเตือนก่อนครบกำหนดชำระ</span>
              <input type="checkbox" defaultChecked disabled={isLocked} />
            </label>
            <label className="settings-field toggle-field">
              <span>แจ้งเตือนสัญญาใกล้หมด</span>
              <input type="checkbox" defaultChecked disabled={isLocked} />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────
// InvoiceModal — ใบแจ้งหนี้แบบ paper พร้อมพิมพ์
// ──────────────────────────────────────────────────────
function InvoiceModal({ room, settings, onClose }: { room: RoomRecord; settings: AppSettings; onClose: () => void }) {
  const units = room.newElec! - room.prevElec;
  const elecCost = units * settings.electricRate;
  const total = room.rent + elecCost + settings.waterRate;
  const invNo = `INV-2569-09${room.number.replace(/\D/g, "")}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box invoice-modal" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
        <div className="modal-toolbar">
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>ใบแจ้งหนี้ · ห้อง {room.number} ({invNo})</span>
          <button className="button primary" style={{ marginLeft: "auto" }} onClick={() => window.print()}>🖨️ พิมพ์บิล A4</button>
        </div>

        <div className="contract-paper" id="print-area">
          <div className="contract-official-header">
            <div className="contract-official-emblem">🏢</div>
            <h1 className="contract-official-title">สมชายแมนชั่น</h1>
            <p className="contract-official-sub">ใบแจ้งหนี้ / ใบเรียกเก็บเงินประจำเดือน (INVOICE)</p>
          </div>

          <div className="contract-meta-bar">
            <div><strong>เลขที่เอกสาร:</strong> {invNo}</div>
            <div><strong>วันที่ออกบิล:</strong> 27 ส.ค. 2569</div>
            <div><strong>กำหนดชำระ:</strong> 5 ก.ย. 2569</div>
            <div><strong>ห้องพัก:</strong> {room.number}</div>
          </div>

          <div style={{ margin: "14px 0 10px", padding: "8px 12px", background: "#f8fafc", borderRadius: 6, fontSize: "10pt" }}>
            <strong>ผู้เช่าพักอาศัย:</strong> {room.tenant || "ผู้เช่าห้องพัก"} · <strong>รอบบิล:</strong> 1–31 สิงหาคม 2569
          </div>

          <div style={{ margin: "14px 0", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>ลำดับ</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>รายการค่าใช้จ่าย</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px" }}>1</td>
                  <td style={{ padding: "8px 12px" }}><strong>ค่าเช่าห้องพักประจำเดือน</strong> (ห้อง {room.number})</td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>{room.rent.toLocaleString()}.00</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px" }}>2</td>
                  <td style={{ padding: "8px 12px" }}>
                    <strong>ค่ากระแสไฟฟ้า</strong> ({room.prevElec.toLocaleString()} → {room.newElec!.toLocaleString()} = {units} หน่วย × {settings.electricRate} บ./หน่วย)
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>{elecCost.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px" }}>3</td>
                  <td style={{ padding: "8px 12px" }}><strong>ค่าน้ำประปา</strong> (อัตราเหมาจ่าย)</td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>{settings.waterRate.toFixed(2)}</td>
                </tr>
                <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
                  <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right" }}>
                    ยอดรวมสุทธิที่ต้องชำระ (TOTAL AMOUNT):
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12pt", color: "#0f172a" }}>
                    ฿{total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ margin: "10px 0", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: "10pt" }}>
            <strong>จำนวนเงินตัวอักษร:</strong> {thaiBahtText(total)}
          </div>

          <div style={{ margin: "14px 0", padding: "10px 12px", border: "1px dashed #94a3b8", borderRadius: 8, fontSize: "9.5pt" }}>
            <strong style={{ display: "block", marginBottom: 3, color: "#1e293b" }}>ช่องทางการชำระเงิน:</strong>
            <p style={{ margin: "2px 0" }}>พร้อมเพย์: <strong>{settings.promptpay || "081-999-8888"}</strong> ({settings.accountName || "สมชายแมนชั่น"})</p>
            <small style={{ color: "#64748b" }}>* กรุณาชำระเงินภายในวันที่ <strong>5 ก.ย. 2569</strong></small>
          </div>

          <div className="contract-signatures-grid" style={{ marginTop: 20 }}>
            <div className="contract-sig-item">
              <p>ลงชื่อ ............................................................ ผู้แจ้งยอด</p>
              <div className="sig-line" />
              <p>(สมชายแมนชั่น)</p>
              <p>เจ้าหน้าที่ / ผู้จัดการอาคาร</p>
            </div>
            <div className="contract-sig-item">
              <p>ลงชื่อ ............................................................ ผู้รับใบแจ้งหนี้</p>
              <div className="sig-line" />
              <p>( {room.tenant || "ผู้เช่าห้องพัก"} )</p>
              <p>ผู้เช่าห้องพักหมายเลข {room.number}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// ContractFormModal — ฟอร์มทำสัญญาใหม่ / แก้ไขสัญญา
// ──────────────────────────────────────────────────────
function ContractFormModal({
  contract,
  onClose,
  onSave,
  onSaveAndView,
}: {
  contract: ContractRecord;
  onClose: () => void;
  onSave: (contract: ContractRecord) => void;
  onSaveAndView: (contract: ContractRecord) => void;
}) {
  const [form, setForm] = useState<ContractRecord>({ ...contract });

  function update<K extends keyof ContractRecord>(key: K, value: ContractRecord[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto adjust deposit & advance if rent changed and not customized
      if (key === "rent" && typeof value === "number") {
        next.deposit = value * 2;
        next.advanceRent = value;
      }
      return next;
    });
  }

  const isFormValid = form.tenantName.trim() !== "" && form.roomNumber.trim() !== "" && form.rent > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box contract-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-toolbar">
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {contract.tenantName ? `✏️ แก้ไขสัญญาเช่า · ${contract.id}` : `📝 ทำสัญญาเช่าห้องพักใหม่`}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
            หอพัก: สมชายแมนชั่น
          </span>
        </div>

        <div className="contract-form-body">
          <div className="contract-form-grid">
            <label className="contract-form-field">
              <span>เลขที่สัญญา *</span>
              <input
                value={form.id}
                onChange={e => update("id", e.target.value)}
                placeholder="เช่น สญ.-2568-001"
              />
            </label>
            <label className="contract-form-field">
              <span>หมายเลขห้องพัก *</span>
              <input
                value={form.roomNumber}
                onChange={e => update("roomNumber", e.target.value)}
                placeholder="เช่น 101, 202"
              />
            </label>
          </div>

          <div className="contract-form-grid">
            <label className="contract-form-field">
              <span>ชื่อ-นามสกุล ผู้เช่า *</span>
              <input
                value={form.tenantName}
                onChange={e => update("tenantName", e.target.value)}
                placeholder="เช่น นายธนกร มั่นคง"
              />
            </label>
            <label className="contract-form-field">
              <span>เลขประจำตัวประชาชน (13 หลัก)</span>
              <input
                value={form.tenantIdCard}
                onChange={e => update("tenantIdCard", e.target.value)}
                placeholder="เช่น 1-1004-00892-31-0"
              />
            </label>
          </div>

          <div className="contract-form-grid">
            <label className="contract-form-field">
              <span>เบอร์โทรศัพท์ผู้เช่า</span>
              <input
                value={form.tenantPhone}
                onChange={e => update("tenantPhone", e.target.value)}
                placeholder="เช่น 081-234-5678"
              />
            </label>
            <label className="contract-form-field">
              <span>สถานะสัญญา</span>
              <select
                value={form.status}
                onChange={e => update("status", e.target.value as "active" | "expired" | "draft")}
              >
                <option value="active">มีผลอยู่ (Active)</option>
                <option value="draft">ร่างสัญญา (Draft)</option>
                <option value="expired">หมดอายุแล้ว (Expired)</option>
              </select>
            </label>
          </div>

          <div className="contract-form-grid">
            <label className="contract-form-field">
              <span>วันที่เริ่มสัญญา *</span>
              <input
                value={form.startDate}
                onChange={e => update("startDate", e.target.value)}
                placeholder="เช่น 1 มี.ค. 2568"
              />
            </label>
            <label className="contract-form-field">
              <span>วันที่สิ้นสุดสัญญา *</span>
              <input
                value={form.endDate}
                onChange={e => update("endDate", e.target.value)}
                placeholder="เช่น 28 ก.พ. 2569"
              />
            </label>
          </div>

          <div className="contract-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label className="contract-form-field">
              <span>ค่าเช่ารายเดือน (บาท) *</span>
              <input
                type="number"
                min="0"
                step="100"
                value={form.rent || ""}
                onChange={e => update("rent", parseInt(e.target.value) || 0)}
              />
            </label>
            <label className="contract-form-field">
              <span>เงินประกันความเสียหาย (บาท)</span>
              <input
                type="number"
                min="0"
                step="100"
                value={form.deposit || ""}
                onChange={e => update("deposit", parseInt(e.target.value) || 0)}
              />
            </label>
            <label className="contract-form-field">
              <span>ค่าเช่าล่วงหน้า (บาท)</span>
              <input
                type="number"
                min="0"
                step="100"
                value={form.advanceRent || ""}
                onChange={e => update("advanceRent", parseInt(e.target.value) || 0)}
              />
            </label>
          </div>

          <label className="contract-form-field">
            <span>ข้อกำหนด / เงื่อนไขพิเศษเพิ่มเติม (ถ้ามี)</span>
            <textarea
              value={form.customClauses}
              onChange={e => update("customClauses", e.target.value)}
              placeholder="เช่น ห้ามสูบบุหรี่ในห้องพัก, ให้สิทธิ์จอดรถยนต์ 1 คัน, อนุญาตเลี้ยงสัตว์ขนาดเล็ก 1 ตัว ฯลฯ"
            />
          </label>
        </div>

        <div className="contract-form-footer">
          <button className="button secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="button secondary"
            disabled={!isFormValid}
            onClick={() => onSave(form)}
          >
            💾 บันทึกสัญญา
          </button>
          <button
            className="button primary"
            disabled={!isFormValid}
            onClick={() => onSaveAndView(form)}
          >
            📄 บันทึกและดูเอกสาร PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// ContractModal — เอกสารสัญญาเช่าทางการแบบ A4 พร้อมพิมพ์
// ──────────────────────────────────────────────────────
function ContractModal({
  contract,
  settings,
  onClose,
  onEdit,
}: {
  contract: ContractRecord;
  settings: AppSettings;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box contract-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-toolbar">
          <button className="icon-button" onClick={onClose} title="ปิด"><X size={20} /></button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            สัญญาเช่า · ห้อง {contract.roomNumber} · {contract.tenantName} ({contract.id})
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="button secondary"
              style={{ fontSize: 13, minHeight: 34, padding: "0 14px" }}
              onClick={onEdit}
            >
              ✏️ แก้ไขสัญญานี้
            </button>
            <button
              className="button primary"
              style={{ fontSize: 13, minHeight: 34, padding: "0 16px" }}
              onClick={() => window.print()}
            >
              🖨️ พิมพ์ / บันทึก PDF
            </button>
          </div>
        </div>

        <div className="contract-paper" id="print-area">
          <div className="contract-official-header">
            <div className="contract-official-emblem">🏢</div>
            <h1 className="contract-official-title">สัญญาเช่าห้องพักอาศัย</h1>
            <div className="contract-official-sub">RESIDENTIAL LEASE AGREEMENT</div>
          </div>

          <div className="contract-meta-bar">
            <span><strong>เลขที่สัญญา:</strong> {contract.id}</span>
            <span><strong>ทำขึ้น ณ:</strong> สมชายแมนชั่น เลขที่ 123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา</span>
            <span><strong>วันที่ทำสัญญา:</strong> {contract.startDate}</span>
          </div>

          <div className="contract-clause">
            <p>
              สัญญาเช่าฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท สมชายอพาร์ทเมนท์ จำกัด</strong> โดย <strong>นายสมชาย ใจดี</strong> (ผู้ให้เช่า) 
              ตั้งอยู่เลขที่ 123 ถนนกาญจนวนิช ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110 โทรศัพท์ 074-200-001 
              ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>&quot;ผู้ให้เช่า&quot;</strong> ฝ่ายหนึ่ง
            </p>
            <p style={{ marginTop: 8 }}>
              กับ <strong>{contract.tenantName || "...................................................."}</strong> (ผู้เช่า) 
              {contract.tenantIdCard ? ` เลขประจำตัวประชาชน ${contract.tenantIdCard}` : ""} 
              {contract.tenantPhone ? ` โทรศัพท์ ${contract.tenantPhone}` : ""} 
              ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>&quot;ผู้เช่า&quot;</strong> อีกฝ่ายหนึ่ง
            </p>
            <p style={{ marginTop: 8 }}>
              คู่สัญญาทั้งสองฝ่ายตกลงยินยอมทำสัญญาเช่าห้องพักอาศัย โดยมีข้อความและเงื่อนไขถูกต้องตรงกันดังต่อไปนี้:
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๑. ทรัพย์สินที่เช่าและวัตถุประสงค์</h4>
            <p>
              ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักหมายเลข <strong>{contract.roomNumber}</strong> ณ อาคารสมชายแมนชั่น 
              พร้อมด้วยเครื่องเรือน เฟอร์นิเจอร์ และอุปกรณ์ติดตั้งภายในห้องพักตามรายการตรวจรับ เพื่อใช้เป็นที่พักอาศัยโดยชอบด้วยกฎหมายเท่านั้น 
              ห้ามนำไปใช้เพื่อประกอบการค้า ธุรกิจ หรือการกระทำอื่นใดที่ผิดกฎหมายหรือขัดต่อความสงบเรียบร้อย
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๒. กำหนดระยะเวลาการเช่า</h4>
            <p>
              มีกำหนดเวลาเช่าตั้งแต่วันที่ <strong>{contract.startDate}</strong> ถึงวันที่ <strong>{contract.endDate}</strong> 
              เมื่อครบกำหนดตามสัญญานี้ หากผู้เช่าประสงค์จะต่ออายุสัญญาเช่า จะต้องแจ้งให้ผู้ให้เช่าทราบเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า ๓๐ (สามสิบ) วันก่อนสัญญาเช่าสิ้นสุด
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๓. อัตราค่าเช่าและกำหนดเวลาชำระ</h4>
            <p>
              ผู้เช่าตกลงชำระค่าเช่าห้องพักในอัตราเดือนละ <strong>฿{contract.rent.toLocaleString()} บาท ({thaiBahtText(contract.rent)})</strong> 
              โดยต้องชำระล่วงหน้าภายในวันที่ ๕ ของทุกเดือน โดยโอนเงินเข้าบัญชีพร้อมเพย์ {settings.promptpay} ({settings.accountName}) 
              หากชำระเกินกำหนดเวลา ผู้เช่ายินยอมเสียค่าปรับวันละ {settings.lateFee} บาท จนกว่าจะชำระครบถ้วน
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๔. เงินประกันความเสียหายและค่าเช่าล่วงหน้า</h4>
            <p>
              ในวันทำสัญญานี้ ผู้เช่าได้วางเงินประกันความเสียหายจำนวน <strong>฿{contract.deposit.toLocaleString()} บาท ({thaiBahtText(contract.deposit)})</strong> 
              และค่าเช่าล่วงหน้าจำนวน <strong>฿{contract.advanceRent.toLocaleString()} บาท ({thaiBahtText(contract.advanceRent)})</strong> ให้แก่ผู้ให้เช่าไว้เรียบร้อยแล้ว
            </p>
            <p style={{ marginTop: 4 }}>
              เงินประกันดังกล่าว ผู้ให้เช่าจะคืนให้แก่ผู้เช่าภายหลังหักค่าใช้จ่ายค้างชำระ ค่าซ่อมแซมความเสียหายของห้องพักและทรัพย์สิน (ถ้ามี) 
              ภายในกำหนดเวลาไม่เกิน ๓๐ วัน นับแต่วันที่ผู้เช่าได้ส่งมอบห้องพักคืนในสภาพเรียบร้อย
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๕. ค่าสาธารณูปโภคและค่าบริการ</h4>
            <p>
              ผู้เช่าตกลงชำระค่ากระแสไฟฟ้าตามจำนวนหน่วยที่ใช้จริงในอัตราหน่วยละ <strong>{settings.electricRate} บาท</strong> 
              และค่าน้ำประปาในอัตราเหมาจ่ายเดือนละ <strong>{settings.waterRate} บาท/ห้อง</strong> 
              โดยผู้ให้เช่าจะจดมิเตอร์และออกใบแจ้งหนี้เรียกเก็บพร้อมกับค่าเช่าห้องพักในแต่ละเดือน
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๖. การดูแลรักษาห้องพักและทรัพย์สิน</h4>
            <p>
              ผู้เช่าสัญญาว่าจะดูแลรักษาห้องพักและทรัพย์สินภายในห้องพักให้อยู่ในสภาพเรียบร้อย สะอาด และปลอดภัยดั่งเช่นวิญญูชนพึงรักษาทรัพย์สินของตน 
              ห้ามมิให้เจาะผนัง ดัดแปลง ต่อเติม หรือรื้อถอนส่วนประกอบใดๆ ของห้องพัก เว้นแต่จะได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
            </p>
          </div>

          <div className="contract-clause">
            <h4>ข้อ ๗. ข้อห้ามและระเบียบการพักอาศัย</h4>
            <p>ผู้เช่าตกลงปฏิบัติตามกฎระเบียบของอาคารอย่างเคร่งครัด ดังนี้:</p>
            <ul>
              <li>ห้ามส่งเสียงดัง ก่อความรำคาญ หรือจัดงานสังสรรค์รบกวนผู้อื่นหลังเวลา ๒๒.๐๐ น.</li>
              <li>ห้ามนำสิ่งเสพติด วัตถุไวไฟ อาวุธ หรือสิ่งผิดกฎหมายทุกชนิดเข้ามาในบริเวณอาคาร</li>
              <li>ห้ามนำสัตว์เลี้ยงเข้ามาพักอาศัย เว้นแต่จะได้รับอนุญาตเป็นลายลักษณ์อักษร</li>
              <li>ห้ามนำห้องพักไปให้บุคคลอื่นเช่าช่วง หรือโอนสิทธิการเช่าให้แก่บุคคลภายนอก</li>
            </ul>
          </div>

          {contract.customClauses ? (
            <div className="contract-clause">
              <h4>ข้อ ๘. ข้อกำหนดและเงื่อนไขพิเศษเพิ่มเติม</h4>
              <p><strong>{contract.customClauses}</strong></p>
            </div>
          ) : null}

          <div className="contract-clause">
            <h4>ข้อ {contract.customClauses ? "๙" : "๘"}. การบอกเลิกสัญญา</h4>
            <p>
              หากผู้เช่าผิดนัดไม่ชำระค่าเช่าหรือค่าสาธารณูปโภคติดต่อกันเกินกว่า ๑๕ วัน หรือกระทำการฝ่าฝืนข้อกำหนดใดๆ ในสัญญานี้ 
              ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาเช่า ริบเงินประกันความเสียหาย และตัดสิทธิการเข้าออกห้องพักได้ทันที
            </p>
          </div>

          <div className="contract-clause" style={{ marginTop: 20 }}>
            <p>
              สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความในสัญญานี้โดยละเอียดตลอดแล้ว 
              จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน
            </p>
          </div>

          <div className="contract-signatures-grid">
            <div className="contract-sig-item">
              <p>ลงชื่อ ........................................................... ผู้ให้เช่า</p>
              <div className="sig-line" />
              <p><strong>( นายสมชาย ใจดี )</strong></p>
              <p style={{ color: "var(--muted)", fontSize: 11 }}>ผู้มีอำนาจลงนาม / เจ้าของอาคาร</p>
            </div>

            <div className="contract-sig-item">
              <p>ลงชื่อ ........................................................... ผู้เช่า</p>
              <div className="sig-line" />
              <p><strong>( {contract.tenantName || "...................................................."} )</strong></p>
              <p style={{ color: "var(--muted)", fontSize: 11 }}>ผู้เช่าห้องพักหมายเลข {contract.roomNumber}</p>
            </div>

            <div className="contract-sig-item">
              <p>ลงชื่อ ........................................................... พยาน</p>
              <div className="sig-line" />
              <p>( ........................................................... )</p>
            </div>

            <div className="contract-sig-item">
              <p>ลงชื่อ ........................................................... พยาน</p>
              <div className="sig-line" />
              <p>( ........................................................... )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="page-actions">{children}</div></div>;
}



function Metric({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta: string; icon: ComponentType<LucideProps>; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon size={20} /></span><p>{label}</p><strong>{value}</strong><small>{delta}</small></article>;
}

function PanelHeading({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="panel-heading"><span><h2>{title}</h2><p>{description}</p></span>{action ? <button onClick={onAction}>{action} <ChevronRight size={15} /></button> : null}</div>;
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return <div className="status-bar"><span><strong>{label}</strong><small>{value} กิจการ</small></span><div><i className={color} style={{ width: `${(value / total) * 100}%` }} /></div></div>;
}

function FilterBar({
  placeholder,
  filters = [],
  value,
  onSearchChange,
}: {
  placeholder: string;
  filters?: Array<{ label: string; options: string[]; value?: string; onChange?: (value: string) => void }>;
  value?: string;
  onSearchChange?: (value: string) => void;
}) {
  const controlled = onSearchChange !== undefined;
  const hasFilter = Boolean(value) || filters.some((filter) => Boolean(filter.value));
  return <div className="filter-bar"><label><Search size={17} /><input placeholder={placeholder} value={controlled ? value ?? "" : undefined} onChange={controlled ? (event) => onSearchChange(event.target.value) : undefined} /></label>{filters.map((filter) => <select aria-label={filter.label} value={filter.onChange ? filter.value ?? "" : undefined} defaultValue={filter.onChange ? undefined : ""} onChange={filter.onChange ? (event) => filter.onChange?.(event.target.value) : undefined} key={filter.label}><option value="">{filter.label}</option>{filter.options.map((option) => <option key={option}>{option}</option>)}</select>)}<button className="button secondary" type="button" disabled={!controlled || !hasFilter} onClick={() => { onSearchChange?.(""); filters.forEach((filter) => filter.onChange?.("")); }}><SlidersHorizontal size={16} /> ล้างตัวกรอง</button></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state"><Search size={22} /><span>{message}</span></div>;
}

function CompanyTable({ rows, onDelete }: { rows: Company[]; onDelete?: (index: number) => void }) {
  return <div className="responsive-table"><table><thead><tr><th>กิจการ</th><th>แพ็กเกจ</th><th>หอพัก</th><th>ผู้ใช้งาน</th><th>รอบบริการ</th><th>สถานะ</th><th /></tr></thead><tbody>{rows.map((company, index) => <tr key={`${company.name}-${index}`}><td><span className="company-cell"><i>{company.name.charAt(0)}</i><span><strong>{company.name}</strong><small>{company.owner}</small></span></span></td><td>{company.plan}</td><td>{company.properties}</td><td>{company.users}</td><td>{company.date}</td><td><StatusBadge status={company.status} /></td><td>{onDelete ? <button className="icon-button delete-button" type="button" aria-label={`ลบ ${company.name}`} title="ลบรายการ" onClick={() => onDelete(index)}><Trash2 size={17} /></button> : <button className="icon-button" type="button" aria-label={`ตัวเลือก ${company.name}`}><MoreHorizontal size={18} /></button>}</td></tr>)}</tbody></table></div>;
}

function SimpleTable({ headers, rows, onDelete, disableDelete = false }: { headers: string[]; rows: string[][]; onDelete?: (index: number) => void; disableDelete?: boolean }) {
  return <section className="panel table-panel"><div className="responsive-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}<th /></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === 0 ? <strong>{cell}</strong> : cell}</td>)}<td>{onDelete ? <button className="icon-button delete-button" type="button" disabled={disableDelete} aria-label={`ลบ ${row[0]}`} title="ลบรายการ" onClick={() => onDelete(index)}><Trash2 size={17} /></button> : <button className="icon-button" type="button" aria-label={`ตัวเลือก ${row[0]}`}><MoreHorizontal size={18} /></button>}</td></tr>)}</tbody></table></div></section>;
}

function StatusBadge({ status }: { status: string }) {
  const data = status === "active" ? ["Active", "success"] : status === "trial" ? ["Trial", "info"] : ["หมดอายุ", "danger"];
  return <span className={`badge ${data[1]}`}><i />{data[0]}</span>;
}

function PlanCards({ lineEnabled, onLineChange, onToast }: { lineEnabled: boolean; onLineChange: (value: boolean) => void; onToast: (message: string) => void }) {
  return <><section className="current-plan panel"><div><span className="badge success">แพ็กเกจปัจจุบัน</span><h2>Business</h2><p>รองรับ 3 หอพัก · 200 ห้อง · ผู้ใช้ไม่จำกัด</p></div><div><strong>฿1,590</strong><span>/ เดือน</span><small>รอบถัดไป 25 ก.ย. 2569</small></div><button onClick={() => onToast("เปิดหน้าต่ออายุบริการแล้ว")} className="button primary">ต่ออายุ</button></section><h2 className="section-title">บริการเสริม</h2><section className="addon-grid"><article><span className="addon-icon purple"><MessageCircle size={21} /></span><span><h3>LINE แจ้งเตือน</h3><p>ส่งบิลและแจ้งยอดค้างผ่าน LINE OA</p></span><strong>฿299 <small>/เดือน</small></strong><button className={`button ${lineEnabled ? "secondary" : "primary"}`} onClick={() => onLineChange(!lineEnabled)}>{lineEnabled ? "เปิดใช้งานแล้ว" : "เพิ่มบริการ"}</button></article><article><span className="addon-icon blue"><BookOpenCheck size={21} /></span><span><h3>รายงานขั้นสูง</h3><p>วิเคราะห์รายรับและแนวโน้มรายปี</p></span><strong>฿199 <small>/เดือน</small></strong><button className="button secondary">เพิ่มบริการ</button></article></section></>;
}

function CompanyPanel({ onClose, onSave }: { onClose: () => void; onSave: (company: Company) => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><span><p className="eyebrow">จัดการลูกค้า</p><h2>เพิ่มกิจการใหม่</h2></span><button className="icon-button" type="button" aria-label="ปิดหน้าต่าง" onClick={onClose}><X size={20} /></button></div><form onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); onSave({ name: String(formData.get("companyName")), owner: String(formData.get("ownerName")), plan: String(formData.get("plan")), properties: 1, users: 1, status: formData.get("plan") === "Trial" ? "trial" : "active", date: formData.get("plan") === "Trial" ? "อีก 30 วัน" : "รอบถัดไป 30 วัน" }); }}><div className="form-section"><h3>ข้อมูลกิจการ</h3><label><span>ชื่อกิจการ *</span><input name="companyName" maxLength={80} placeholder="เช่น บริษัท สมชายอพาร์ทเมนท์" required /></label><div className="field-row"><label><span>เบอร์โทร</span><input name="phone" maxLength={20} placeholder="08x-xxx-xxxx" /></label><label><span>เลขประจำตัวผู้เสียภาษี</span><input name="taxId" inputMode="numeric" maxLength={13} placeholder="13 หลัก" /></label></div></div><div className="form-section"><h3>เจ้าของกิจการ</h3><label><span>ชื่อ-นามสกุล *</span><input name="ownerName" maxLength={80} placeholder="ชื่อผู้ดูแลหลัก" required /></label><label><span>อีเมลสำหรับเข้าใช้งาน *</span><input name="email" type="email" maxLength={120} placeholder="owner@example.com" required /></label></div><div className="form-section"><h3>แพ็กเกจเริ่มต้น</h3><label><span>แพ็กเกจ</span><select name="plan" defaultValue="Trial"><option value="Trial">ทดลองฟรี 30 วัน</option><option value="Starter">Starter</option><option value="Business">Business</option></select></label></div><div className="drawer-actions"><button type="button" className="button secondary" onClick={onClose}>ยกเลิก</button><button type="submit" className="button primary">สร้างกิจการ</button></div></form></aside></div>;
}

function AddRoomModal({
  existingRooms,
  onClose,
  onSave,
  onToast,
}: {
  existingRooms: RoomRecord[];
  onClose: () => void;
  onSave: (room: RoomRecord) => void;
  onToast: (message: string) => void;
}) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-box compact-form-modal" onClick={(event) => event.stopPropagation()}><div className="modal-toolbar"><button className="icon-button" type="button" onClick={onClose}><X size={20} /></button><strong>เพิ่มห้องพัก</strong></div><form onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const number = String(data.get("number")).trim();
    if (existingRooms.some((room) => room.number.toLocaleLowerCase("th") === number.toLocaleLowerCase("th"))) {
      onToast(`มีห้อง ${number} อยู่แล้ว`);
      return;
    }
    onSave({ number, tenant: "(ว่าง)", rent: Number(data.get("rent")), prevElec: Number(data.get("prevElec")), newElec: null, contractStart: "", contractEnd: "" });
  }}><div className="form-section"><label><span>เลขห้อง *</span><input name="number" required maxLength={12} placeholder="เช่น 402 หรือ C01" autoFocus /></label><label><span>ค่าเช่าต่อเดือน *</span><input name="rent" type="number" required min="0" step="100" defaultValue="4500" /></label><label><span>เลขมิเตอร์ไฟตั้งต้น *</span><input name="prevElec" type="number" required min="0" defaultValue="0" /></label></div><div className="modal-form-actions"><button className="button secondary" type="button" onClick={onClose}>ยกเลิก</button><button className="button primary" type="submit"><Plus size={16} /> เพิ่มห้อง</button></div></form></div></div>;
}

function PaymentModal({ receiptNumber, onClose, onSave }: { receiptNumber: string; onClose: () => void; onSave: (row: string[]) => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-box compact-form-modal" onClick={(event) => event.stopPropagation()}><div className="modal-toolbar"><button className="icon-button" type="button" onClick={onClose}><X size={20} /></button><strong>บันทึกรับชำระ · {receiptNumber}</strong></div><form onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("amount"));
    onSave(["วันนี้", `${String(data.get("room"))} · ${String(data.get("tenant"))}`, String(data.get("invoice")), `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, String(data.get("channel")), receiptNumber]);
  }}><div className="form-section"><div className="field-row"><label><span>ห้อง *</span><input name="room" required placeholder="เช่น 101" autoFocus /></label><label><span>ชื่อผู้เช่า *</span><input name="tenant" required placeholder="ชื่อ-นามสกุล" /></label></div><label><span>เลขที่ใบแจ้งหนี้ *</span><input name="invoice" required defaultValue="INV-2569-09" /></label><label><span>ยอดรับชำระ *</span><input name="amount" type="number" required min="0.01" step="0.01" defaultValue="4500" /></label><label><span>ช่องทาง</span><select name="channel" defaultValue="โอนเงิน"><option>โอนเงิน</option><option>พร้อมเพย์</option><option>เงินสด</option></select></label></div><div className="modal-form-actions"><button className="button secondary" type="button" onClick={onClose}>ยกเลิก</button><button className="button primary" type="submit"><WalletCards size={16} /> บันทึกและออกใบเสร็จ</button></div></form></div></div>;
}

function useDemoCollection<T>(initialItems: T[], onToast: (message: string) => void, limit = DEMO_ITEM_LIMIT) {
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

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    onToast("ลบรายการออกจาก Demo แล้ว");
  }

  return { items, addItem, removeItem };
}

// ──────────────────────────────────────────────────────
// AddPropertyWizard — เพิ่มหอพักใหม่ (2 ขั้นตอน)
// ──────────────────────────────────────────────────────
function AddPropertyWizard({
  existingSettings,
  onClose,
  onSave,
}: {
  existingSettings: AppSettings;
  onClose: () => void;
  onSave: (prop: Property) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [copySettings, setCopySettings] = useState(true);
  const [electricRate, setElectricRate] = useState(existingSettings.electricRate);
  const [waterRate, setWaterRate] = useState(existingSettings.waterRate);
  const [promptpay, setPromptpay] = useState(existingSettings.promptpay);
  const [accountName, setAccountName] = useState(existingSettings.accountName);

  function handleSave() {
    if (!name.trim()) return;
    const settings: AppSettings = copySettings
      ? { ...existingSettings, invoiceHeader: `ใบแจ้งหนี้ค่าเช่า ${name}` }
      : { ...existingSettings, electricRate, waterRate, promptpay, accountName, invoiceHeader: `ใบแจ้งหนี้ค่าเช่า ${name}` };
    onSave({
      id: `prop-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      settings,
      rooms: [],
      contracts: [],
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-toolbar">
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>🏢 เพิ่มหอพักใหม่</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>ขั้นที่ {step}/2</span>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "12px 20px 0", alignItems: "center" }}>
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: "var(--primary)" }} />
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: step >= 2 ? "var(--primary)" : "var(--line)" }} />
        </div>

        {step === 1 && (
          <div style={{ padding: "20px 24px 24px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>ข้อมูลหอพัก</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>กรอกชื่อและที่อยู่ของหอพักที่ต้องการเพิ่ม</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label className="settings-field">
                <span>ชื่อหอพัก *</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น สมชายเพลส 2" autoFocus />
              </label>
              <label className="settings-field">
                <span>ที่อยู่หอพัก</span>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด" />
              </label>
              <label className="settings-field">
                <span>เบอร์ติดต่อ</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="074-xxx-xxx" />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 10 }}>
              <button className="button secondary" onClick={onClose}>ยกเลิก</button>
              <button className="button primary" disabled={!name.trim()} onClick={() => setStep(2)}>ถัดไป →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: "20px 24px 24px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>ตั้งค่าการเงิน</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>กำหนดอัตราค่าสาธารณูปโภคสำหรับ <strong>{name}</strong></p>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: copySettings ? "#f0f7ff" : "#f8f9fa", borderRadius: 10, border: `1.5px solid ${copySettings ? "var(--primary)" : "var(--line)"}`, cursor: "pointer", marginBottom: 18, fontSize: 13 }}>
              <input type="checkbox" checked={copySettings} onChange={e => setCopySettings(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--primary)", marginTop: 2 }} />
              <span>
                <strong>คัดลอกการตั้งค่าจากหอพักปัจจุบัน</strong><br />
                <span style={{ color: "var(--muted)" }}>ค่าไฟ ค่าน้ำ PromptPay จะถูก copy มาให้ แก้ทีหลังได้ในตั้งค่าระบบ</span>
              </span>
            </label>

            {!copySettings && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="settings-field">
                    <span>ค่าไฟ (฿/หน่วย)</span>
                    <input type="number" step="0.01" min="0" value={electricRate} onChange={e => setElectricRate(parseFloat(e.target.value) || 0)} />
                  </label>
                  <label className="settings-field">
                    <span>ค่าน้ำ (฿/เดือน)</span>
                    <input type="number" min="0" value={waterRate} onChange={e => setWaterRate(parseFloat(e.target.value) || 0)} />
                  </label>
                </div>
                <label className="settings-field">
                  <span>เลขพร้อมเพย์</span>
                  <input value={promptpay} onChange={e => setPromptpay(e.target.value)} placeholder="0812345678" />
                </label>
                <label className="settings-field">
                  <span>ชื่อบัญชีรับเงิน</span>
                  <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="ชื่อ-นามสกุล" />
                </label>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
              <button className="button secondary" onClick={() => setStep(1)}>← ย้อนกลับ</button>
              <button className="button primary" onClick={handleSave}><Building2 size={16} /> สร้างหอพัก</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
