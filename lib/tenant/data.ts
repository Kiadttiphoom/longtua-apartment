import "server-only";

import { cache } from "react";
import { requireTenantContext } from "@/lib/auth/tenant-access";

export const loadTenantPortalData = cache(async () => {
  const context = await requireTenantContext();
  const { supabase, tenantId, organizationId } = context;
  const [tenant, organization, leases, rooms, properties, settings, invoices, invoiceItems, allocations, payments, submissions, versions] = await Promise.all([
    supabase.from("tenants").select("id, full_name, phone, email").eq("id", tenantId).single(),
    supabase.from("organizations").select("id, name").eq("id", organizationId).single(),
    supabase.from("leases").select("id, property_id, room_id, lease_number, start_date, end_date, rent_amount, deposit_amount, advance_amount, occupant_count, terms, status").eq("primary_tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("rooms").select("id, property_id, room_number, floor").eq("organization_id", organizationId),
    supabase.from("properties").select("id, name, address, phone").eq("organization_id", organizationId),
    supabase.from("property_settings").select("property_id, promptpay_id, account_name, invoice_note").eq("organization_id", organizationId),
    supabase.from("rent_invoices").select("id, lease_id, property_id, room_id, invoice_number, issued_at, due_at, total, balance_due, status, note").eq("organization_id", organizationId).order("issued_at", { ascending: false }),
    supabase.from("rent_invoice_items").select("id, rent_invoice_id, item_type, description, quantity, unit_price, amount").eq("organization_id", organizationId),
    supabase.from("rent_payment_allocations").select("rent_payment_id, rent_invoice_id, amount").eq("organization_id", organizationId),
    supabase.from("rent_payments").select("id, receipt_number, paid_at, amount, method, reference, status").eq("organization_id", organizationId).order("paid_at", { ascending: false }),
    supabase.from("payment_submissions").select("id, invoice_id, amount, paid_at, method, reference, slip_path, note, status, rejection_reason, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("lease_versions").select("id, lease_id, version_no, snapshot, change_reason, created_at").eq("organization_id", organizationId).order("version_no", { ascending: false }),
  ]);
  const errors = [tenant, organization, leases, rooms, properties, settings, invoices, invoiceItems, allocations, payments, submissions, versions].flatMap((result) => result.error ? [result.error] : []);
  if (errors.length) throw new Error("โหลดข้อมูล Tenant Portal ไม่สำเร็จ");
  return {
    context,
    tenant: tenant.data!, organization: organization.data!,
    leases: leases.data ?? [], rooms: rooms.data ?? [], properties: properties.data ?? [], settings: settings.data ?? [],
    invoices: invoices.data ?? [], invoiceItems: invoiceItems.data ?? [], allocations: allocations.data ?? [], payments: payments.data ?? [], submissions: submissions.data ?? [], versions: versions.data ?? [],
  };
});
