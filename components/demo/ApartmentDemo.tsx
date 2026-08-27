"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Activity,
  Hotel,
  Bell,
  BookOpenCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
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

const navGroups: NavGroup[] = [
  { label: "ภาพรวม", items: [{ code: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard }] },
  { label: "จัดการลูกค้า", items: [
    { code: "companies", label: "กิจการ", icon: Building2 },
    { code: "properties", label: "หอพัก", icon: Hotel },
    { code: "users", label: "ผู้ใช้งาน", icon: Users },
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
    { code: "roles", label: "Role", icon: ShieldCheck },
    { code: "permissions", label: "กำหนดสิทธิ์", icon: SlidersHorizontal },
    { code: "menus", label: "จัดการเมนู", icon: Menu },
    { code: "subscriptions", label: "แพ็กเกจและบริการ", icon: CircleDollarSign },
    { code: "audit", label: "Audit Log", icon: Activity },
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
    allowed: ["dashboard", "properties", "users", "rooms", "tenants", "contracts", "meters", "invoices", "payments", "receivables", "reports", "line", "roles", "permissions", "subscriptions", "audit", "settings"],
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
}: {
  showDemoControls?: boolean;
}) {
  const [role, setRole] = useState<RoleKey>("owner");
  const [subscription, setSubscription] = useState<SubscriptionState>("trialing");
  const [lineEnabled, setLineEnabled] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const companyCollection = useDemoCollection(companies, showToast);

  const currentRole = roleInfo[role];
  const visibleGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => currentRole.allowed.includes(item.code)) }))
    .filter((group) => group.items.length > 0), [currentRole]);
  const isLocked = role !== "super_admin" && subscription === "expired";

  function changeRole(nextRole: RoleKey) {
    if (nextRole === "super_admin") return;
    setRole(nextRole);
    setActivePage("dashboard");
    setSubscription("trialing");
  }

  function navigate(page: PageKey) {
    setActivePage(page);
    setIsMobileOpen(false);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
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

        {role !== "super_admin" ? <button className="context-selector" type="button">
          <span className="context-icon"><Building2 size={18} /></span>
          <span><small>กิจการ / หอพักปัจจุบัน</small><strong>สมชายแมนชั่น</strong></span>
          <ChevronDown size={16} />
        </button> : null}

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
          <span className="avatar">{currentRole.initials}</span>
          <span><strong>{currentRole.name}</strong><small>{currentRole.label}</small></span>
          <MoreHorizontal size={18} />
        </div>
      </aside>

      {isMobileOpen ? <button className="sidebar-backdrop" aria-label="ปิดเมนู" onClick={() => setIsMobileOpen(false)} /> : null}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="เปิดเมนู" onClick={() => setIsMobileOpen(true)}><Menu size={21} /></button>
          <label className="global-search"><Search size={18} /><input placeholder="ค้นหากิจการ หอพัก ผู้เช่า หรือเอกสาร..." /></label>
          {showDemoControls ? <div className="demo-controls">
            <label><span>มุมมอง Demo</span><select value={role} onChange={(event) => changeRole(event.target.value as RoleKey)}>
              <option value="owner">เจ้าของกิจการ</option><option value="accounting">ฝ่ายบัญชี</option><option value="staff">พนักงาน</option>
            </select></label>
            {role !== "super_admin" ? <label><span>สถานะบริการ</span><select value={subscription} onChange={(event) => setSubscription(event.target.value as SubscriptionState)}>
              <option value="trialing">ทดลองใช้งาน</option><option value="active">ชำระแล้ว</option><option value="expired">หมดอายุ</option>
            </select></label> : null}
          </div> : null}
          <button className="icon-button notification" aria-label="การแจ้งเตือน"><Bell size={19} /><i /></button>
          <span className="top-avatar">{currentRole.initials}</span>
        </header>

        <main className="content">
          {role !== "super_admin" && subscription === "trialing" ? (
            <div className="trial-banner"><span><Zap size={18} /><strong>ทดลองใช้ฟรีเหลือ 12 วัน</strong><small>ใช้งานได้ถึง 7 กันยายน 2569</small></span><button onClick={() => navigate("subscriptions")}>ดูแพ็กเกจ <ChevronRight size={16} /></button></div>
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
          />
        </main>
      </div>

      {isPanelOpen ? <CompanyPanel onClose={() => setIsPanelOpen(false)} onSave={(company) => {
        if (!companyCollection.addItem(company)) return;
        setIsPanelOpen(false);
        showToast("เพิ่มกิจการตัวอย่างเรียบร้อยแล้ว");
      }} /> : null}
      {toast ? <div className="toast"><span><ShieldCheck size={18} /></span>{toast}</div> : null}
    </div>
  );
}

type PageContentProps = {
  activePage: PageKey; role: RoleKey; isLocked: boolean; lineEnabled: boolean;
  onLineChange: (value: boolean) => void; onOpenPanel: () => void;
  onNavigate: (page: PageKey) => void; onToast: (message: string) => void;
  companies: Company[]; onDeleteCompany: (index: number) => void;
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
  return <GenericPage key={props.activePage} {...props} />;
}

function DashboardPage({ role, isLocked, onOpenPanel, onNavigate }: PageContentProps) {
  const admin = role === "super_admin";
  return (
    <>
      <PageHeader eyebrow={admin ? "ภาพรวมแพลตฟอร์ม" : "สมชายแมนชั่น"} title={admin ? "แดชบอร์ด" : "สวัสดีครับ คุณสมชาย"} description={admin ? "ติดตามลูกค้า การใช้งาน และสถานะบริการทั้งหมด" : "ภาพรวมสิ่งที่ต้องจัดการในวันนี้"}>
        {admin ? <button className="button primary" onClick={onOpenPanel}><Plus size={17} /> เพิ่มกิจการ</button> : <button className="button primary" disabled={isLocked} onClick={() => onNavigate("payments")}><Plus size={17} /> รับชำระ</button>}
      </PageHeader>
      {admin ? <AdminDashboard onNavigate={onNavigate} /> : <CustomerDashboard isLocked={isLocked} onNavigate={onNavigate} />}
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

function CustomerDashboard({ isLocked, onNavigate }: { isLocked: boolean; onNavigate: (page: PageKey) => void }) {
  return (
    <>
      <section className="metric-grid">
        <Metric label="ห้องทั้งหมด" value="60" delta="3 อาคาร" icon={KeyRound} tone="blue" />
        <Metric label="มีผู้เช่า" value="52" delta="Occupancy 86.7%" icon={Users} tone="green" />
        <Metric label="ยอดรับเดือนนี้" value="฿185,400" delta="จาก ฿210,540" icon={WalletCards} tone="violet" />
        <Metric label="ยอดค้างชำระ" value="฿25,140" delta="7 ห้อง" icon={ReceiptText} tone="orange" />
      </section>
      <section className="dashboard-grid">
        <div className="panel task-panel">
          <PanelHeading title="งานที่ต้องทำ" description="กดเพื่อไปจัดการรายการต่อได้ทันที" />
          {[["ต้องอ่านมิเตอร์", "8 ห้อง", "meters"], ["ยังไม่ออกบิล", "3 ห้อง", "invoices"], ["ครบกำหนดวันนี้", "5 บิล", "receivables"], ["สัญญาใกล้หมด", "4 ฉบับ", "contracts"]].map(([label, count, page]) => (
            <button disabled={isLocked} key={label} onClick={() => onNavigate(page as PageKey)}><span>{label}</span><strong>{count}</strong><ChevronRight size={17} /></button>
          ))}
        </div>
        <div className="panel occupancy-panel">
          <PanelHeading title="สถานะห้อง" description="สมชายแมนชั่น · ทุกอาคาร" />
          <div className="occupancy-number"><strong>86.7%</strong><span>อัตราเข้าพัก</span></div>
          <div className="room-summary"><span><i className="green" />มีผู้เช่า <strong>52</strong></span><span><i className="gray" />ว่าง <strong>6</strong></span><span><i className="red" />ปิดซ่อม <strong>2</strong></span></div>
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
      <section className="panel table-panel"><div className="list-summary"><span>รายการใน Demo <strong>{companyItems.length} กิจการ</strong></span><span>ข้อมูลจะรีเซ็ตเมื่อรีเฟรชหน้า</span></div><CompanyTable rows={companyItems} onDelete={onDeleteCompany} /></section>
    </>
  );
}

function PropertiesPage({ role, isLocked, onToast }: PageContentProps) {
  const initialRows = [
    ["สมชายแมนชั่น", "บริษัท สมชายอพาร์ทเมนท์", "40", "34", "หาดใหญ่, สงขลา", "เปิดใช้งาน"],
    ["บ้านสวน เรสซิเดนซ์", "บ้านสวนหอพัก", "64", "58", "เมือง, เชียงใหม่", "เปิดใช้งาน"],
    ["สุขใจเพลส", "สุขใจเรสซิเดนซ์", "28", "19", "บางนา, กรุงเทพฯ", "ทดลองใช้"],
    ["เดอะเนสท์ อาคาร A", "เดอะเนสท์ อพาร์ตเมนต์", "80", "76", "ศรีราชา, ชลบุรี", "เปิดใช้งาน"],
  ];
  const collection = useDemoCollection(initialRows, onToast);
  return <><PageHeader eyebrow="จัดการลูกค้า" title="หอพัก" description={role === "super_admin" ? "หอพักทั้งหมดในระบบและกิจการที่เป็นเจ้าของ" : "หอพักภายในกิจการของคุณ"}><button disabled={isLocked} className="button primary" onClick={() => collection.addItem([`หอพัก Demo ${collection.items.length + 1}`, "กิจการตัวอย่าง", "20", "0", "กรุงเทพฯ", "ทดลองใช้"])}><Plus size={17} /> เพิ่มหอพัก</button></PageHeader><FilterBar placeholder="ค้นหาชื่อหอพัก รหัส หรือจังหวัด" filters={role === "super_admin" ? [{ label: "ทุกกิจการ", options: ["สมชายอพาร์ทเมนท์", "บ้านสวนหอพัก", "สุขใจเรสซิเดนซ์"] }, { label: "ทุกสถานะ", options: ["เปิดใช้งาน", "ทดลองใช้", "ระงับ"] }] : []} /><SimpleTable headers={["หอพัก", "กิจการ", "ห้องทั้งหมด", "มีผู้เช่า", "ที่ตั้ง", "สถานะ"]} rows={collection.items} onDelete={collection.removeItem} disableDelete={isLocked} /></>;
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

function RoomsPage({ isLocked, onToast }: PageContentProps) {
  const initialRooms = Array.from({ length: 16 }, (_, index) => ({ number: `${Math.floor(index / 8) + 1}${String(index % 8 + 1).padStart(2, "0")}`, status: index % 7 === 3 ? "maintenance" : index % 5 === 1 ? "vacant" : "occupied", tenant: index % 5 === 1 ? "พร้อมรับผู้เช่า" : index % 7 === 3 ? "กำลังซ่อม" : ["สมชาย ใจดี", "อารยา พรดี", "ธนกร แสงงาม"][index % 3] }));
  const collection = useDemoCollection(initialRooms, onToast);
  return <><PageHeader eyebrow="จัดการหอพัก" title="ห้องพัก" description="สมชายแมนชั่น · แสดงห้องแยกตามชั้น"><button disabled={isLocked} className="button primary" onClick={() => collection.addItem({ number: `D${String(collection.items.length + 1).padStart(2, "0")}`, status: "vacant", tenant: "พร้อมรับผู้เช่า" })}><Plus size={17} /> เพิ่มห้อง</button></PageHeader><FilterBar placeholder="ค้นหาเลขห้องหรือชื่อผู้เช่า" /><section className="room-grid">{collection.items.map((room, index) => <article className={`room-card ${room.status}`} key={room.number}><span><strong>{room.number}</strong><i /></span><small>{room.tenant}</small><em>{room.status === "occupied" ? "มีผู้เช่า" : room.status === "vacant" ? "ว่าง" : "ปิดซ่อม"}</em><button className="room-delete" type="button" disabled={isLocked} aria-label={`ลบห้อง ${room.number}`} onClick={() => collection.removeItem(index)}><Trash2 size={14} /> ลบ</button></article>)}</section></>;
}

function AuditPage() {
  const rows = [["แก้ไข Permission", "พงศกร · Super Admin", "Role ฝ่ายบัญชี", "วันนี้ 15:10"], ["เปิด LINE Add-on", "พงศกร · Super Admin", "บริษัท สมชายอพาร์ทเมนท์", "วันนี้ 14:42"], ["เพิ่มผู้ใช้งาน", "สมชาย ใจดี", "account@somchai.com", "วันนี้ 11:18"], ["ต่อ Trial", "พงศกร · Super Admin", "สุขใจเรสซิเดนซ์ +7 วัน", "เมื่อวาน 16:05"]];
  return <><PageHeader eyebrow="ความปลอดภัย" title="Audit Log" description="ประวัติการเปลี่ยนแปลงข้อมูล สิทธิ์ และบริการสำคัญ" /><FilterBar placeholder="ค้นหาผู้กระทำหรือรายการ" /><SimpleTable headers={["การกระทำ", "ผู้ดำเนินการ", "รายละเอียด", "เวลา"]} rows={rows} /></>;
}

function GenericPage({ activePage, isLocked, onToast }: PageContentProps) {
  const labels: Record<string, [string, string]> = {
    tenants: ["ผู้เช่า", "จัดการข้อมูลผู้เช่าและประวัติการเข้าพัก"], contracts: ["สัญญาเช่า", "สัญญาปัจจุบันและสัญญาที่ใกล้หมด"], meters: ["มิเตอร์", "บันทึกมิเตอร์น้ำและไฟประจำรอบบิล"], invoices: ["ใบแจ้งหนี้", "สร้าง ตรวจสอบ และติดตามสถานะใบแจ้งหนี้"], payments: ["รับชำระ", "บันทึกการรับเงินและออกใบเสร็จ"], receivables: ["ยอดค้าง", "ติดตามยอดค้างชำระแยกตามช่วงเวลา"], reports: ["รายงาน", "สรุปข้อมูลการเงิน ผู้เช่า และอัตราเข้าพัก"], menus: ["จัดการเมนู", "กำหนดชื่อ ลำดับ และ Permission ที่ใช้แสดงเมนู"], settings: ["ตั้งค่าระบบ", "ข้อมูลกิจการ เอกสาร และค่าตั้งต้นของระบบ"],
  };
  const [title, description] = labels[activePage] ?? ["หน้าระบบ", "จัดการข้อมูลภายในระบบ"];
  const collection = useDemoCollection([["รายการตัวอย่าง 001", "สมชายแมนชั่น", "วันนี้", "พร้อมดำเนินการ"], ["รายการตัวอย่าง 002", "บ้านสวน เรสซิเดนซ์", "เมื่อวาน", "กำลังตรวจสอบ"], ["รายการตัวอย่าง 003", "สุขใจเพลส", "24 ส.ค. 2569", "เรียบร้อย"]], onToast);
  return <><PageHeader eyebrow="ระบบหอพัก" title={title} description={description}><button disabled={isLocked} className="button primary" onClick={() => collection.addItem([`${title} Demo ${String(collection.items.length + 1).padStart(3, "0")}`, "สมชายแมนชั่น", "วันนี้", "รายการใหม่"])}><Plus size={17} /> เพิ่มรายการ</button></PageHeader><FilterBar placeholder={`ค้นหา${title}`} /><SimpleTable headers={["รายการ", "หอพัก", "วันที่", "สถานะ"]} rows={collection.items} onDelete={collection.removeItem} disableDelete={isLocked} /></>;
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

function FilterBar({ placeholder, filters = [] }: { placeholder: string; filters?: Array<{ label: string; options: string[] }> }) {
  return <div className="filter-bar"><label><Search size={17} /><input placeholder={placeholder} /></label>{filters.map((filter) => <select aria-label={filter.label} defaultValue="" key={filter.label}><option value="">{filter.label}</option>{filter.options.map((option) => <option key={option}>{option}</option>)}</select>)}<button className="button secondary"><SlidersHorizontal size={16} /> ตัวกรอง</button></div>;
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
