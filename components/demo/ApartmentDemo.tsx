"use client";
import { Swal } from "@/lib/sweetalert";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, LockKeyhole, LogOut, Menu, RotateCcw, Search, X, Zap } from "lucide-react";
import { AddPropertyWizard } from "./modals/AddPropertyWizard";
import { CompanyPanel } from "./modals/CompanyPanel";
import { ContractFormModal } from "./modals/ContractFormModal";
import { ContractModal } from "./modals/ContractModal";
import { InvoiceModal } from "./modals/InvoiceModal";
import {
  DEMO_STORAGE_KEY,
  INITIAL_PROPERTIES,
  companies,
  navGroups,
  roleInfo,
} from "./mock-data";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuditPage } from "./pages/AuditPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { ContractsPage } from "./pages/ContractsPage";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { InvoicesPage } from "./pages/InvoicesPage";
import { LinePage } from "./pages/LinePage";
import { MenusPage } from "./pages/MenusPage";
import { MetersPage } from "./pages/MetersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { ReceivablesPage } from "./pages/ReceivablesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RolesPage } from "./pages/RolesPage";
import { RoomsPage } from "./pages/RoomsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { TenantsPage } from "./pages/TenantsPage";
import { UsersPage } from "./pages/UsersPage";
import type {
  AppSettings,
  ContractRecord,
  PageContentProps,
  PageKey,
  Property,
  RoleKey,
  RoomRecord,
  SubscriptionState,
} from "./types";
import { PageHeader } from "./ui/PageHeader";
import { useDemoCollection } from "./utils";

function PageContent(props: PageContentProps) {
  if (props.activePage === "dashboard") {
    if (props.role === "super_admin") {
      return (
        <>
          <PageHeader
            actionLabel="เพิ่มกิจการ"
            description="ติดตามลูกค้า การใช้งาน และสถานะบริการทั้งหมด"
            onAction={props.onOpenPanel}
            title="แดชบอร์ด"
          />
          <AdminDashboard onNavigate={props.onNavigate} />
        </>
      );
    }
    return (
      <CustomerDashboard
        onNavigate={props.onNavigate}
        properties={props.properties}
        contracts={props.contracts}
      />
    );
  }
  if (props.activePage === "companies") return <CompaniesPage {...props} />;
  if (props.activePage === "properties") return <PropertiesPage {...props} />;
  if (props.activePage === "users") return <UsersPage {...props} />;
  if (props.activePage === "roles") return <RolesPage {...props} />;
  if (props.activePage === "permissions") return <PermissionsPage {...props} />;
  if (props.activePage === "subscriptions")
    return <SubscriptionsPage {...props} />;
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
  const [role, setRole] = useState<RoleKey>("owner");
  const [subscription, setSubscription] =
    useState<SubscriptionState>(initialSubscription);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [hasRestoredDemo, setHasRestoredDemo] = useState(!showDemoControls);

  function showNotice(message: string) {
    void Swal.fire({
      icon: "info",
      title: "โหมดตัวอย่าง",
      text: message,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#2563eb",
    });
  }

  const companyCollection = useDemoCollection(companies, showNotice);

  // ── Multi-property state ──
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [activePropertyId, setActivePropertyId] = useState<string>(
    INITIAL_PROPERTIES[0].id,
  );
  const [showAddPropertyWizard, setShowAddPropertyWizard] = useState(false);

  // ── Modal state ──
  const [viewingContract, setViewingContract] = useState<ContractRecord | null>(
    null,
  );
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(
    null,
  );
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
            role?: RoleKey;
          };
          if (saved.properties?.length) setProperties(saved.properties);
          if (saved.activePropertyId)
            setActivePropertyId(saved.activePropertyId);
          if (saved.subscription) setSubscription(saved.subscription);
          if (typeof saved.lineEnabled === "boolean")
            setLineEnabled(saved.lineEnabled);
          if (saved.role) setRole(saved.role);
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
    window.localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        properties,
        activePropertyId,
        subscription,
        lineEnabled,
        role,
      }),
    );
  }, [
    activePropertyId,
    hasRestoredDemo,
    lineEnabled,
    properties,
    role,
    showDemoControls,
    subscription,
  ]);

  const activeProperty =
    properties.find((p) => p.id === activePropertyId) ?? properties[0];
  const appSettings = activeProperty.settings;
  const meterRooms = activeProperty.rooms;
  const contracts = activeProperty.contracts;

  const currentRole = roleInfo[role];
  const displayUserName = currentUserName ?? currentRole.name;
  const displayUserRole = currentUserRoleLabel ?? currentRole.label;
  const displayInitials =
    displayUserName.trim().slice(0, 1) || currentRole.initials;

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            currentRole.allowed.includes(item.code),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [currentRole],
  );

  const isLocked = subscription === "expired";

  function navigate(page: PageKey) {
    setActivePage(page);
    setIsMobileOpen(false);
    setMenuQuery("");
  }

  function updateActiveProperty(updater: (p: Property) => Property) {
    setProperties((prev) =>
      prev.map((p) => (p.id === activePropertyId ? updater(p) : p)),
    );
  }

  function updateMeter(roomNumber: string, newElec: number | null) {
    updateActiveProperty((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.number === roomNumber ? { ...r, newElec } : r,
      ),
    }));
  }

  function saveContract(updated: ContractRecord) {
    updateActiveProperty((p) => {
      const idx = p.contracts.findIndex((c) => c.id === updated.id);
      const nextContracts =
        idx >= 0
          ? p.contracts.map((c, i) => (i === idx ? updated : c))
          : [updated, ...p.contracts];
      const nextRooms = p.rooms.map((r) =>
        r.number === updated.roomNumber
          ? {
              ...r,
              tenant: updated.tenantName,
              rent: updated.rent,
              contractStart: updated.startDate,
              contractEnd: updated.endDate,
            }
          : r,
      );
      return { ...p, contracts: nextContracts, rooms: nextRooms };
    });
    if (viewingContract && viewingContract.id === updated.id)
      setViewingContract(updated);
  }

  function deleteContract(id: string) {
    updateActiveProperty((p) => ({
      ...p,
      contracts: p.contracts.filter((c) => c.id !== id),
    }));
    showNotice("ลบสัญญาเช่าเรียบร้อยแล้ว");
  }

  function updateSettings(s: AppSettings) {
    updateActiveProperty((p) => ({ ...p, settings: s }));
  }

  function addProperty(prop: Property) {
    setProperties((prev) => [...prev, prop]);
    setActivePropertyId(prop.id);
    setShowAddPropertyWizard(false);
    navigate("dashboard");
    showNotice(`เพิ่มหอพัก "${prop.name}" เรียบร้อยแล้ว`);
  }

  function addRoom(room: RoomRecord) {
    updateActiveProperty((property) => ({
      ...property,
      rooms: [...property.rooms, room],
    }));
    showNotice(`เพิ่มห้อง ${room.number} เรียบร้อยแล้ว`);
  }

  function resetDemo() {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    setSubscription(initialSubscription);
    setLineEnabled(false);
    setRole("owner");
    setActivePage("dashboard");
    setProperties(INITIAL_PROPERTIES);
    setActivePropertyId(INITIAL_PROPERTIES[0].id);
    showNotice("รีเซ็ตข้อมูล Demo กลับค่าเริ่มต้นแล้ว");
  }

  const navigationItems = visibleGroups.flatMap((group) => group.items);
  const currentItem = navigationItems.find((item) => item.code === activePage);
  const searchTerm = menuQuery.trim().toLowerCase();
  const matchingItems = searchTerm
    ? navigationItems.filter((item) => item.label.toLowerCase().includes(searchTerm))
    : [];

  return (
    <div className="demo-workspace">
      <aside className="demo-sidebar" data-open={isMobileOpen}>
        <div className="demo-sidebar-brand">
          <button type="button" onClick={() => navigate("dashboard")} className="demo-wordmark">
            <span aria-hidden="true">L</span> Longtua
          </button>
          <button type="button" className="demo-control demo-dismiss" onClick={() => setIsMobileOpen(false)} aria-label="ปิดเมนู"><X size={18} /></button>
        </div>
        <nav className="demo-navigation" aria-label="เมนูหลัก">
          {visibleGroups.map((group) => (
            <section key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map(({ code, icon: Icon, label, addon }) => (
                <button type="button" aria-current={activePage === code ? "page" : undefined} key={code} onClick={() => navigate(code)}>
                  <Icon size={17} aria-hidden="true" /><span>{label}</span>
                  {addon && !lineEnabled ? <LockKeyhole size={13} aria-label="ยังไม่เปิดใช้งาน" /> : null}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="demo-account">
          <span className="demo-avatar" aria-hidden="true">{displayInitials}</span>
          <div><strong>{displayUserName}</strong><small>{displayUserRole}</small></div>
          <button type="button" className="demo-control" aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={() => logoutAction ? void logoutAction() : resetDemo()}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {isMobileOpen ? <button type="button" className="demo-overlay" aria-label="ปิดเมนู" onClick={() => setIsMobileOpen(false)} /> : null}

      <div className="demo-frame">
        <header className="demo-topbar">
          <button type="button" className="demo-control demo-menu-trigger" aria-label="เปิดเมนู" aria-expanded={isMobileOpen} onClick={() => setIsMobileOpen(true)}><Menu size={18} /></button>
          <div className="demo-location">
            <span>{currentOrganizationName ?? "Demo"}</span><ChevronRight size={13} aria-hidden="true" /><strong>{currentItem?.label}</strong>
          </div>
          <form className="demo-menu-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            if (matchingItems[0]) navigate(matchingItems[0].code);
          }}>
            <Search size={16} aria-hidden="true" />
            <input type="search" aria-label="ค้นหาเมนู" placeholder="ค้นหาเมนู" value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Escape") setMenuQuery("");
            }} />
            {searchTerm ? (
              <div className="demo-search-results">
                {matchingItems.length ? matchingItems.map(({ code, label }) => (
                  <button type="button" onClick={() => navigate(code)} key={code}>{label}<ArrowUpRight size={14} /></button>
                )) : <p role="status">ไม่พบเมนู</p>}
              </div>
            ) : null}
          </form>
          {showDemoControls ? (
            <div className="demo-topbar-actions">
              <select className="demo-control" aria-label="จำลองบทบาท" value={role} onChange={(event) => {
                const nextRole = event.target.value as RoleKey;
                setRole(nextRole);
                if (!roleInfo[nextRole].allowed.includes(activePage)) navigate("dashboard");
              }}>
                <option value="owner">เจ้าของ</option>
                <option value="manager">ผู้จัดการ</option>
                <option value="accounting">การเงิน</option>
                <option value="staff">เจ้าหน้าที่</option>
              </select>
              <button type="button" className="demo-control" aria-label="รีเซ็ต Demo" title="รีเซ็ต Demo" onClick={resetDemo}><RotateCcw size={16} /></button>
            </div>
          ) : null}
        </header>

        <main className="demo-content min-w-0 flex-1 p-4 sm:p-6">
          {subscription === "trialing" ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-amber-600 shrink-0" />
                <div>
                  <strong className="text-sm font-bold block">
                    {trialDaysRemaining === undefined
                      ? "ช่วงทดลองใช้ฟรี 30 วัน"
                      : `ทดลองใช้ฟรีเหลือ ${trialDaysRemaining} วัน`}
                  </strong>
                  <small className="text-xs text-amber-700">
                    {trialEndsAtText
                      ? `ใช้งานได้ถึง ${trialEndsAtText}`
                      : "ใช้งานได้ถึง 7 กันยายน 2569"}
                  </small>
                </div>
              </div>
              <button
                onClick={() => navigate("subscriptions")}
                className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                type="button"
              >
                ดูแพ็กเกจ <ChevronRight size={14} />
              </button>
            </div>
          ) : null}

          {isLocked ? (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LockKeyhole size={20} className="text-rose-600 shrink-0" />
                <div>
                  <strong className="text-sm font-bold block">
                    ระยะเวลาการใช้งานสิ้นสุดแล้ว
                  </strong>
                  <small className="text-xs text-rose-700">
                    ข้อมูลยังอยู่ครบ แต่ไม่สามารถเพิ่มหรือแก้ไขรายการได้
                  </small>
                </div>
              </div>
              <button
                onClick={() => navigate("subscriptions")}
                className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                type="button"
              >
                ต่ออายุบริการ
              </button>
            </div>
          ) : null}

          <PageContent
            activePage={activePage}
            role={role}
            isLocked={isLocked}
            lineEnabled={lineEnabled}
            onLineChange={setLineEnabled}
            onOpenPanel={() => setIsPanelOpen(true)}
            onNavigate={navigate}
            onToast={showNotice}
            companies={companyCollection.items}
            onDeleteCompany={companyCollection.removeItem}
            appSettings={appSettings}
            onSettingsChange={updateSettings}
            meterRooms={meterRooms}
            onMeterChange={updateMeter}
            contracts={contracts}
            onViewContract={(c) => setViewingContract(c)}
            onEditContract={(c) => setEditingContract(c)}
            onDeleteContract={deleteContract}
            onViewInvoice={(r) => setViewingInvoice(r)}
            activeProperty={activeProperty}
            ownerName={displayUserName}
            properties={properties}
            onSwitchProperty={(id) => {
              setActivePropertyId(id);
              showNotice("สลับหอพักเรียบร้อยแล้ว");
            }}
            onAddProperty={() => setShowAddPropertyWizard(true)}
            onAddRoom={addRoom}
          />
        </main>
      </div>

      {isPanelOpen ? (
        <CompanyPanel
          onClose={() => setIsPanelOpen(false)}
          onSave={(company) => {
            companyCollection.addItem(company);
            setIsPanelOpen(false);
            showNotice("เพิ่มกิจการตัวอย่างเรียบร้อยแล้ว");
          }}
        />
      ) : null}

      {editingContract !== null ? (
        <ContractFormModal
          contract={editingContract}
          onClose={() => setEditingContract(null)}
          onSave={(saved) => {
            saveContract(saved);
            setEditingContract(null);
            showNotice("บันทึกสัญญาเช่าเรียบร้อยแล้ว");
          }}
          onSaveAndView={(saved) => {
            saveContract(saved);
            setEditingContract(null);
            setViewingContract(saved);
            showNotice("บันทึกและเปิดตัวอย่างสัญญา");
          }}
        />
      ) : null}

      {viewingContract ? (
        <ContractModal
          contract={viewingContract}
          ownerName={displayUserName}
          property={activeProperty}
          settings={appSettings}
          onClose={() => setViewingContract(null)}
          onEdit={() => {
            const target = viewingContract;
            setViewingContract(null);
            setEditingContract(target);
          }}
        />
      ) : null}

      {viewingInvoice ? (
        <InvoiceModal
          room={viewingInvoice}
          settings={appSettings}
          onClose={() => setViewingInvoice(null)}
        />
      ) : null}

      {showAddPropertyWizard ? (
        <AddPropertyWizard
          existingSettings={appSettings}
          onClose={() => setShowAddPropertyWizard(false)}
          onSave={addProperty}
        />
      ) : null}
    </div>
  );
}
