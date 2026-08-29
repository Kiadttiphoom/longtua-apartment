import { ShieldCheck } from "lucide-react";
import type { AdminViewContentProps } from "@/components/admin/admin-types";
import { AdminOverviewView } from "@/components/admin/views/AdminOverviewView";
import { AdminOrganizationsView, AdminUsersView } from "@/components/admin/views/AdminDirectoryViews";
import { AdminPropertiesView, AdminRoomsView } from "@/components/admin/views/AdminPropertyViews";
import { AdminTenantsView, AdminLeasesView } from "@/components/admin/views/AdminTenantViews";
import { AdminMetersView, AdminInvoicesView, AdminPaymentsView, AdminReceivablesView, AdminReportsView } from "@/components/admin/views/AdminBillingViews";
import { AdminLineView, AdminSubscriptionsView, AdminRolesView, AdminPermissionsView, AdminMenusView, AdminAuditView, AdminSettingsView, AdminTrialRequestsView } from "@/components/admin/views/AdminManagementViews";

export function AdminViewContent({ view, title, description, params, catalogReady, granularPermissionsReady, organizationCount, profileCount, organizations, profiles, subscriptions, properties, rooms, tenants, leases, meters, invoices, payments, roles, permissions, menus, audits, trialRequests, propertiesReady, roomsReady, tenantsReady, leasesReady, metersReady, invoicesReady, paymentsReady, registration, systemAdminIds, organizationMap, profileMap, propertyMap, roomMap, tenantMap, latestReadingByMeter, memberCountByOrganization, organizationCountByUser, matrixActions, matrixMenus, matrixRoles, selectedRoleId, selectedOrganizationId, selectedOrganizationUsers, selectedUserId, totalBilled, totalOutstanding, totalCollected, occupiedRooms }: AdminViewContentProps) {
  return <>
    <header><div><small>LONGTUA PLATFORM</small><h1>{title}</h1><p>{description}</p></div><span className="admin-role-badge"><ShieldCheck size={15} />SUPER ADMIN</span></header>
    {params.saved ? <div className="admin-notice success">{params.saved}</div> : null}
    {params.error ? <div className="admin-notice error">บันทึกไม่สำเร็จ · รหัสอ้างอิง {params.error}</div> : null}
    {!catalogReady ? <div className="admin-notice error">เมนูจัดการขั้นสูงยังไม่พร้อม กรุณา apply migration <code>20260828091931_admin_management_catalog.sql</code></div> : null}
    {view === "overview" ? <AdminOverviewView organizationCount={organizationCount} profileCount={profileCount} subscriptions={subscriptions} organizations={organizations} memberCountByOrganization={memberCountByOrganization} /> : null}
    {view === "trial-requests" ? <AdminTrialRequestsView trialRequests={trialRequests} /> : null}
    {view === "organizations" ? <AdminOrganizationsView organizations={organizations} profileMap={profileMap} memberCountByOrganization={memberCountByOrganization} /> : null}
    {view === "properties" ? <AdminPropertiesView properties={properties} rooms={rooms} organizationMap={organizationMap} propertiesReady={propertiesReady} /> : null}
    {view === "users" ? <AdminUsersView profiles={profiles} systemAdminIds={systemAdminIds} organizationCountByUser={organizationCountByUser} /> : null}
    {view === "rooms" ? <AdminRoomsView rooms={rooms} organizationMap={organizationMap} propertyMap={propertyMap} roomsReady={roomsReady} /> : null}
    {view === "tenants" ? <AdminTenantsView tenants={tenants} organizationMap={organizationMap} tenantsReady={tenantsReady} /> : null}
    {view === "leases" ? <AdminLeasesView leases={leases} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} tenantMap={tenantMap} leasesReady={leasesReady} /> : null}
    {view === "meters" ? <AdminMetersView meters={meters} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} latestReadingByMeter={latestReadingByMeter} metersReady={metersReady} /> : null}
    {view === "invoices" ? <AdminInvoicesView invoices={invoices} organizationMap={organizationMap} propertyMap={propertyMap} roomMap={roomMap} invoicesReady={invoicesReady} /> : null}
    {view === "payments" ? <AdminPaymentsView payments={payments} organizationMap={organizationMap} propertyMap={propertyMap} paymentsReady={paymentsReady} /> : null}
    {view === "receivables" ? <AdminReceivablesView invoices={invoices} organizationMap={organizationMap} roomMap={roomMap} /> : null}
    {view === "reports" ? <AdminReportsView properties={properties} rooms={rooms} organizations={organizations} invoices={invoices} payments={payments} totalCollected={totalCollected} totalOutstanding={totalOutstanding} totalBilled={totalBilled} occupiedRooms={occupiedRooms} /> : null}
    {view === "line" ? <AdminLineView /> : null}
    {view === "subscriptions" ? <AdminSubscriptionsView subscriptions={subscriptions} organizationMap={organizationMap} /> : null}
    {view === "roles" ? <AdminRolesView roles={roles} /> : null}
    {view === "permissions" ? <AdminPermissionsView granularPermissionsReady={granularPermissionsReady} params={params} organizations={organizations} roles={roles} matrixActions={matrixActions} matrixMenus={matrixMenus} matrixRoles={matrixRoles} selectedRoleId={selectedRoleId} selectedOrganizationId={selectedOrganizationId} selectedOrganizationUsers={selectedOrganizationUsers} selectedUserId={selectedUserId} /> : null}
    {view === "menus" ? <AdminMenusView menus={menus} permissions={permissions} /> : null}
    {view === "audit" ? <AdminAuditView audits={audits} profileMap={profileMap} /> : null}
    {view === "settings" ? <AdminSettingsView registration={registration} /> : null}
  </>;
}
