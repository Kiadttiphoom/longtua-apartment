import { AdminManageOrganization } from "@/components/admin/AdminManageOrganization";
import { adminManagementPaths } from "@/lib/portal/admin-management-paths";
import { ShieldCheck } from "lucide-react";
import type { AdminViewContentProps } from "@/components/admin/admin-types";
import { AdminOverviewView } from "@/components/admin/views/AdminOverviewView";
import { AdminOrganizationsView, AdminUsersView } from "@/components/admin/views/AdminDirectoryViews";
import { AdminPropertiesView, AdminRoomsView } from "@/components/admin/views/AdminPropertyViews";
import { AdminTenantViews, AdminLeasesView } from "@/components/admin/views/AdminTenantViews";
import { AdminMetersView, AdminInvoicesView, AdminPaymentsView, AdminReceivablesView, AdminReportsView } from "@/components/admin/views/AdminBillingViews";
import { AdminLineView, AdminSubscriptionsView, AdminRolesView, AdminPermissionsView, AdminMenusView, AdminAuditView, AdminSettingsView, AdminTrialRequestsView } from "@/components/admin/views/AdminManagementViews";

export function AdminViewContent({ view, title, description, params, catalogReady, granularPermissionsReady, organizationCount, profileCount, organizations, profiles, memberships, subscriptions, subscriptionPlans, properties, rooms, tenants, leases, meters, invoices, payments, roles, permissions, menus, audits, trialRequests, propertiesReady, roomsReady, tenantsReady, leasesReady, metersReady, invoicesReady, paymentsReady, registration, systemAdminIds, organizationMap, profileMap, propertyMap, roomMap, tenantMap, latestReadingByMeter, memberCountByOrganization, organizationCountByUser, matrixActions, matrixMenus, matrixRoles, selectedRoleId, selectedOrganizationId, selectedOrganizationUsers, selectedUserId, totalBilled, totalOutstanding, totalCollected, occupiedRooms }: AdminViewContentProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">LONGTUA PLATFORM</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-xs">
          <ShieldCheck size={15} /> SUPER ADMIN
        </span>
      </header>

      {params.saved ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {params.saved}
        </div>
      ) : null}

      {params.notice ? (
        <div role="status" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          {params.notice}
        </div>
      ) : null}

      {params.error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          บันทึกไม่สำเร็จ · รหัสอ้างอิง {params.error}
        </div>
      ) : null}

      {!catalogReady ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          เมนูจัดการขั้นสูงยังไม่พร้อม กรุณา apply migration <code>20260828091931_admin_management_catalog.sql</code>
        </div>
      ) : null}

      {Object.hasOwn(adminManagementPaths, view) ? <AdminManageOrganization section={view} organizations={organizations} /> : null}

      {view === "overview" ? <AdminOverviewView organizationCount={organizationCount} profileCount={profileCount} subscriptions={subscriptions} organizations={organizations} memberCountByOrganization={memberCountByOrganization} /> : null}
      {view === "trial-requests" ? <AdminTrialRequestsView trialRequests={trialRequests} /> : null}
      {view === "organizations" ? <AdminOrganizationsView organizations={organizations} profileMap={profileMap} profiles={profiles} memberCountByOrganization={memberCountByOrganization} /> : null}
      {view === "properties" ? <AdminPropertiesView properties={properties} rooms={rooms} organizations={organizations} organizationMap={organizationMap} propertiesReady={propertiesReady} /> : null}
      {view === "users" ? <AdminUsersView memberships={memberships} organizationMap={organizationMap} profiles={profiles} organizations={organizations} roles={roles} systemAdminIds={systemAdminIds} organizationCountByUser={organizationCountByUser} /> : null}
      {view === "rooms" ? <AdminRoomsView rooms={rooms} properties={properties} organizations={organizations} organizationMap={organizationMap} propertyMap={propertyMap} roomsReady={roomsReady} /> : null}
      {view === "tenants" ? <AdminTenantViews tenants={tenants} organizations={organizations} organizationMap={organizationMap} tenantsReady={tenantsReady} /> : null}
      {view === "leases" ? <AdminLeasesView leases={leases} rooms={rooms} tenants={tenants} properties={properties} organizations={organizations} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} tenantMap={tenantMap} leasesReady={leasesReady} /> : null}
      {view === "meters" ? <AdminMetersView meters={meters} rooms={rooms} properties={properties} organizations={organizations} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} latestReadingByMeter={latestReadingByMeter} metersReady={metersReady} /> : null}
      {view === "invoices" ? <AdminInvoicesView invoices={invoices} rooms={rooms} properties={properties} organizations={organizations} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} invoicesReady={invoicesReady} /> : null}
      {view === "payments" ? <AdminPaymentsView payments={payments} invoices={invoices} properties={properties} organizations={organizations} organizationMap={organizationMap} propertyMap={propertyMap} paymentsReady={paymentsReady} /> : null}
      {view === "receivables" ? <AdminReceivablesView invoices={invoices} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} /> : null}
      {view === "reports" ? <AdminReportsView properties={properties} rooms={rooms} organizations={organizations} invoices={invoices} payments={payments} totalCollected={totalCollected} totalOutstanding={totalOutstanding} totalBilled={totalBilled} occupiedRooms={occupiedRooms} /> : null}
      {view === "line" ? <AdminLineView /> : null}
      {view === "subscriptions" ? <AdminSubscriptionsView subscriptions={subscriptions} subscriptionPlans={subscriptionPlans} organizationMap={organizationMap} /> : null}
      {view === "roles" ? <AdminRolesView roles={roles} /> : null}
      {view === "permissions" ? <AdminPermissionsView granularPermissionsReady={granularPermissionsReady} params={params} organizations={organizations} roles={roles} matrixActions={matrixActions} matrixMenus={matrixMenus} matrixRoles={matrixRoles} selectedRoleId={selectedRoleId} selectedOrganizationId={selectedOrganizationId} selectedOrganizationUsers={selectedOrganizationUsers} selectedUserId={selectedUserId} /> : null}
      {view === "menus" ? <AdminMenusView menus={menus} permissions={permissions} /> : null}
      {view === "audit" ? <AdminAuditView audits={audits} profileMap={profileMap} /> : null}
      {view === "settings" ? <AdminSettingsView registration={registration} /> : null}
    </div>
  );
}
