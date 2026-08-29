-- Tenant self-service access, immutable lease snapshots, and payment-slip review.

create table public.tenant_accounts (
  tenant_id uuid primary key,
  organization_id uuid not null,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null default auth.uid(),
  activated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, organization_id)
    references public.tenants(id, organization_id) on delete cascade,
  unique (tenant_id, organization_id)
);

create index tenant_accounts_auth_status_idx
  on public.tenant_accounts (auth_user_id, status);

create table public.lease_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lease_id uuid not null,
  version_no integer not null check (version_no > 0),
  snapshot jsonb not null,
  change_reason text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (lease_id, organization_id)
    references public.leases(id, organization_id) on delete restrict,
  unique (lease_id, version_no)
);

create index lease_versions_lease_created_idx
  on public.lease_versions (organization_id, lease_id, version_no desc);

create table public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  tenant_id uuid not null,
  lease_id uuid not null,
  invoice_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null,
  method text not null default 'transfer' check (method in ('transfer', 'promptpay')),
  reference text,
  slip_path text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, organization_id)
    references public.properties(id, organization_id) on delete restrict,
  foreign key (tenant_id, organization_id)
    references public.tenants(id, organization_id) on delete restrict,
  foreign key (lease_id, organization_id)
    references public.leases(id, organization_id) on delete restrict,
  foreign key (invoice_id, organization_id)
    references public.rent_invoices(id, organization_id) on delete restrict,
  foreign key (payment_id, organization_id)
    references public.rent_payments(id, organization_id) on delete restrict,
  unique (slip_path)
);

create index payment_submissions_org_status_idx
  on public.payment_submissions (organization_id, status, created_at desc);
create index payment_submissions_tenant_idx
  on public.payment_submissions (tenant_id, created_at desc);

create or replace function private.capture_lease_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lease_versions (
    organization_id, lease_id, version_no, snapshot, change_reason, created_by
  ) values (
    new.organization_id,
    new.id,
    coalesce((select max(version_no) + 1 from public.lease_versions where lease_id = new.id), 1),
    to_jsonb(new) - 'updated_by' - 'created_by',
    case when tg_op = 'INSERT' then 'สร้างสัญญา' else 'แก้ไขสัญญา' end,
    auth.uid()
  );
  return new;
end;
$$;

revoke all on function private.capture_lease_version() from public, anon, authenticated;

insert into public.lease_versions (organization_id, lease_id, version_no, snapshot, change_reason, created_by)
select lease.organization_id, lease.id, 1, to_jsonb(lease) - 'updated_by' - 'created_by', 'ข้อมูลสัญญาก่อนเปิด Tenant Portal', lease.updated_by
from public.leases lease
where not exists (select 1 from public.lease_versions version where version.lease_id = lease.id);

create trigger leases_capture_version
after insert or update of lease_number, start_date, end_date, rent_amount, deposit_amount, advance_amount, occupant_count, terms, status
on public.leases
for each row execute function private.capture_lease_version();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips', 'payment-slips', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.tenant_accounts enable row level security;
alter table public.lease_versions enable row level security;
alter table public.payment_submissions enable row level security;

revoke all on table public.tenant_accounts, public.lease_versions, public.payment_submissions from anon, authenticated;
grant select on table public.tenant_accounts, public.lease_versions to authenticated;
grant select, insert, update on table public.payment_submissions to authenticated;
grant all on table public.tenant_accounts, public.lease_versions, public.payment_submissions to service_role;

create policy tenant_accounts_select_self_or_member
on public.tenant_accounts for select to authenticated
using (auth_user_id = (select auth.uid()) or (select private.is_organization_member(organization_id)));

create policy lease_versions_select_member_or_tenant
on public.lease_versions for select to authenticated
using (
  (select private.is_organization_member(organization_id))
  or exists (
    select 1 from public.leases lease
    join public.tenant_accounts account
      on account.tenant_id = lease.primary_tenant_id
      and account.organization_id = lease.organization_id
    where lease.id = lease_versions.lease_id
      and account.auth_user_id = (select auth.uid())
      and account.status = 'active'
  )
);

create policy payment_submissions_select_member_or_self
on public.payment_submissions for select to authenticated
using (
  (select private.is_organization_member(organization_id))
  or exists (
    select 1 from public.tenant_accounts account
    where account.tenant_id = payment_submissions.tenant_id
      and account.organization_id = payment_submissions.organization_id
      and account.auth_user_id = (select auth.uid())
      and account.status = 'active'
  )
);

create policy payment_submissions_insert_self
on public.payment_submissions for insert to authenticated
with check (
  status = 'pending'
  and reviewed_by is null
  and payment_id is null
  and exists (
    select 1 from public.tenant_accounts account
    join public.leases lease
      on lease.primary_tenant_id = account.tenant_id
      and lease.organization_id = account.organization_id
    join public.rent_invoices invoice
      on invoice.lease_id = lease.id
      and invoice.organization_id = lease.organization_id
    where account.tenant_id = payment_submissions.tenant_id
      and account.organization_id = payment_submissions.organization_id
      and account.auth_user_id = (select auth.uid())
      and account.status = 'active'
      and lease.id = payment_submissions.lease_id
      and invoice.id = payment_submissions.invoice_id
      and invoice.property_id = payment_submissions.property_id
      and invoice.balance_due >= payment_submissions.amount
      and invoice.status not in ('paid', 'void')
  )
);

create policy payment_submissions_update_member
on public.payment_submissions for update to authenticated
using ((select private.can_write_organization(organization_id)))
with check ((select private.can_write_organization(organization_id)));

-- Tenant read policies are deliberately scoped through the linked tenant account.
create policy organizations_select_tenant
on public.organizations for select to authenticated
using (exists (select 1 from public.tenant_accounts account where account.organization_id = organizations.id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy properties_select_tenant
on public.properties for select to authenticated
using (exists (select 1 from public.tenant_accounts account where account.organization_id = properties.organization_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy property_settings_select_tenant
on public.property_settings for select to authenticated
using (exists (select 1 from public.tenant_accounts account where account.organization_id = property_settings.organization_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy rooms_select_tenant
on public.rooms for select to authenticated
using (exists (select 1 from public.leases lease join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id where lease.room_id = rooms.id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy tenants_select_self
on public.tenants for select to authenticated
using (exists (select 1 from public.tenant_accounts account where account.tenant_id = tenants.id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy leases_select_tenant
on public.leases for select to authenticated
using (exists (select 1 from public.tenant_accounts account where account.tenant_id = leases.primary_tenant_id and account.organization_id = leases.organization_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy rent_invoices_select_tenant
on public.rent_invoices for select to authenticated
using (exists (select 1 from public.leases lease join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id where lease.id = rent_invoices.lease_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy rent_invoice_items_select_tenant
on public.rent_invoice_items for select to authenticated
using (exists (select 1 from public.rent_invoices invoice join public.leases lease on lease.id = invoice.lease_id and lease.organization_id = invoice.organization_id join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id where invoice.id = rent_invoice_items.rent_invoice_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy rent_payment_allocations_select_tenant
on public.rent_payment_allocations for select to authenticated
using (exists (select 1 from public.rent_invoices invoice join public.leases lease on lease.id = invoice.lease_id and lease.organization_id = invoice.organization_id join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id where invoice.id = rent_payment_allocations.rent_invoice_id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy rent_payments_select_tenant
on public.rent_payments for select to authenticated
using (exists (select 1 from public.rent_payment_allocations allocation join public.rent_invoices invoice on invoice.id = allocation.rent_invoice_id and invoice.organization_id = allocation.organization_id join public.leases lease on lease.id = invoice.lease_id and lease.organization_id = invoice.organization_id join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id where allocation.rent_payment_id = rent_payments.id and account.auth_user_id = (select auth.uid()) and account.status = 'active'));

create policy payment_slips_insert_self
on storage.objects for insert to authenticated
with check (bucket_id = 'payment-slips' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy payment_slips_select_self_or_member
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-slips'
  and (
    owner_id = (select auth.uid()::text)
    or exists (
      select 1 from public.payment_submissions submission
      where submission.slip_path = storage.objects.name
        and (select private.is_organization_member(submission.organization_id))
    )
  )
);

create policy payment_slips_delete_self
on storage.objects for delete to authenticated
using (bucket_id = 'payment-slips' and owner_id = (select auth.uid()::text));

create or replace function public.approve_payment_submission(target_submission_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  submission public.payment_submissions;
  invoice public.rent_invoices;
  created_payment_id uuid;
  next_balance numeric(12,2);
begin
  select * into submission from public.payment_submissions
  where id = target_submission_id and status = 'pending'
  for update;
  if submission.id is null or not private.can_write_organization(submission.organization_id) then
    raise exception using errcode = '42501', message = 'Payment submission is not available';
  end if;

  select * into invoice from public.rent_invoices
  where id = submission.invoice_id and organization_id = submission.organization_id
  for update;
  if invoice.id is null or submission.amount > invoice.balance_due or invoice.status in ('paid', 'void') then
    raise exception using errcode = '23514', message = 'Submitted amount is no longer payable';
  end if;

  insert into public.rent_payments (organization_id, property_id, receipt_number, paid_at, amount, method, reference, status)
  values (submission.organization_id, submission.property_id, 'REC-SLIP-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' || upper(substr(replace(submission.id::text, '-', ''), 1, 8)), submission.paid_at, submission.amount, submission.method, coalesce(submission.reference, 'Tenant Portal'), 'confirmed')
  returning id into created_payment_id;

  insert into public.rent_payment_allocations (organization_id, rent_payment_id, rent_invoice_id, amount)
  values (submission.organization_id, created_payment_id, submission.invoice_id, submission.amount);

  next_balance := invoice.balance_due - submission.amount;
  update public.rent_invoices set balance_due = next_balance, status = case when next_balance = 0 then 'paid' else 'partial' end
  where id = invoice.id and organization_id = invoice.organization_id;

  update public.payment_submissions set status = 'approved', payment_id = created_payment_id, reviewed_by = auth.uid(), reviewed_at = clock_timestamp(), rejection_reason = null
  where id = submission.id;

  insert into public.audit_logs (organization_id, action, entity_type, entity_id, metadata)
  values (submission.organization_id, 'payment_submission.approved', 'payment_submission', submission.id, jsonb_build_object('payment_id', created_payment_id));
  return created_payment_id;
end;
$$;

revoke all on function public.approve_payment_submission(uuid) from public, anon;
grant execute on function public.approve_payment_submission(uuid) to authenticated, service_role;
