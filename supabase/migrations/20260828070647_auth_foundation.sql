create schema if not exists private;
create extension if not exists citext with schema extensions;

create table public.auth_login_aliases (
  username extensions.citext primary key,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  internal_email extensions.citext not null unique,
  created_at timestamptz not null default now(),
  constraint auth_login_aliases_username_format
    check (username::text ~ '^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$')
);

comment on table public.auth_login_aliases is
  'Server-only mapping from a public username to the synthetic email identifier used by Supabase Auth.';

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username::text ~ '^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$'),
  constraint profiles_display_name_not_blank
    check (length(btrim(display_name)) between 2 and 120)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  currency char(3) not null default 'THB',
  timezone text not null default 'Asia/Bangkok',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (length(btrim(name)) between 2 and 160),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null
    check (role_code in ('owner', 'manager', 'accounting', 'staff')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create unique index organization_members_one_owner_idx
  on public.organization_members (organization_id)
  where role_code = 'owner' and status = 'active';

create index organization_members_user_org_idx
  on public.organization_members (user_id, organization_id)
  where status = 'active';

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  status text not null
    check (status in ('trialing', 'active', 'past_due', 'readonly', 'paused', 'cancelled')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_ends_at timestamptz,
  access_until timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_trial_window
    check (trial_ends_at is null or trial_started_at is null or trial_ends_at > trial_started_at)
);

create index subscriptions_access_idx
  on public.subscriptions (status, access_until);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function private.set_updated_at();

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

revoke all on function private.is_organization_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;

create or replace function public.complete_owner_signup(
  new_auth_user_id uuid,
  new_username text,
  new_internal_email text,
  new_display_name text,
  new_phone text,
  new_organization_name text,
  new_organization_slug text
)
returns table (organization_id uuid, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_organization_id uuid;
  started_at timestamptz := clock_timestamp();
  ends_at timestamptz := started_at + interval '30 days';
begin
  if not exists (select 1 from auth.users where id = new_auth_user_id) then
    raise exception using errcode = '23503', message = 'Auth user does not exist';
  end if;

  insert into public.auth_login_aliases (username, auth_user_id, internal_email)
  values (lower(btrim(new_username))::extensions.citext, new_auth_user_id, lower(btrim(new_internal_email))::extensions.citext);

  insert into public.profiles (id, username, display_name, phone)
  values (
    new_auth_user_id,
    lower(btrim(new_username))::extensions.citext,
    btrim(new_display_name),
    nullif(btrim(new_phone), '')
  );

  insert into public.organizations (name, slug, owner_user_id)
  values (btrim(new_organization_name), lower(btrim(new_organization_slug)), new_auth_user_id)
  returning id into created_organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role_code,
    status,
    joined_at
  ) values (
    created_organization_id,
    new_auth_user_id,
    'owner',
    'active',
    started_at
  );

  insert into public.subscriptions (
    organization_id,
    status,
    trial_started_at,
    trial_ends_at,
    access_until
  ) values (
    created_organization_id,
    'trialing',
    started_at,
    ends_at,
    ends_at
  );

  return query select created_organization_id, ends_at;
end;
$$;

revoke all on function public.complete_owner_signup(uuid, text, text, text, text, text, text) from public;
revoke all on function public.complete_owner_signup(uuid, text, text, text, text, text, text) from anon, authenticated;
grant execute on function public.complete_owner_signup(uuid, text, text, text, text, text, text) to service_role;

alter table public.auth_login_aliases enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy organizations_select_member
on public.organizations
for select
to authenticated
using ((select private.is_organization_member(id)));

create policy organization_members_select_member
on public.organization_members
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy subscriptions_select_member
on public.subscriptions
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

revoke all on table public.auth_login_aliases from anon, authenticated;
revoke all on table public.profiles, public.organizations, public.organization_members, public.subscriptions from anon;
revoke all on table public.profiles, public.organizations, public.organization_members, public.subscriptions from authenticated;

grant select on table public.profiles, public.organizations, public.organization_members, public.subscriptions to authenticated;
grant all on table public.auth_login_aliases, public.profiles, public.organizations, public.organization_members, public.subscriptions to service_role;

revoke all on function private.set_updated_at() from public;
