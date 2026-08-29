-- Approval-based B2B trial onboarding. Public applicants receive an account in
-- pending state; no organization, property, or trial clock exists until a
-- platform administrator approves the request.

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending', 'active', 'suspended'));

alter table public.subscriptions add column max_properties integer;
alter table public.subscriptions add column max_rooms integer;

update public.subscriptions
set max_properties = 1, max_rooms = 100
where status = 'trialing';

alter table public.subscriptions alter column max_properties set default 1;
alter table public.subscriptions alter column max_rooms set default 100;
alter table public.subscriptions
  add constraint subscriptions_max_properties_positive
  check (max_properties is null or max_properties > 0);
alter table public.subscriptions
  add constraint subscriptions_max_rooms_positive
  check (max_rooms is null or max_rooms > 0);

create or replace function private.normalize_property_identity(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(lower(btrim(value)), '[[:space:]_.-]+', '', 'g'),
    '[0-9]+$', '', 'g'
  );
$$;

revoke all on function private.normalize_property_identity(text) from public, anon, authenticated;

create table public.trial_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username extensions.citext not null,
  operator_name text not null,
  property_name text not null,
  normalized_property_name text generated always as (private.normalize_property_identity(property_name)) stored,
  contact_email extensions.citext not null unique,
  phone text not null,
  normalized_phone text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  requested_room_count integer not null check (requested_room_count between 1 and 100),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  risk_flags text[] not null default '{}',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  approved_organization_id uuid references public.organizations(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trial_requests_username_format
    check (username::text ~ '^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$'),
  constraint trial_requests_operator_name_not_blank
    check (length(btrim(operator_name)) between 2 and 120),
  constraint trial_requests_property_name_not_blank
    check (length(btrim(property_name)) between 2 and 160),
  constraint trial_requests_phone_not_blank
    check (length(regexp_replace(phone, '[^0-9]', '', 'g')) between 9 and 10),
  constraint trial_requests_review_state
    check (
      (status = 'pending' and reviewed_at is null and reviewed_by is null)
      or (status in ('approved', 'rejected', 'cancelled') and reviewed_at is not null)
    )
);

create unique index trial_requests_username_idx on public.trial_requests (username);
create unique index trial_requests_phone_idx on public.trial_requests (normalized_phone);
create index trial_requests_status_submitted_idx
  on public.trial_requests (status, submitted_at desc);
create index trial_requests_property_identity_idx
  on public.trial_requests (normalized_property_name);

create trigger trial_requests_set_updated_at
before update on public.trial_requests
for each row execute function private.set_updated_at();

alter table public.trial_requests enable row level security;
revoke all on table public.trial_requests from public, anon, authenticated;
grant select on table public.trial_requests to authenticated;
grant all on table public.trial_requests to service_role;

create policy trial_requests_select_self
on public.trial_requests
for select
to authenticated
using (auth_user_id = (select auth.uid()));

create or replace function public.create_trial_request(
  new_auth_user_id uuid,
  new_username text,
  new_internal_email text,
  new_operator_name text,
  new_property_name text,
  new_contact_email text,
  new_phone text,
  new_requested_room_count integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_request_id uuid;
  flags text[] := '{}';
  clean_phone text := regexp_replace(new_phone, '[^0-9]', '', 'g');
  property_identity text := private.normalize_property_identity(new_property_name);
begin
  if not exists (select 1 from auth.users where id = new_auth_user_id) then
    raise exception using errcode = '23503', message = 'Auth user does not exist';
  end if;

  if not coalesce((
    select setting.value = 'true'::jsonb
    from public.system_settings setting
    where setting.key = 'registration_enabled'
  ), false) then
    raise exception using errcode = '42501', message = 'Registration is closed';
  end if;

  if exists (
    select 1 from public.properties property
    where private.normalize_property_identity(property.name) = property_identity
  ) then
    flags := array_append(flags, 'similar_property_name');
  end if;

  if exists (
    select 1 from public.tenants tenant
    where regexp_replace(coalesce(tenant.phone, ''), '[^0-9]', '', 'g') = clean_phone
  ) then
    flags := array_append(flags, 'existing_tenant_phone');
  end if;

  insert into public.auth_login_aliases (username, auth_user_id, internal_email)
  values (
    lower(btrim(new_username))::extensions.citext,
    new_auth_user_id,
    lower(btrim(new_internal_email))::extensions.citext
  );

  insert into public.profiles (id, username, display_name, phone, status)
  values (
    new_auth_user_id,
    lower(btrim(new_username))::extensions.citext,
    btrim(new_operator_name),
    clean_phone,
    'pending'
  );

  insert into public.trial_requests (
    auth_user_id, username, operator_name, property_name, contact_email,
    phone, requested_room_count, risk_flags
  ) values (
    new_auth_user_id,
    lower(btrim(new_username))::extensions.citext,
    btrim(new_operator_name),
    btrim(new_property_name),
    lower(btrim(new_contact_email))::extensions.citext,
    clean_phone,
    new_requested_room_count,
    flags
  ) returning id into created_request_id;

  return created_request_id;
end;
$$;

revoke all on function public.create_trial_request(uuid, text, text, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.create_trial_request(uuid, text, text, text, text, text, text, integer) to service_role;

create or replace function public.approve_trial_request(
  target_request_id uuid,
  reviewer_user_id uuid
)
returns table (organization_id uuid, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_record public.trial_requests;
  created_organization_id uuid;
  created_property_id uuid;
  started_at timestamptz := clock_timestamp();
  ends_at timestamptz := started_at + interval '30 days';
begin
  if not exists (
    select 1 from public.system_admins system_admin
    where system_admin.user_id = reviewer_user_id and system_admin.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Reviewer is not an active system administrator';
  end if;

  select * into request_record
  from public.trial_requests
  where id = target_request_id and status = 'pending'
  for update;

  if request_record.id is null then
    raise exception using errcode = 'P0002', message = 'Pending trial request was not found';
  end if;

  insert into public.organizations (name, slug, owner_user_id)
  values (
    request_record.operator_name,
    'org-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    request_record.auth_user_id
  ) returning id into created_organization_id;

  insert into public.organization_members (
    organization_id, user_id, role_code, status, joined_at
  ) values (
    created_organization_id, request_record.auth_user_id, 'owner', 'active', started_at
  );

  insert into public.subscriptions (
    organization_id, status, trial_started_at, trial_ends_at, access_until,
    max_properties, max_rooms
  ) values (
    created_organization_id, 'trialing', started_at, ends_at, ends_at, 1, 100
  );

  insert into public.properties (
    organization_id, name, address, phone, created_by, updated_by
  ) values (
    created_organization_id,
    request_record.property_name,
    '',
    request_record.phone,
    request_record.auth_user_id,
    request_record.auth_user_id
  ) returning id into created_property_id;

  insert into public.property_settings (property_id, organization_id, updated_by)
  values (created_property_id, created_organization_id, request_record.auth_user_id);

  update public.profiles
  set status = 'active'
  where id = request_record.auth_user_id;

  update public.trial_requests
  set status = 'approved', reviewed_by = reviewer_user_id,
      reviewed_at = started_at, approved_organization_id = created_organization_id,
      rejection_reason = null
  where id = request_record.id;

  return query select created_organization_id, ends_at;
end;
$$;

revoke all on function public.approve_trial_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_trial_request(uuid, uuid) to service_role;

create or replace function public.reject_trial_request(
  target_request_id uuid,
  reviewer_user_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.system_admins system_admin
    where system_admin.user_id = reviewer_user_id and system_admin.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Reviewer is not an active system administrator';
  end if;

  if length(btrim(reason)) < 3 then
    raise exception using errcode = '23514', message = 'A rejection reason is required';
  end if;

  update public.trial_requests
  set status = 'rejected', reviewed_by = reviewer_user_id,
      reviewed_at = clock_timestamp(), rejection_reason = btrim(reason)
  where id = target_request_id and status = 'pending';

  if not found then
    raise exception using errcode = 'P0002', message = 'Pending trial request was not found';
  end if;
end;
$$;

revoke all on function public.reject_trial_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_trial_request(uuid, uuid, text) to service_role;

create or replace function private.enforce_subscription_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  property_limit integer;
  room_limit integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text, 0));

  select subscription.max_properties, subscription.max_rooms
  into property_limit, room_limit
  from public.subscriptions subscription
  where subscription.organization_id = new.organization_id;

  if tg_table_name = 'properties'
    and property_limit is not null
    and (select count(*) from public.properties where organization_id = new.organization_id) >= property_limit then
    raise exception using errcode = '23514', message = 'Property limit reached for this subscription';
  end if;

  if tg_table_name = 'rooms'
    and room_limit is not null
    and (select count(*) from public.rooms where organization_id = new.organization_id) >= room_limit then
    raise exception using errcode = '23514', message = 'Room limit reached for this subscription';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_subscription_limits() from public, anon, authenticated;

create trigger properties_enforce_subscription_limit
before insert on public.properties
for each row execute function private.enforce_subscription_limits();

create trigger rooms_enforce_subscription_limit
before insert on public.rooms
for each row execute function private.enforce_subscription_limits();

comment on table public.trial_requests is
  'Server-created B2B trial applications. Organizations and 30-day trials begin only after platform approval.';

-- Retire the former immediate-signup RPC so no server integration can bypass
-- review and start a trial before platform approval.
drop function if exists public.complete_owner_signup(uuid, text, text, text, text, text, text);
