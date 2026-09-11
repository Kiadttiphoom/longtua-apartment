export type Property = { id: string; name: string; address: string; phone: string | null; status: string };
export type PropertySettings = {
  property_id: string;
  electric_rate: number;
  water_rate: number;
  water_billing_method: "meter" | "per_person" | "flat_room";
  bill_day: number;
  due_day: number;
  late_fee: number;
  promptpay_id: string | null;
  account_name: string | null;
  invoice_note: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
};

export type Room = { id: string; property_id: string; room_number: string; floor: string | null; base_rent: number; status: string };
export type Tenant = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  id_card_last4: string | null;
  address: string | null;
  birth_date: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  vehicle_plate: string | null;
  line_id: string | null;
  notes: string | null;
  status: string;
};
export type Lease = { id: string; property_id: string; room_id: string; primary_tenant_id: string; lease_number: string; start_date: string; end_date: string | null; rent_amount: number; deposit_amount: number; advance_amount: number; occupant_count: number; terms: string | null; status: string };
export type Meter = { id: string; property_id: string; room_id: string; meter_type: string; serial_number: string | null; status: string };
export type MeterReading = { id: string; meter_id: string; billing_cycle_id: string; period_month: string; previous_value: number; current_value: number; usage_value: number; read_at: string };
export type Invoice = { id: string; property_id: string; room_id: string; lease_id: string | null; billing_cycle_id?: string | null; invoice_number: string; issued_at: string; due_at: string; subtotal: number; total: number; balance_due: number; status: string; note: string | null };
export type Payment = { id: string; property_id: string; receipt_number: string; paid_at: string; amount: number; method: string; reference: string | null; status: string; invoice_id?: string | null; room_id?: string | null };

export type PortalData = {
  properties: Property[];
  settings: PropertySettings[];
  rooms: Room[];
  tenants: Tenant[];
  leases: Lease[];
  meters: Meter[];
  meterReadings: MeterReading[];
  invoices: Invoice[];
  payments: Payment[];
  schemaError?: string;
};
