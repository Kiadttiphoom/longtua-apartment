import Link from "next/link";
import { ArrowRight, CalendarClock, FileCheck2, Home, ReceiptText, WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { money, thaiDate } from "@/lib/format";
import { loadTenantPortalData } from "@/lib/tenant/data";

export default async function TenantHomePage() {
  const data = await loadTenantPortalData();
  const activeLease = data.leases.find((item) => item.status === "active") ?? data.leases[0];
  const room = data.rooms.find((item) => item.id === activeLease?.room_id);
  const property = data.properties.find((item) => item.id === activeLease?.property_id);
  const outstanding = data.invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void");
  const totalDue = outstanding.reduce((sum, item) => sum + Number(item.balance_due), 0);
  const nextBill = outstanding.slice().sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  return <><header className="tenant-page-heading"><div><span>สวัสดี</span><h1>{data.tenant.full_name}</h1><p>{property ? `${property.name} · ห้อง ${room?.room_number ?? "—"}` : "ติดตามสัญญาและค่าใช้จ่ายของคุณ"}</p></div><span className="tenant-home-icon"><Home size={22} /></span></header><section className="tenant-balance-card"><div><small>ยอดค้างทั้งหมด</small><strong>{money(totalDue)}</strong><span>{outstanding.length.toLocaleString("th-TH")} ใบแจ้งหนี้ที่รอชำระ</span></div><WalletCards size={30} /></section><section className="tenant-quick-grid"><Link href="/tenant/lease"><FileCheck2 size={20} /><div><strong>สัญญาของฉัน</strong><span>{activeLease?.lease_number ?? "ยังไม่มีสัญญา"}</span></div><ArrowRight size={17} /></Link><Link href="/tenant/bills"><ReceiptText size={20} /><div><strong>บิลและชำระเงิน</strong><span>ดูรายละเอียดและแนบสลิป</span></div><ArrowRight size={17} /></Link></section>{nextBill ? <section className="tenant-section"><header><div><h2>รายการใกล้ครบกำหนด</h2><p>ตรวจสอบก่อนชำระเงิน</p></div><Link href="/tenant/bills">ดูทั้งหมด</Link></header><article className="tenant-invoice-row"><span><CalendarClock size={19} /></span><div><strong>{nextBill.invoice_number}</strong><small>ครบกำหนด {thaiDate(nextBill.due_at)}</small></div><div><strong>{money(Number(nextBill.balance_due))}</strong><StatusBadge status={nextBill.status} /></div></article></section> : <section className="tenant-clear-state"><FileCheck2 size={24} /><strong>ไม่มียอดค้างชำระ</strong><span>ใบแจ้งหนี้ของคุณชำระครบแล้ว</span></section>}</>;
}
