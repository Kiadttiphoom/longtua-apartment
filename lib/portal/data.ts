import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverError } from "@/lib/server-log";
import { requirePortalContext } from "@/lib/portal/context";
import { getRelatedPeriodMonth } from "@/lib/portal/meter-reading.mjs";
import type { PortalData } from "@/components/portal/types";

export const loadPortalData = cache(async (): Promise<PortalData> => {
  const context = await requirePortalContext();
  const supabase = context.isImpersonating ? createAdminClient() : await createClient();
  const organizationId = context.organization.id;
  const settingsQuery = await (async () => {
    const full = await supabase
      .from("property_settings")
      .select("property_id, electric_rate, water_rate, water_billing_method, bill_day, due_day, late_fee, promptpay_id, account_name, invoice_note, bank_name, bank_account_no, bank_account_name")
      .eq("organization_id", organizationId);
    if (!full.error) return full;
    const withBank = await supabase
      .from("property_settings")
      .select("property_id, electric_rate, water_rate, water_billing_method, bill_day, due_day, late_fee, promptpay_id, account_name, invoice_note, bank_name")
      .eq("organization_id", organizationId);
    if (!withBank.error) return withBank;
    return await supabase
      .from("property_settings")
      .select("property_id, electric_rate, water_rate, water_billing_method, bill_day, due_day, late_fee, promptpay_id, account_name, invoice_note")
      .eq("organization_id", organizationId);
  })();

  const results = await Promise.all([
    supabase.from("properties").select("id, name, address, phone, status").eq("organization_id", organizationId).order("created_at"),
    Promise.resolve(settingsQuery),
    supabase.from("rooms").select("id, property_id, room_number, floor, base_rent, status").eq("organization_id", organizationId).order("room_number"),
    supabase.from("tenants").select("id, full_name, phone, email, id_card_last4, address, birth_date, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, vehicle_plate, line_id, notes, status").eq("organization_id", organizationId).order("full_name"),
    supabase.from("leases").select("id, property_id, room_id, primary_tenant_id, lease_number, start_date, end_date, rent_amount, deposit_amount, advance_amount, occupant_count, terms, status").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("meters").select("id, property_id, room_id, meter_type, serial_number, status").eq("organization_id", organizationId),
    supabase.from("meter_readings").select("id, meter_id, billing_cycle_id, previous_value, current_value, usage_value, read_at, billing_cycles(period_month)").eq("organization_id", organizationId).order("read_at", { ascending: false }).limit(500),
    supabase.from("rent_invoices").select("id, property_id, room_id, lease_id, billing_cycle_id, invoice_number, issued_at, due_at, subtotal, total, balance_due, status, note").eq("organization_id", organizationId).order("issued_at", { ascending: false }).limit(1000),
    supabase.from("rent_payments").select("id, property_id, receipt_number, paid_at, amount, method, reference, status").eq("organization_id", organizationId).order("paid_at", { ascending: false }).limit(1000),
  ]);
  const errors = results.flatMap((result) => result.error ? [result.error] : []);
  if (errors.length) serverError("portal", {
    stage: "portal.load_data",
    organizationId,
    errors: errors.map((error) => ({ code: error.code, message: error.message })),
  });
  const [properties, settings, rooms, tenants, leases, meters, meterReadings, invoices, payments] = results;
  return {
    properties: (properties.data ?? []) as PortalData["properties"],
    settings: (settings.data ?? []) as PortalData["settings"],
    rooms: (rooms.data ?? []) as PortalData["rooms"],
    tenants: (tenants.data ?? []) as PortalData["tenants"],
    leases: (leases.data ?? []) as PortalData["leases"],
    meters: (meters.data ?? []) as PortalData["meters"],
    meterReadings: (meterReadings.data ?? []).map((reading) => ({
      id: reading.id,
      meter_id: reading.meter_id,
      billing_cycle_id: reading.billing_cycle_id,
      previous_value: Number(reading.previous_value),
      current_value: Number(reading.current_value),
      usage_value: Number(reading.usage_value),
      read_at: reading.read_at,
      period_month: getRelatedPeriodMonth(reading.billing_cycles),
    })) as PortalData["meterReadings"],
    invoices: (invoices.data ?? []) as PortalData["invoices"],
    payments: (payments.data ?? []) as PortalData["payments"],
    schemaError: errors.length ? "ฐานข้อมูลบางส่วนยังไม่พร้อม กรุณาตรวจสอบ Supabase migrations" : undefined,
  };
});
