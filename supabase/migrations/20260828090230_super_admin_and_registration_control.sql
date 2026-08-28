create table public.system_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint system_admins_user_not_creator check (created_by is null or created_by <> user_id)
);

comment on table public.system_admins is
  'Longtua platform administrators. This is intentionally separate from customer organization roles.';

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.system_settings (key, value, description)
values ('registration_enabled', 'true'::jsonb, 'Controls public production registration at /register');

create trigger system_admins_set_updated_at
before update on public.system_admins
for each row execute function private.set_updated_at();

create trigger system_settings_set_updated_at
before update on public.system_settings
for each row execute function private.set_updated_at();

alter table public.system_admins enable row level security;
alter table public.system_settings enable row level security;

revoke all on table public.system_admins, public.system_settings from public, anon, authenticated;
grant all on table public.system_admins, public.system_settings to service_role;

-- Access is deliberately server-only through the service role. The server verifies
-- the caller's Supabase session and then checks system_admins before every mutation.
