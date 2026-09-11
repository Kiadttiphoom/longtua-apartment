"use client";
import { Swal } from "@/lib/sweetalert";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AddPropertyWizard } from "./modals/AddPropertyWizard";
import { CompanyPanel } from "./modals/CompanyPanel";
import { ContractFormModal } from "./modals/ContractFormModal";
import { ContractModal } from "./modals/ContractModal";
import { InvoiceModal } from "./modals/InvoiceModal";
import { DEMO_STORAGE_KEY, INITIAL_PROPERTIES, companies, navGroups, roleInfo } from "./mock-data";
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
import { PageHeader } from "@/components/portal/PortalUI";
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
        isLocked={props.isLocked}
        onNavigate={props.onNavigate}
        activeProperty={props.activeProperty}
        properties={props.properties}
        meterRooms={props.meterRooms}
        contracts={props.contracts}
      />
    );
  }
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
  const [subscription, setSubscription] = useState<SubscriptionState>(initialSubscription);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasRestoredDemo, setHasRestoredDemo] = useState(!showDemoControls);

  function showNotice(message: string) { void Swal.fire({ icon: "info", title: "โหมดตัวอย่าง", text: message, confirmButtonText: "ตกลง", confirmButtonColor: "#2563eb" }); }

  const companyCollection = useDemoCollection(companies, showNotice);

  // ── Multi-property state ──
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [activePropertyId, setActivePropertyId] = useState<string>(INITIAL_PROPERTIES[0].id);
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
            role?: RoleKey;
          };
          if (saved.properties?.length) setProperties(saved.properties);
          if (saved.activePropertyId) setActivePropertyId(saved.activePropertyId);
          if (saved.subscription) setSubscription(saved.subscription);
          if (typeof saved.lineEnabled === "boolean") setLineEnabled(saved.lineEnabled);
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
      })
    );
  }, [activePropertyId, hasRestoredDemo, lineEnabled, properties, role, showDemoControls, subscription]);

  const activeProperty = properties.find((p) => p.id === activePropertyId) ?? properties[0];
  const appSettings = activeProperty.settings;
  const meterRooms = activeProperty.rooms;
  const contracts = activeProperty.contracts;

  const currentRole = roleInfo[role];
  const displayUserName = currentUserName ?? currentRole.name;
  const displayUserRole = currentUserRoleLabel ?? currentRole.label;
  const displayInitials = displayUserName.trim().slice(0, 1) || currentRole.initials;

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => currentRole.allowed.includes(item.code)),
        }))
        .filter((group) => group.items.length > 0),
    [currentRole]
  );

  const isLocked = subscription === "expired";

  function navigate(page: PageKey) {
    setActivePage(page);
    setIsMobileOpen(false);
    setShowUserMenu(false);
  }

  function updateActiveProperty(updater: (p: Property) => Property) {
    setProperties((prev) => prev.map((p) => (p.id === activePropertyId ? updater(p) : p)));
  }

  function updateMeter(roomNumber: string, newElec: number | null) {
    updateActiveProperty((p) => ({
      ...p,
      rooms: p.rooms.map((r) => (r.number === roomNumber ? { ...r, newElec } : r)),
    }));
  }

  function saveContract(updated: ContractRecord) {
    updateActiveProperty((p) => {
      const idx = p.contracts.findIndex((c) => c.id === updated.id);
      const nextContracts =
        idx >= 0 ? p.contracts.map((c, i) => (i === idx ? updated : c)) : [updated, ...p.contracts];
      const nextRooms = p.rooms.map((r) =>
        r.number === updated.roomNumber
          ? {
              ...r,
              tenant: updated.tenantName,
              rent: updated.rent,
              contractStart: updated.startDate,
              contractEnd: updated.endDate,
            }
          : r
      );
      return { ...p, contracts: nextContracts, rooms: nextRooms };
    });
    if (viewingContract && viewingContract.id === updated.id) setViewingContract(updated);
  }

  function deleteContract(id: string) {
    updateActiveProperty((p) => ({ ...p, contracts: p.contracts.filter((c) => c.id !== id) }));
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
    updateActiveProperty((property) => ({ ...property, rooms: [...property.rooms, room] }));
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)] bg-[#f5f7fb] text-[#15233b]">
      <aside
        className={`fixed top-0 left-0 z-50 w-[272px] h-dvh flex flex-col bg-gradient-to-b from-[#0b1d39] via-[#091830] to-[#071428] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-[96px] min-h-[96px] p-4 flex items-center justify-center border-b border-white/10 bg-[#06152d]">
          <button
            className="flex items-center gap-2.5 bg-transparent border-0 p-0 text-white cursor-pointer w-full"
            type="button"
            onClick={() => navigate("dashboard")}
          >
            <BrandLogo className="w-full max-h-[70px] object-contain" variant="inverse" />
          </button>
        </div>
        <button
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
          onClick={() => setIsMobileOpen(false)}
          aria-label="ปิดเมนู"
          type="button"
        >
          <X size={20} />
        </button>

        <nav aria-label="เมนูหลัก" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4">
          {visibleGroups.map((group) => (
            <section className="space-y-1" key={group.label}>
              <p className="px-3 py-1 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const addonLocked = item.addon && !lineEnabled;
                const active = activePage === item.code;
                return (
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all cursor-pointer ${
                      active
                        ? "bg-[#2457e6] text-white shadow-md shadow-blue-700/40 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                    key={item.code}
                    onClick={() => navigate(item.code)}
                    type="button"
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {addonLocked ? <LockKeyhole className="text-slate-400" size={14} /> : null}
                  </button>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="mt-auto shrink-0 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-3 border-t border-white/10">
          <button
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 text-[13px] font-medium hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            onClick={() => {
              if (logoutAction) {
                logoutAction();
              } else {
                resetDemo();
              }
            }}
            type="button"
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {isMobileOpen ? (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          type="button"
        />
      ) : null}

      <div className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 min-h-[70px] px-6 lg:px-8 flex items-center gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <button
            className="lg:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            onClick={() => setIsMobileOpen(true)}
            aria-label="เปิดเมนู"
            type="button"
          >
            <Menu size={20} />
          </button>

          {showDemoControls ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                type="button"
                title="รีเซ็ตข้อมูล Demo"
                onClick={resetDemo}
              >
                <RotateCcw size={13} />
                <span>รีเซ็ต Demo</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
                <span className="px-2 py-0.5 text-[11px] text-slate-400 font-semibold">จำลองระดับ:</span>
                {(["owner", "manager", "accounting", "staff"] as RoleKey[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      showNotice(`สลับเป็นระดับ ${roleInfo[r].label}`);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      role === r ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    type="button"
                  >
                    {r === "owner" ? "เจ้าของ" : r === "manager" ? "ผู้จัดการ" : r === "accounting" ? "การเงิน" : "เจ้าหน้าที่"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* User Profile on Right */}
          <div className="relative ml-auto">
            <button
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border-0 bg-transparent text-left"
              onClick={() => setShowUserMenu(!showUserMenu)}
              type="button"
            >
              <span className="relative w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                {displayInitials}
                <i
                  aria-hidden="true"
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                />
              </span>
              <div className="hidden sm:flex flex-col">
                <strong className="text-sm font-semibold text-slate-800 leading-tight">{displayUserName}</strong>
                <small className="text-xs text-slate-500">{displayUserRole}</small>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown User Menu */}
            {showUserMenu ? (
              <>
                <button
                  aria-label="ปิดเมนูผู้ใช้"
                  className="fixed inset-0 z-30 cursor-default bg-transparent border-0"
                  onClick={() => setShowUserMenu(false)}
                  type="button"
                />
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 p-2 text-xs space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100">
                    <strong className="text-slate-800 font-bold block text-sm">{displayUserName}</strong>
                    <span className="text-slate-400 text-xs block mt-0.5">{displayUserRole}</span>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                      ลงตัว เรสซิเดน 2
                    </span>
                  </div>

                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                    onClick={() => navigate("users")}
                    type="button"
                  >
                    <Users size={16} className="text-slate-400" />
                    <span>จัดการผู้ใช้งานในระบบ</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                    onClick={() => navigate("settings")}
                    type="button"
                  >
                    <UserCog size={16} className="text-slate-400" />
                    <span>ตั้งค่าหอพักและบัญชี</span>
                  </button>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all cursor-pointer font-medium"
                      onClick={() => {
                        setShowUserMenu(false);
                        resetDemo();
                      }}
                      type="button"
                    >
                      <LogOut size={16} />
                      <span>ออกจากระบบ / รีเซ็ต Demo</span>
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <main className="w-full max-w-[1460px] mx-auto p-6 lg:p-8 flex-1">
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
                    {trialEndsAtText ? `ใช้งานได้ถึง ${trialEndsAtText}` : "ใช้งานได้ถึง 7 กันยายน 2569"}
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
                  <strong className="text-sm font-bold block">ระยะเวลาการใช้งานสิ้นสุดแล้ว</strong>
                  <small className="text-xs text-rose-700">ข้อมูลยังอยู่ครบ แต่ไม่สามารถเพิ่มหรือแก้ไขรายการได้</small>
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
