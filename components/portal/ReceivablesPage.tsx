"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ReceiptText } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EmptyState, StatusBadge } from "@/components/portal/PortalUI";
import type { Invoice, Room } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function ReceivablesPage({ invoices, rooms }: { invoices: Invoice[]; rooms: Room[] }) {
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item.room_number])), [rooms]);
  const outstanding = useMemo(() => invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void"), [invoices]);
  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => { const keyword = query.trim().toLocaleLowerCase("th"); return outstanding.filter((item) => { const overdue = item.due_at < today; return (urgency === "all" || (urgency === "overdue" ? overdue : !overdue)) && (!keyword || [item.invoice_number, roomMap.get(item.room_id)].some((value) => value?.toLocaleLowerCase("th").includes(keyword))); }); }, [outstanding, query, roomMap, today, urgency]);
  const overdueCount = outstanding.filter((item) => item.due_at < today).length;
  return <><header className="portal-page-header"><div><h1>ยอดค้างชำระ</h1><p>ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและใกล้ครบกำหนด</p></div></header><section className="portal-summary-strip"><div><strong>{outstanding.length.toLocaleString("th-TH")}</strong><span>เอกสารค้างชำระ</span></div><div><strong>{money(outstanding.reduce((sum, item) => sum + Number(item.balance_due), 0))}</strong><span>ยอดค้างรวม</span></div><div><strong>{overdueCount.toLocaleString("th-TH")}</strong><span>เกินกำหนด</span></div></section><CollectionToolbar title="รายการติดตามหนี้" description={`พบ ${filtered.length.toLocaleString("th-TH")} เอกสาร`} query={query} onQueryChange={setQuery} placeholder="ค้นหาเลขที่ใบแจ้งหนี้หรือห้อง" filter={{ label: "กรองกำหนดชำระ", value: urgency, onChange: setUrgency, options: [{ value: "all", label: "ทั้งหมด" }, { value: "overdue", label: "เกินกำหนด" }, { value: "upcoming", label: "ยังไม่ถึงกำหนด" }] }} />{filtered.length ? <section className="portal-collection-grid">{filtered.map((item) => { const overdue = item.due_at < today; return <article className={`portal-record-card receivable-card${overdue ? " overdue" : ""}`} key={item.id}><header><span className="portal-record-icon danger">{overdue ? <AlertTriangle aria-hidden="true" size={20} /> : <ReceiptText aria-hidden="true" size={20} />}</span><div><h2>{item.invoice_number}</h2><small>ห้อง {roomMap.get(item.room_id) ?? "—"}</small></div><StatusBadge status={item.status} /></header><div className="portal-payment-amount"><small>ยอดค้างชำระ</small><strong>{money(Number(item.balance_due))}</strong><span>จากยอดรวม {money(Number(item.total))}</span></div><footer><span><CalendarClock aria-hidden="true" size={14} /> {overdue ? "เกินกำหนด" : "ครบกำหนด"} {thaiDate(item.due_at)}</span></footer></article>; })}</section> : <EmptyState title={outstanding.length ? "ไม่พบยอดค้างตามเงื่อนไข" : "ไม่มียอดค้าง"} description={outstanding.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองกำหนดชำระ" : "ใบแจ้งหนี้ทั้งหมดปิดยอดแล้ว"} />}</>;
}
