-- Production apartment operations. Demo data intentionally lives only in the UI demo route.

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text not null default '',
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  constraint properties_name_not_blank check (length(btrim(name)) between 1 and 160),
  unique (id, organization_id),
  unique (organization_id, name)
);

create index properties_org_created_idx
  on public.properties (organization_id, created_at desc);

create table public.property_settings (
  property_id uuid primary key,
  organization_id uuid not null,
  electric_rate numeric(12,2) not null default 8 check (electric_rate >= 0),
  water_rate numeric(12,2) not null default 100 check (water_rate >= 0),
  bill_day smallint not null default 1 check (bill_day between 1 and 28),
  due_day smallint not null default 5 check (due_day between 1 and 28),
  late_fee numeric(12,2) not null default 0 check (late_fee >= 0),
  promptpay_id text,
  account_name text,
  invoice_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete cascade
);

create index property_settings_org_idx on public.property_settings (organization_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  room_number text not null,
  floor text,
  base_rent numeric(12,2) not null default 0 check (base_rent >= 0),
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  constraint rooms_number_not_blank check (length(btrim(room_number)) between 1 and 40),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete cascade,
  unique (id, organization_id),
  unique (organization_id, property_id, room_number)
);

create index rooms_property_status_idx
  on public.rooms (organization_id, property_id, status, room_number);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  id_card_last4 char(4),
  address text,
  status text not null default 'active' check (status in ('active', 'former', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  constraint tenants_name_not_blank check (length(btrim(full_name)) between 2 and 160),
  constraint tenants_id_card_last4_format check (id_card_last4 is null or id_card_last4 ~ '^[0-9]{4}$'),
  unique (id, organization_id)
);

create index tenants_org_status_name_idx
  on public.tenants (organization_id, status, full_name);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null,
  room_id uuid not null,
  primary_tenant_id uuid not null,
  lease_number text not null,
  start_date date not null,
  end_date date,
  rent_amount numeric(12,2) not null check (rent_amount >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  advance_amount numeric(12,2) not null default 0 check (advance_amount >= 0),
  terms text,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  constraint leases_date_window check (end_date is null or end_date >= start_date),
  constraint leases_number_not_blank check (length(btrim(lease_number)) between 1 and 60),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete restrict,
  foreign key (room_id, organization_id)
    references public.rooms(id, organization_id) on delete restrict,
  foreign key (primary_tenant_id, organization_id)
    references public.tenants(id, organization_id) on delete restrict,
  unique (id, organization_id),
  unique (organization_id, lease_number)
);

create unique index leases_one_active_per_room_idx
  on public.leases (room_id)
  where status = 'active';

create index leases_org_property_status_idx
  on public.leases (organization_id, property_id, status, start_date desc);

create table public.meters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  room_id uuid not null,
  meter_type text not null check (meter_type in ('electric', 'water')),
  serial_number text,
  status text not null default 'active' check (status in ('active', 'inactive', 'replaced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete cascade,
  foreign key (room_id, organization_id)
    references public.rooms(id, organization_id) on delete cascade,
  unique (id, organization_id),
  unique (room_id, meter_type)
);

create index meters_org_property_idx
  on public.meters (organization_id, property_id, status);

create table public.billing_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  period_month date not null check (period_month = date_trunc('month', period_month)::date),
  status text not null default 'open' check (status in ('open', 'generated', 'closed', 'cancelled')),
  generated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete cascade,
  unique (id, organization_id),
  unique (property_id, period_month)
);

create index billing_cycles_org_period_idx
  on public.billing_cycles (organization_id, period_month desc, status);

create table public.meter_readings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  meter_id uuid not null,
  billing_cycle_id uuid not null,
  previous_value numeric(14,2) not null default 0 check (previous_value >= 0),
  current_value numeric(14,2) not null check (current_value >= previous_value),
  usage_value numeric(14,2) generated always as (current_value - previous_value) stored,
  read_at timestamptz not null default now(),
  read_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  foreign key (meter_id, organization_id)
    references public.meters(id, organization_id) on delete restrict,
  foreign key (billing_cycle_id, organization_id)
    references public.billing_cycles(id, organization_id) on delete cascade,
  unique (meter_id, billing_cycle_id)
);

create index meter_readings_org_cycle_idx
  on public.meter_readings (organization_id, billing_cycle_id, meter_id);

create table public.rent_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  billing_cycle_id uuid,
  lease_id uuid,
  room_id uuid not null,
  invoice_number text not null,
  issued_at date not null default current_date,
  due_at date not null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  balance_due numeric(12,2) not null default 0 check (balance_due >= 0),
  status text not null default 'draft' check (status in ('draft', 'issued', 'partial', 'paid', 'overdue', 'void')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  constraint rent_invoices_due_window check (due_at >= issued_at),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete restrict,
  foreign key (billing_cycle_id, organization_id)
    references public.billing_cycles(id, organization_id) on delete restrict,
  foreign key (lease_id, organization_id)
    references public.leases(id, organization_id) on delete restrict,
  foreign key (room_id, organization_id)
    references public.rooms(id, organization_id) on delete restrict,
  unique (id, organization_id),
  unique (organization_id, invoice_number)
);

create index rent_invoices_org_status_due_idx
  on public.rent_invoices (organization_id, status, due_at);

create table public.rent_invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  rent_invoice_id uuid not null,
  item_type text not null check (item_type in ('rent', 'electric', 'water', 'service', 'late_fee', 'discount', 'other')),
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null,
  amount numeric(12,2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  foreign key (rent_invoice_id, organization_id)
    references public.rent_invoices(id, organization_id) on delete cascade
);

create index rent_invoice_items_invoice_idx
  on public.rent_invoice_items (organization_id, rent_invoice_id);

create table public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  receipt_number text not null,
  paid_at timestamptz not null default now(),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash', 'transfer', 'promptpay', 'card', 'other')),
  reference text,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  version integer not null default 1 check (version > 0),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete restrict,
  unique (id, organization_id),
  unique (organization_id, receipt_number)
);

create index rent_payments_org_paid_idx
  on public.rent_payments (organization_id, paid_at desc);

create table public.rent_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  rent_payment_id uuid not null,
  rent_invoice_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  foreign key (rent_payment_id, organization_id)
    references public.rent_payments(id, organization_id) on delete cascade,
  foreign key (rent_invoice_id, organization_id)
    references public.rent_invoices(id, organization_id) on delete restrict,
  unique (rent_payment_id, rent_invoice_id)
);

create index rent_payment_allocations_invoice_idx
  on public.rent_payment_allocations (organization_id, rent_invoice_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

create or replace function private.can_write_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    join public.subscriptions subscription
      on subscription.organization_id = membership.organization_id
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role_code in ('owner', 'manager', 'accounting')
      and (
        subscription.status in ('trialing', 'active')
        or (subscription.status = 'past_due' and coalesce(subscription.access_until, subscription.grace_ends_at) > now())
      )
  );
$$;

revoke all on function private.can_write_organization(uuid) from public;
grant execute on function private.can_write_organization(uuid) to authenticated;

create or replace function private.bump_record_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  new.version = old.version + 1;
  return new;
end;
$$;

revoke all on function private.bump_record_version() from public;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'properties', 'property_settings', 'rooms', 'tenants', 'leases', 'meters',
    'billing_cycles', 'meter_readings', 'rent_invoices', 'rent_invoice_items',
    'rent_payments', 'rent_payment_allocations', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('revoke all on table public.%I from authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_organization_member(organization_id)))',
      table_name || '_select_member', table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.can_write_organization(organization_id)))',
      table_name || '_insert_member', table_name
    );

    if table_name <> 'audit_logs' then
      execute format(
        'create policy %I on public.%I for update to authenticated using ((select private.can_write_organization(organization_id))) with check ((select private.can_write_organization(organization_id)))',
        table_name || '_update_member', table_name
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using ((select private.can_write_organization(organization_id)))',
        table_name || '_delete_member', table_name
      );
    end if;
  end loop;
end;
$$;

grant usage, select on sequence public.audit_logs_id_seq to authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'properties', 'property_settings', 'rooms', 'tenants', 'leases', 'meters',
    'billing_cycles', 'meter_readings', 'rent_invoices', 'rent_payments'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.bump_record_version()',
      table_name || '_bump_version', table_name
    );
  end loop;
end;
$$;

create or replace function public.create_property_with_defaults(
  target_organization_id uuid,
  property_name text,
  property_address text,
  property_phone text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_property_id uuid;
begin
  insert into public.properties (organization_id, name, address, phone)
  values (
    target_organization_id,
    btrim(property_name),
    coalesce(btrim(property_address), ''),
    nullif(btrim(property_phone), '')
  )
  returning id into created_property_id;

  insert into public.property_settings (property_id, organization_id)
  values (created_property_id, target_organization_id);

  insert into public.audit_logs (organization_id, action, entity_type, entity_id)
  values (target_organization_id, 'property.created', 'property', created_property_id);

  return created_property_id;
end;
$$;

revoke all on function public.create_property_with_defaults(uuid, text, text, text) from public, anon;
grant execute on function public.create_property_with_defaults(uuid, text, text, text) to authenticated, service_role;

comment on table public.properties is 'Production property records. Demo fixtures must never be inserted here automatically.';
comment on table public.rent_invoices is 'Tenant rent invoices; separate from SaaS subscription billing invoices.';
