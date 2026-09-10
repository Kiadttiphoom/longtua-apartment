"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Building2, Users, Hotel, KeyRound, UserCheck,
  CalendarRange, Gauge, FileText, WalletCards, ReceiptText,
  CircleDollarSign, ShieldCheck, X
} from "lucide-react";

type SearchItem = {
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon: typeof Building2;
};

const defaultItems: SearchItem[] = [
  { title: "ภาพรวมระบบ", subtitle: "สถานะลูกค้า ผู้ใช้งาน และ Subscription", category: "ระบบ", href: "/admin", icon: ShieldCheck },
  { title: "คำขอทดลองใช้", subtitle: "ตรวจสอบตัวตน และอนุมัติ Trial", category: "คำขอ", href: "/admin/trial-requests", icon: FileText },
  { title: "กิจการทั้งหมด", subtitle: "ตรวจสอบและควบคุมสถานะกิจการลูกค้า", category: "กิจการ", href: "/admin/organizations", icon: Building2 },
  { title: "หอพักทั้งหมด", subtitle: "หอพักจริงทั้งหมดในทุกกิจการ", category: "จัดการหอพัก", href: "/admin/properties", icon: Hotel },
  { title: "ผู้ใช้งานทั้งหมด", subtitle: "ควบคุมบัญชีและตั้งรหัสผ่านชั่วคราว", category: "ผู้ใช้", href: "/admin/users", icon: Users },
  { title: "ห้องพักทั้งหมด", subtitle: "สถานะห้องพักจริงจากทุกหอ", category: "จัดการหอพัก", href: "/admin/rooms", icon: KeyRound },
  { title: "ผู้เช่าทั้งหมด", subtitle: "ทะเบียนผู้เช่ารวมทั้งแพลตฟอร์ม", category: "จัดการหอพัก", href: "/admin/tenants", icon: UserCheck },
  { title: "สัญญาเช่าทั้งหมด", subtitle: "สัญญาเช่าจริงและสถานะปัจจุบัน", category: "จัดการหอพัก", href: "/admin/leases", icon: CalendarRange },
  { title: "มิเตอร์น้ำ-ไฟ", subtitle: "มิเตอร์และรายการจดล่าสุดจากทุกหอพัก", category: "การเงิน", href: "/admin/meters", icon: Gauge },
  { title: "ใบแจ้งหนี้ทั้งหมด", subtitle: "ใบแจ้งหนี้จริงทั้งหมดในระบบ", category: "การเงิน", href: "/admin/invoices", icon: FileText },
  { title: "รายการรับชำระ", subtitle: "ประวัติการรับชำระจริงจากทุกกิจการ", category: "การเงิน", href: "/admin/payments", icon: WalletCards },
  { title: "ลูกหนี้คงค้าง", subtitle: "ใบแจ้งหนี้ที่ยังมียอดคงเหลือ", category: "การเงิน", href: "/admin/receivables", icon: ReceiptText },
  { title: "รายงานการเงิน", subtitle: "ภาพรวมการดำเนินงานและการเงินทั้งแพลตฟอร์ม", category: "การเงิน", href: "/admin/reports", icon: CircleDollarSign },
  { title: "แพ็กเกจและบริการ", subtitle: "จัดการ Trial โควตาห้อง/หอ และวันหมดอายุ", category: "ระบบ", href: "/admin/subscriptions", icon: CircleDollarSign },
  { title: "Role & สิทธิ์", subtitle: "สร้างและแก้ไขบทบาทระดับแพลตฟอร์มหรือกิจการ", category: "ความปลอดภัย", href: "/admin/roles", icon: ShieldCheck },
  { title: "Permission Matrix", subtitle: "กำหนดสิทธิ์อย่างละเอียดในแต่ละ Role", category: "ความปลอดภัย", href: "/admin/permissions", icon: ShieldCheck },
  { title: "Monitor", subtitle: "กิจกรรมผู้ใช้ กราฟ และข้อผิดพลาดของระบบ", category: "ระบบ", href: "/admin/monitor", icon: FileText },
  { title: "Audit Log", subtitle: "ประวัติการดำเนินการทั้งหมดของ Super Admin", category: "ความปลอดภัย", href: "/admin/audit", icon: FileText },
  { title: "ตั้งค่าระบบ", subtitle: "เปิด/ปิดรับคำขอทดลองใช้", category: "ระบบ", href: "/admin/settings", icon: ShieldCheck },
];

export function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return defaultItems;
    return defaultItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <span>ค้นหาเมนูหรือข้อมูล...</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-mono">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-100 flex items-center gap-3">
              <Search size={18} className="text-blue-600 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาหน้าเมนู เช่น กิจการ, ผู้ใช้, สัญญา, มิเตอร์, แพ็กเกจ..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {results.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  ไม่พบผลการค้นหาสำหรับ &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors cursor-pointer group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors shrink-0">
                        <Icon size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                            {item.title}
                          </strong>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400">
              <span>กด Esc เพื่อปิด</span>
              <span>Longtua Admin Global Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
