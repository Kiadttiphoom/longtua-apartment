import Link from "next/link";
import { Building2, CalendarRange, ChevronRight, KeyRound, ReceiptText, WalletCards } from "lucide-react";
import { DataTable, StatusBadge } from "@/components/portal/PortalUI";
import type { PortalData } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function DashboardOverview({ data }: { data: PortalData }) {
  const activeLeases = data.leases.filter((item) => item.status === "active");
  const revenue = data.payments.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + Number(item.amount), 0);
  const outstanding = data.invoices.filter((item) => item.status !== "void").reduce((sum, item) => sum + Number(item.balance_due), 0);
  const occupancy = data.rooms.length ? Math.round(data.rooms.filter((item) => item.status === "occupied").length / data.rooms.length * 100) : 0;
  const roomMap = new Map(data.rooms.map((item) => [item.id, item.room_number]));
  const cards = [
    ["หอพัก", `${data.properties.length} แห่ง`, Building2, "/dormitories", "blue"],
    ["ห้องพัก", `${data.rooms.length} ห้อง`, KeyRound, "/guestrooms", "violet"],
    ["สัญญาใช้งาน", `${activeLeases.length} ฉบับ`, CalendarRange, "/leases", "cyan"],
    ["อัตราเข้าพัก", `${occupancy}%`, KeyRound, "/guestrooms", "green"],
    ["รับชำระสะสม", money(revenue), WalletCards, "/payments", "emerald"],
    ["ยอดค้าง", money(outstanding), ReceiptText, "/receivables", outstanding > 0 ? "amber" : "slate"],
  ] as const;
  return <>
    <header className="portal-page-header"><div><h1>ภาพรวมกิจการ</h1><p>สถานะล่าสุดของหอพัก ห้องเช่า และกระแสเงินสด</p></div></header>
    {data.schemaError ? <div className="portal-schema-alert">{data.schemaError}</div> : null}
    <section aria-label="ตัวชี้วัดสำคัญ" className="portal-stat-grid">{cards.map(([label, value, Icon, href, tone]) => <Link className={`portal-stat-${tone}`} href={href} key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong></div><ChevronRight size={16} /></Link>)}</section>
    <section className="portal-section"><header><div><h2>ใบแจ้งหนี้ล่าสุด</h2><p>รายการเคลื่อนไหวที่ควรติดตาม</p></div><Link href="/invoices">ดูทั้งหมด <ChevronRight size={16} /></Link></header><DataTable headers={["เลขที่", "ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ"]} rows={data.invoices.slice(0, 6).map((item) => [<strong key="number">{item.invoice_number}</strong>, roomMap.get(item.room_id) ?? "—", thaiDate(item.issued_at), thaiDate(item.due_at), money(Number(item.total)), money(Number(item.balance_due)), <StatusBadge status={item.status} key="status" />])} emptyTitle="ยังไม่มีใบแจ้งหนี้" emptyDescription="สร้างหอพัก ห้อง ผู้เช่า และสัญญา เพื่อเริ่มออกใบแจ้งหนี้" /></section>
  </>;
}
