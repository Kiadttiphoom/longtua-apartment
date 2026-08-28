"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, CalendarRange, ChevronRight, CircleDollarSign, FileText, Gauge,
  Home, KeyRound, LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Settings,
  Users, WalletCards, X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  createInvoiceAction, createLeaseAction, createPropertyAction, createRoomAction,
  createTenantAction, recordPaymentAction, saveMeterReadingAction,
  updatePropertySettingsAction, type DashboardActionResult,
} from "@/app/dashboard/actions";

type IdName = { id: string; name: string };
type Property = IdName & { address: string; phone: string | null; status: string };
type PropertySettings = {
  property_id: string; electric_rate: number; water_rate: number; bill_day: number;
  due_day: number; late_fee: number; promptpay_id: string | null; account_name: string | null;
  invoice_note: string | null;
};
type Room = { id: string; property_id: string; room_number: string; floor: string | null; base_rent: number; status: string };
type Tenant = { id: string; full_name: string; phone: string | null; email: string | null; id_card_last4: string | null; status: string };
type Lease = { id: string; property_id: string; room_id: string; primary_tenant_id: string; lease_number: string; start_date: string; end_date: string | null; rent_amount: number; deposit_amount: number; status: string };
type Meter = { id: string; room_id: string; meter_type: string };
type MeterReading = { id: string; meter_id: string; current_value: number; usage_value: number; read_at: string };
type Invoice = { id: string; property_id: string; room_id: string; lease_id: string | null; invoice_number: string; issued_at: string; due_at: string; total: number; balance_due: number; status: string };
type Payment = { id: string; property_id: string; receipt_number: string; paid_at: string; amount: number; method: string; reference: string | null; status: string };
type PageKey = "overview" | "properties" | "rooms" | "tenants" | "leases" | "meters" | "invoices" | "payments" | "receivables" | "reports" | "settings" | "subscription";
type ModalKey = "property" | "room" | "tenant" | "lease" | "meter" | "invoice" | "payment" | "settings" | null;

type Props = {
  organization: IdName;
  organizations: IdName[];
  userName: string;
  roleLabel: string;
  subscription: { status: string; trial_ends_at: string | null };
  properties: Property[];
  settings: PropertySettings[];
  rooms: Room[];
  tenants: Tenant[];
  leases: Lease[];
  meters: Meter[];
  meterReadings: MeterReading[];
  invoices: Invoice[];
  payments: Payment[];
  initialPage?: string;
  menuItems?: Array<{ key: string; label: string }>;
  permissionKeys?: string[];
  schemaError?: string;
  logoutAction: () => Promise<void>;
};

const defaultNav: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: "overview", label: "แดชบอร์ด", icon: LayoutDashboard },
  { key: "properties", label: "หอพัก", icon: Building2 },
  { key: "rooms", label: "ห้องพัก", icon: KeyRound },
  { key: "tenants", label: "ผู้เช่า", icon: Users },
  { key: "leases", label: "สัญญาเช่า", icon: CalendarRange },
  { key: "meters", label: "มิเตอร์", icon: Gauge },
  { key: "invoices", label: "ใบแจ้งหนี้", icon: FileText },
  { key: "payments", label: "รับชำระ", icon: WalletCards },
  { key: "receivables", label: "ยอดค้าง", icon: ReceiptText },
  { key: "reports", label: "รายงาน", icon: CircleDollarSign },
  { key: "settings", label: "ตั้งค่าหอพัก", icon: Settings },
  { key: "subscription", label: "แพ็กเกจและบริการ", icon: CircleDollarSign },
];
const navByKey = new Map(defaultNav.map((item) => [item.key, item]));
function isPageKey(value: string | undefined): value is PageKey { return Boolean(value && navByKey.has(value as PageKey)); }

const pageMeta: Record<PageKey, { title: string; description: string; modal?: ModalKey; button?: string }> = {
  overview: { title: "ภาพรวมกิจการ", description: "ข้อมูลจริงล่าสุดของกิจการและทุกหอพัก" },
  properties: { title: "หอพัก", description: "เพิ่มและจัดการหอพักภายใต้กิจการนี้", modal: "property", button: "เพิ่มหอพัก" },
  rooms: { title: "ห้องพัก", description: "สถานะห้องและอัตราค่าเช่า", modal: "room", button: "เพิ่มห้อง" },
  tenants: { title: "ผู้เช่า", description: "ทะเบียนผู้เช่าและข้อมูลติดต่อ", modal: "tenant", button: "เพิ่มผู้เช่า" },
  leases: { title: "สัญญาเช่า", description: "ผูกผู้เช่าเข้ากับห้องพัก", modal: "lease", button: "สร้างสัญญา" },
  meters: { title: "มิเตอร์", description: "บันทึกเลขมิเตอร์ไฟฟ้าและน้ำตามรอบเดือน", modal: "meter", button: "จดมิเตอร์" },
  invoices: { title: "ใบแจ้งหนี้", description: "ออกและติดตามใบแจ้งหนี้ค่าเช่า", modal: "invoice", button: "ออกใบแจ้งหนี้" },
  payments: { title: "รับชำระ", description: "บันทึกใบเสร็จและตัดยอดใบแจ้งหนี้", modal: "payment", button: "รับชำระเงิน" },
  receivables: { title: "ยอดค้างชำระ", description: "ใบแจ้งหนี้ที่ยังมียอดคงเหลือ" },
  reports: { title: "รายงาน", description: "สรุปรายรับ ยอดค้าง และอัตราเข้าพักจากข้อมูลจริง" },
  settings: { title: "ตั้งค่าหอพัก", description: "อัตราค่าน้ำ ค่าไฟ วันออกบิล และข้อมูลรับเงิน", modal: "settings", button: "แก้ไขการตั้งค่า" },
  subscription: { title: "แพ็กเกจและบริการ", description: "สถานะการทดลองใช้ฟรีและสิทธิ์ใช้งานของกิจการ" },
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(value);
}

function thaiDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "ใช้งาน", inactive: "ไม่ใช้งาน", vacant: "ว่าง", occupied: "มีผู้เช่า",
    maintenance: "ซ่อมบำรุง", former: "ผู้เช่าเดิม", blocked: "ระงับ", draft: "ฉบับร่าง",
    ended: "สิ้นสุด", cancelled: "ยกเลิก", issued: "รอชำระ", partial: "ชำระบางส่วน",
    paid: "ชำระแล้ว", overdue: "เกินกำหนด", void: "ยกเลิกเอกสาร", confirmed: "ยืนยันแล้ว",
    pending: "รอตรวจสอบ", trialing: "ทดลองใช้ฟรี", past_due: "เกินกำหนดชำระ", readonly: "ดูได้อย่างเดียว",
    paused: "หยุดชั่วคราว",
  };
  return labels[status] ?? status;
}

function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="real-empty"><span><Home size={28} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

export function ApartmentDashboard(props: Props) {
  const router = useRouter();
  const configuredNav = props.menuItems?.flatMap((item) => {
    if (!isPageKey(item.key)) return [];
    const fallback = navByKey.get(item.key)!;
    return [{ ...fallback, label: item.label }];
  });
  const nav = props.menuItems === undefined ? defaultNav : (configuredNav ?? []);
  const permissions = useMemo(() => new Set(props.permissionKeys ?? []), [props.permissionKeys]);
  const initialPage = isPageKey(props.initialPage) && nav.some((item) => item.key === props.initialPage) ? props.initialPage : (nav[0]?.key ?? "overview");
  const [page, setPage] = useState<PageKey>(initialPage);
  const [modal, setModal] = useState<ModalKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(props.properties[0]?.id ?? "");
  const [notice, setNotice] = useState<DashboardActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const propertyMap = useMemo(() => new Map(props.properties.map((item) => [item.id, item])), [props.properties]);
  const roomMap = useMemo(() => new Map(props.rooms.map((item) => [item.id, item])), [props.rooms]);
  const tenantMap = useMemo(() => new Map(props.tenants.map((item) => [item.id, item])), [props.tenants]);
  const meterMap = useMemo(() => new Map(props.meters.map((item) => [item.id, item])), [props.meters]);
  const activeLeases = props.leases.filter((lease) => lease.status === "active");
  const outstandingInvoices = props.invoices.filter((invoice) => Number(invoice.balance_due) > 0 && invoice.status !== "void");
  const revenue = props.payments.filter((payment) => payment.status === "confirmed").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const outstanding = outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.balance_due), 0);
  const occupancy = props.rooms.length ? Math.round((props.rooms.filter((room) => room.status === "occupied").length / props.rooms.length) * 100) : 0;
  const meta = pageMeta[page];

  function navigate(next: PageKey) {
    if (!nav.some((item) => item.key === next)) return;
    setPage(next);
    setMobileOpen(false);
    setNotice(null);
  }

  function submit(action: (formData: FormData) => Promise<DashboardActionResult>, formData: FormData) {
    formData.set("organizationId", props.organization.id);
    startTransition(async () => {
      const result = await action(formData);
      setNotice(result);
      if (result.ok) {
        setModal(null);
        router.refresh();
      }
    });
  }

  if (!nav.length) return <div className="real-app-shell">
    <aside className="real-sidebar"><div className="real-sidebar-brand"><BrandLogo /></div><form action={props.logoutAction}><button className="real-logout" type="submit"><LogOut size={18} />ออกจากระบบ</button></form></aside>
    <div className="real-main"><main className="real-content"><div className="real-alert error"><strong>บัญชีนี้ยังไม่มีสิทธิ์ใช้งาน</strong><span>กรุณาติดต่อผู้ดูแลกิจการเพื่อกำหนด Role หรือสิทธิ์รายผู้ใช้</span></div></main></div>
  </div>;

  return <div className="real-app-shell">
    <aside className={`real-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="real-sidebar-brand"><BrandLogo /></div>
      <button className="real-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X size={20} /></button>
      <nav>{nav.map((item) => <button className={page === item.key ? "active" : ""} key={item.key} onClick={() => navigate(item.key)}><item.icon size={18} /><span>{item.label}</span></button>)}</nav>
      <form action={props.logoutAction}><button className="real-logout" type="submit"><LogOut size={18} />ออกจากระบบ</button></form>
    </aside>

    <div className="real-main">
      <header className="real-topbar">
        <button className="real-menu-button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu size={21} /></button>
        <div className="real-org-switch">
          <small>กิจการปัจจุบัน</small>
          {props.organizations.length > 1
            ? <select value={props.organization.id} onChange={(event) => router.push(`/dashboard?organization=${event.target.value}`)}>{props.organizations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            : <strong>{props.organization.name}</strong>}
        </div>
        <div className="real-user"><span>{props.userName.trim().slice(0, 1)}</span><div><strong>{props.userName}</strong><small>{props.roleLabel}</small></div></div>
      </header>

      <main className="real-content">
        {props.schemaError ? <div className="real-alert error"><strong>ฐานข้อมูลระบบจริงยังไม่พร้อม</strong><span>{props.schemaError}</span></div> : null}
        {notice ? <div className={`real-alert ${notice.ok ? "success" : "error"}`}><span>{notice.message}{notice.requestId ? ` · รหัสอ้างอิง ${notice.requestId}` : ""}</span><button onClick={() => setNotice(null)} aria-label="ปิด"><X size={16} /></button></div> : null}
        <div className="real-page-header"><div><small>LONGTUA APARTMENT</small><h1>{meta.title}</h1><p>{meta.description}</p></div>{meta.modal && meta.button && (!props.permissionKeys || permissions.has(`customer_${page}:${page === "settings" ? "update" : "create"}`)) ? <button className="real-primary" onClick={() => setModal(meta.modal ?? null)}><Plus size={17} />{meta.button}</button> : null}</div>
        {page === "overview" ? <Overview properties={props.properties} rooms={props.rooms} activeLeases={activeLeases} outstanding={outstanding} revenue={revenue} occupancy={occupancy} invoices={props.invoices} onNavigate={navigate} /> : null}
        {page === "properties" ? <PropertiesTable items={props.properties} /> : null}
        {page === "rooms" ? <RoomsTable items={props.rooms} propertyMap={propertyMap} tenantMap={tenantMap} leases={activeLeases} /> : null}
        {page === "tenants" ? <TenantsTable items={props.tenants} /> : null}
        {page === "leases" ? <LeasesTable items={props.leases} roomMap={roomMap} tenantMap={tenantMap} propertyMap={propertyMap} /> : null}
        {page === "meters" ? <MetersTable readings={props.meterReadings} meterMap={meterMap} roomMap={roomMap} /> : null}
        {page === "invoices" ? <InvoicesTable items={props.invoices} roomMap={roomMap} /> : null}
        {page === "payments" ? <PaymentsTable items={props.payments} propertyMap={propertyMap} /> : null}
        {page === "receivables" ? <InvoicesTable items={outstandingInvoices} roomMap={roomMap} /> : null}
        {page === "reports" ? <Reports revenue={revenue} outstanding={outstanding} occupancy={occupancy} invoiceCount={props.invoices.length} /> : null}
        {page === "settings" ? <SettingsTable properties={props.properties} settings={props.settings} /> : null}
        {page === "subscription" ? <SubscriptionCard subscription={props.subscription} /> : null}
      </main>
    </div>

    {modal ? <Modal title={pageMeta[page].button ?? pageMeta[page].title} onClose={() => setModal(null)} pending={pending}>
      <ActionForm modal={modal} props={props} selectedPropertyId={selectedPropertyId} setSelectedPropertyId={setSelectedPropertyId} submit={submit} />
    </Modal> : null}
  </div>;
}

function Overview({ properties, rooms, activeLeases, outstanding, revenue, occupancy, invoices, onNavigate }: { properties: Property[]; rooms: Room[]; activeLeases: Lease[]; outstanding: number; revenue: number; occupancy: number; invoices: Invoice[]; onNavigate: (page: PageKey) => void }) {
  if (!properties.length) return <Empty title="เริ่มต้นด้วยการเพิ่มหอพัก" detail="ระบบจริงจะไม่สร้างข้อมูลตัวอย่างให้ คุณเป็นผู้กำหนดข้อมูลแรกของกิจการ" action={<button className="real-primary" onClick={() => onNavigate("properties")}><ChevronRight size={17} />ไปหน้าหอพัก</button>} />;
  const cards = [
    ["หอพัก", `${properties.length} แห่ง`, Building2], ["ห้องพัก", `${rooms.length} ห้อง`, KeyRound],
    ["สัญญาใช้งาน", `${activeLeases.length} ฉบับ`, CalendarRange], ["อัตราเข้าพัก", `${occupancy}%`, Home],
    ["รับชำระสะสม", money(revenue), WalletCards], ["ยอดค้าง", money(outstanding), ReceiptText],
  ] as const;
  return <><section className="real-stat-grid">{cards.map(([label, value, Icon]) => <article key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section><section className="real-panel"><div className="real-panel-title"><div><h2>ใบแจ้งหนี้ล่าสุด</h2><p>แสดงจากฐานข้อมูลจริง</p></div><button onClick={() => onNavigate("invoices")}>ดูทั้งหมด <ChevronRight size={16} /></button></div><InvoicesTable items={invoices.slice(0, 5)} roomMap={new Map(rooms.map((room) => [room.id, room]))} compact /></section></>;
}

function Table({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <Empty title="ยังไม่มีข้อมูล" detail={empty} />;
  return <div className="real-table-wrap"><table className="real-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Badge({ status }: { status: string }) { return <span className={`real-badge ${status}`}>{statusLabel(status)}</span>; }
function PropertiesTable({ items }: { items: Property[] }) { return <Table headers={["ชื่อหอพัก", "ที่อยู่", "โทรศัพท์", "สถานะ"]} rows={items.map((item) => [item.name, item.address || "—", item.phone || "—", <Badge status={item.status} key="s" />])} empty="กด “เพิ่มหอพัก” เพื่อสร้างหอแรก" />; }
function TenantsTable({ items }: { items: Tenant[] }) { return <Table headers={["ชื่อผู้เช่า", "โทรศัพท์", "อีเมล", "บัตรประชาชน", "สถานะ"]} rows={items.map((item) => [item.full_name, item.phone || "—", item.email || "—", item.id_card_last4 ? `•••• ${item.id_card_last4}` : "ไม่ได้เก็บ", <Badge status={item.status} key="s" />])} empty="เพิ่มผู้เช่าก่อนสร้างสัญญาเช่า" />; }
function RoomsTable({ items, propertyMap, tenantMap, leases }: { items: Room[]; propertyMap: Map<string, Property>; tenantMap: Map<string, Tenant>; leases: Lease[] }) { const leaseByRoom = new Map(leases.map((item) => [item.room_id, item])); return <Table headers={["หอพัก", "ห้อง", "ชั้น", "ผู้เช่า", "ค่าเช่า", "สถานะ"]} rows={items.map((item) => { const lease = leaseByRoom.get(item.id); return [propertyMap.get(item.property_id)?.name ?? "—", item.room_number, item.floor || "—", lease ? tenantMap.get(lease.primary_tenant_id)?.full_name ?? "—" : "—", money(Number(item.base_rent)), <Badge status={item.status} key="s" />]; })} empty="เพิ่มหอพักก่อน แล้วจึงเพิ่มห้อง" />; }
function LeasesTable({ items, roomMap, tenantMap, propertyMap }: { items: Lease[]; roomMap: Map<string, Room>; tenantMap: Map<string, Tenant>; propertyMap: Map<string, Property> }) { return <Table headers={["เลขที่สัญญา", "หอ/ห้อง", "ผู้เช่า", "ระยะเวลา", "ค่าเช่า", "สถานะ"]} rows={items.map((item) => { const room = roomMap.get(item.room_id); return [item.lease_number, `${propertyMap.get(item.property_id)?.name ?? "—"} / ${room?.room_number ?? "—"}`, tenantMap.get(item.primary_tenant_id)?.full_name ?? "—", `${thaiDate(item.start_date)} – ${thaiDate(item.end_date)}`, money(Number(item.rent_amount)), <Badge status={item.status} key="s" />]; })} empty="สร้างห้องและผู้เช่าก่อนทำสัญญา" />; }
function MetersTable({ readings, meterMap, roomMap }: { readings: MeterReading[]; meterMap: Map<string, Meter>; roomMap: Map<string, Room> }) { return <Table headers={["ห้อง", "ประเภท", "เลขล่าสุด", "หน่วยที่ใช้", "วันที่จด"]} rows={readings.map((item) => { const meter = meterMap.get(item.meter_id); return [roomMap.get(meter?.room_id ?? "")?.room_number ?? "—", meter?.meter_type === "electric" ? "ไฟฟ้า" : "น้ำ", Number(item.current_value).toLocaleString("th-TH"), Number(item.usage_value).toLocaleString("th-TH"), thaiDate(item.read_at)]; })} empty="กด “จดมิเตอร์” เพื่อบันทึกรอบแรก" />; }
function InvoicesTable({ items, roomMap, compact = false }: { items: Invoice[]; roomMap: Map<string, Room>; compact?: boolean }) { const rows = items.map((item) => [item.invoice_number, roomMap.get(item.room_id)?.room_number ?? "—", thaiDate(item.issued_at), thaiDate(item.due_at), money(Number(item.total)), money(Number(item.balance_due)), <Badge status={item.status} key="s" />]); return <Table headers={compact ? ["เลขที่", "ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ"] : ["เลขที่ใบแจ้งหนี้", "ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ"]} rows={rows} empty="ยังไม่มีใบแจ้งหนี้ในระบบจริง" />; }
function PaymentsTable({ items, propertyMap }: { items: Payment[]; propertyMap: Map<string, Property> }) { return <Table headers={["เลขที่ใบเสร็จ", "หอพัก", "วันที่รับ", "ยอดเงิน", "ช่องทาง", "อ้างอิง", "สถานะ"]} rows={items.map((item) => [item.receipt_number, propertyMap.get(item.property_id)?.name ?? "—", thaiDate(item.paid_at), money(Number(item.amount)), statusLabel(item.method), item.reference || "—", <Badge status={item.status} key="s" />])} empty="เมื่อรับชำระจากใบแจ้งหนี้ รายการจะปรากฏที่นี่" />; }
function SettingsTable({ properties, settings }: { properties: Property[]; settings: PropertySettings[] }) { const settingsMap = new Map(settings.map((item) => [item.property_id, item])); return <Table headers={["หอพัก", "ค่าไฟ/หน่วย", "ค่าน้ำ/หน่วย", "วันออกบิล", "ครบกำหนด", "PromptPay"]} rows={properties.map((property) => { const item = settingsMap.get(property.id); return [property.name, money(Number(item?.electric_rate ?? 0)), money(Number(item?.water_rate ?? 0)), item?.bill_day ?? "—", item?.due_day ?? "—", item?.promptpay_id ?? "—"]; })} empty="เพิ่มหอพักเพื่อกำหนดอัตราค่าบริการ" />; }
function Reports({ revenue, outstanding, occupancy, invoiceCount }: { revenue: number; outstanding: number; occupancy: number; invoiceCount: number }) { return <section className="real-report-grid"><article><small>รายรับสะสม</small><strong>{money(revenue)}</strong><p>จากรายการรับชำระที่ยืนยันแล้ว</p></article><article><small>ยอดค้างปัจจุบัน</small><strong>{money(outstanding)}</strong><p>จากใบแจ้งหนี้ที่ยังไม่ปิดยอด</p></article><article><small>อัตราเข้าพัก</small><strong>{occupancy}%</strong><p>คำนวณจากสถานะห้องทั้งหมด</p></article><article><small>ใบแจ้งหนี้ทั้งหมด</small><strong>{invoiceCount.toLocaleString("th-TH")}</strong><p>รวมทุกสถานะเอกสาร</p></article></section>; }
function SubscriptionCard({ subscription }: { subscription: Props["subscription"] }) { return <section className="real-subscription-card"><span><CircleDollarSign size={24} /></span><div><small>สถานะปัจจุบัน</small><h2>{statusLabel(subscription.status)}</h2><p>{subscription.trial_ends_at ? `ทดลองใช้ฟรีถึง ${thaiDate(subscription.trial_ends_at)}` : "ระบบยังไม่ได้กำหนดวันสิ้นสุด Trial"}</p></div></section>; }

function Modal({ title, children, onClose, pending }: { title: string; children: React.ReactNode; onClose: () => void; pending: boolean }) { return <div className="real-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}><section className="real-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} disabled={pending} aria-label="ปิด"><X size={20} /></button></header>{children}</section></div>; }

function FormShell({ children, onSubmit, pending }: { children: React.ReactNode; onSubmit: (formData: FormData) => void; pending: boolean }) { return <form className="real-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>{children}<button className="real-primary real-submit" disabled={pending} type="submit">{pending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button></form>; }
function Field({ label, name, type = "text", required = false, defaultValue, min, step, children }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string | number; min?: string | number; step?: string; children?: React.ReactNode }) { return <label><span>{label}{required ? " *" : ""}</span>{children ?? <input name={name} type={type} required={required} defaultValue={defaultValue} min={min} step={step} />}</label>; }
function PropertySelect({ properties, value, onChange }: { properties: Property[]; value?: string; onChange?: (value: string) => void }) { return <select name="propertyId" required value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined}><option value="">เลือกหอพัก</option>{properties.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>; }

function ActionForm({ modal, props, selectedPropertyId, setSelectedPropertyId, submit }: { modal: Exclude<ModalKey, null>; props: Props; selectedPropertyId: string; setSelectedPropertyId: (id: string) => void; submit: (action: (formData: FormData) => Promise<DashboardActionResult>, formData: FormData) => void }) {
  const propertyRooms = props.rooms.filter((room) => !selectedPropertyId || room.property_id === selectedPropertyId);
  const activeLeases = props.leases.filter((lease) => lease.status === "active" && (!selectedPropertyId || lease.property_id === selectedPropertyId));
  const openInvoices = props.invoices.filter((invoice) => Number(invoice.balance_due) > 0 && invoice.status !== "void");
  const selectedSettings = props.settings.find((item) => item.property_id === selectedPropertyId);
  const month = new Date().toISOString().slice(0, 7);
  const date = new Date().toISOString().slice(0, 10);
  const invoiceCode = `INV-${month.replace("-", "")}-${String(props.invoices.length + 1).padStart(4, "0")}`;
  const receiptCode = `REC-${month.replace("-", "")}-${String(props.payments.length + 1).padStart(4, "0")}`;

  if (modal === "property") return <FormShell pending={false} onSubmit={(data) => submit(createPropertyAction, data)}><Field label="ชื่อหอพัก" name="name" required /><Field label="ที่อยู่" name="address" /><Field label="โทรศัพท์" name="phone" /></FormShell>;
  if (modal === "tenant") return <FormShell pending={false} onSubmit={(data) => submit(createTenantAction, data)}><Field label="ชื่อ-นามสกุล" name="fullName" required /><div className="real-form-grid"><Field label="โทรศัพท์" name="phone" /><Field label="อีเมล (ถ้ามี)" name="email" type="email" /></div><Field label="เลขบัตรประชาชน 4 ตัวท้าย" name="idCardLast4" /><Field label="ที่อยู่" name="address" /></FormShell>;
  if (modal === "room") return <FormShell pending={false} onSubmit={(data) => submit(createRoomAction, data)}><Field label="หอพัก" name="propertyId" required><PropertySelect properties={props.properties} value={selectedPropertyId} onChange={setSelectedPropertyId} /></Field><div className="real-form-grid"><Field label="หมายเลขห้อง" name="roomNumber" required /><Field label="ชั้น" name="floor" /></div><Field label="ค่าเช่าต่อเดือน" name="baseRent" type="number" min={0} step="0.01" required /></FormShell>;
  if (modal === "lease") return <FormShell pending={false} onSubmit={(data) => submit(createLeaseAction, data)}><Field label="หอพัก" name="propertyId" required><PropertySelect properties={props.properties} value={selectedPropertyId} onChange={setSelectedPropertyId} /></Field><div className="real-form-grid"><Field label="ห้องพัก" name="roomId" required><select name="roomId" required defaultValue=""><option value="">เลือกห้อง</option>{propertyRooms.filter((room) => room.status === "vacant").map((room) => <option value={room.id} key={room.id}>{room.room_number}</option>)}</select></Field><Field label="ผู้เช่า" name="tenantId" required><select name="tenantId" required defaultValue=""><option value="">เลือกผู้เช่า</option>{props.tenants.filter((tenant) => tenant.status === "active").map((tenant) => <option value={tenant.id} key={tenant.id}>{tenant.full_name}</option>)}</select></Field></div><Field label="เลขที่สัญญา" name="leaseNumber" required /><div className="real-form-grid"><Field label="วันเริ่มสัญญา" name="startDate" type="date" required /><Field label="วันสิ้นสุด" name="endDate" type="date" /></div><div className="real-form-grid"><Field label="ค่าเช่า" name="rentAmount" type="number" min={0} step="0.01" required /><Field label="เงินประกัน" name="depositAmount" type="number" min={0} step="0.01" defaultValue={0} /></div><Field label="ค่าเช่าล่วงหน้า" name="advanceAmount" type="number" min={0} step="0.01" defaultValue={0} /><Field label="เงื่อนไขเพิ่มเติม" name="terms" /></FormShell>;
  if (modal === "meter") return <FormShell pending={false} onSubmit={(data) => submit(saveMeterReadingAction, data)}><Field label="หอพัก" name="propertyId" required><PropertySelect properties={props.properties} value={selectedPropertyId} onChange={setSelectedPropertyId} /></Field><div className="real-form-grid"><Field label="ห้องพัก" name="roomId" required><select name="roomId" required defaultValue=""><option value="">เลือกห้อง</option>{propertyRooms.map((room) => <option value={room.id} key={room.id}>{room.room_number}</option>)}</select></Field><Field label="ประเภท" name="meterType" required><select name="meterType" defaultValue="electric"><option value="electric">ไฟฟ้า</option><option value="water">น้ำ</option></select></Field></div><Field label="รอบเดือน" name="periodMonth" type="month" defaultValue={month} required /><div className="real-form-grid"><Field label="เลขครั้งก่อน" name="previousValue" type="number" min={0} step="0.01" required /><Field label="เลขครั้งนี้" name="currentValue" type="number" min={0} step="0.01" required /></div></FormShell>;
  if (modal === "invoice") return <FormShell pending={false} onSubmit={(data) => submit(createInvoiceAction, data)}><Field label="หอพัก" name="propertyId" required><PropertySelect properties={props.properties} value={selectedPropertyId} onChange={setSelectedPropertyId} /></Field><Field label="สัญญา/ห้อง" name="leaseId" required><select name="leaseId" required defaultValue="" onChange={(event) => { const lease = activeLeases.find((item) => item.id === event.target.value); const roomInput = event.currentTarget.form?.elements.namedItem("roomId") as HTMLInputElement | null; const totalInput = event.currentTarget.form?.elements.namedItem("total") as HTMLInputElement | null; if (roomInput && lease) roomInput.value = lease.room_id; if (totalInput && lease) totalInput.value = String(lease.rent_amount); }}><option value="">เลือกสัญญา</option>{activeLeases.map((lease) => <option value={lease.id} key={lease.id}>{roomMapLabel(props.rooms, lease.room_id)} · {props.tenants.find((tenant) => tenant.id === lease.primary_tenant_id)?.full_name}</option>)}</select></Field><input type="hidden" name="roomId" /><div className="real-form-grid"><Field label="เลขที่ใบแจ้งหนี้" name="invoiceNumber" defaultValue={invoiceCode} required /><Field label="วันครบกำหนด" name="dueAt" type="date" defaultValue={date} required /></div><Field label="ยอดรวม" name="total" type="number" min={0} step="0.01" required /><Field label="รายละเอียด" name="description" defaultValue="ค่าเช่าห้องพัก" /><Field label="หมายเหตุ" name="note" /></FormShell>;
  if (modal === "payment") return <FormShell pending={false} onSubmit={(data) => submit(recordPaymentAction, data)}><Field label="ใบแจ้งหนี้" name="invoiceId" required><select name="invoiceId" required defaultValue="" onChange={(event) => { const invoice = openInvoices.find((item) => item.id === event.target.value); const amountInput = event.currentTarget.form?.elements.namedItem("amount") as HTMLInputElement | null; if (amountInput && invoice) amountInput.value = String(invoice.balance_due); }}><option value="">เลือกใบแจ้งหนี้</option>{openInvoices.map((invoice) => <option value={invoice.id} key={invoice.id}>{invoice.invoice_number} · คงเหลือ {money(Number(invoice.balance_due))}</option>)}</select></Field><div className="real-form-grid"><Field label="เลขที่ใบเสร็จ" name="receiptNumber" defaultValue={receiptCode} required /><Field label="ยอดรับชำระ" name="amount" type="number" min="0.01" step="0.01" required /></div><Field label="ช่องทาง" name="method" required><select name="method" defaultValue="transfer"><option value="cash">เงินสด</option><option value="transfer">โอนธนาคาร</option><option value="promptpay">PromptPay</option><option value="card">บัตร</option><option value="other">อื่น ๆ</option></select></Field><Field label="เลขอ้างอิง" name="reference" /></FormShell>;
  return <FormShell pending={false} onSubmit={(data) => submit(updatePropertySettingsAction, data)}><Field label="หอพัก" name="propertyId" required><PropertySelect properties={props.properties} value={selectedPropertyId} onChange={setSelectedPropertyId} /></Field><div className="real-form-grid"><Field label="ค่าไฟ/หน่วย" name="electricRate" type="number" min={0} step="0.01" defaultValue={selectedSettings?.electric_rate ?? 8} required /><Field label="ค่าน้ำ/หน่วย" name="waterRate" type="number" min={0} step="0.01" defaultValue={selectedSettings?.water_rate ?? 100} required /></div><div className="real-form-grid"><Field label="วันออกบิล" name="billDay" type="number" min={1} defaultValue={selectedSettings?.bill_day ?? 1} required /><Field label="วันครบกำหนด" name="dueDay" type="number" min={1} defaultValue={selectedSettings?.due_day ?? 5} required /></div><Field label="ค่าปรับล่าช้า" name="lateFee" type="number" min={0} step="0.01" defaultValue={selectedSettings?.late_fee ?? 0} required /><Field label="PromptPay" name="promptpayId" defaultValue={selectedSettings?.promptpay_id ?? ""} /><Field label="ชื่อบัญชี" name="accountName" defaultValue={selectedSettings?.account_name ?? ""} /><Field label="หมายเหตุท้ายบิล" name="invoiceNote" defaultValue={selectedSettings?.invoice_note ?? ""} /></FormShell>;
}

function roomMapLabel(rooms: Room[], roomId: string) { return `ห้อง ${rooms.find((room) => room.id === roomId)?.room_number ?? "—"}`; }
