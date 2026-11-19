-- 20261119000000_decouple_supabase_auth.sql
-- Decouple application from Supabase Auth dependencies and establish standalone PostgreSQL identity foundation

create schema if not exists auth;

-- Standalone user table for environments without Supabase GoTrue
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  encrypted_password text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table auth.users is
  'Authentication identities storing bcrypt password hashes compatible with standard PostgreSQL and Supabase Auth.';

-- Standalone auth.uid() function supporting both app.current_user_id and Supabase JWT claims
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('app.current_user_id', true), '')::uuid,
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );
$$;

comment on function auth.uid() is
  'Resolves current authenticated user ID from transaction-local app.current_user_id or request.jwt.claim.sub';

-- Create restricted application role if not exists
do $$
begin
  if not exists (select from pg_roles where rolname = 'longtua_app') then
    create role longtua_app with login;
  end if;
end $$;

grant usage on schema public, private, auth to longtua_app;
grant select, insert, update, delete on all tables in schema public to longtua_app;
grant select, insert, update, delete on table auth.users to longtua_app;
grant usage, select on all sequences in schema public, auth to longtua_app;
grant execute on all functions in schema public, private to longtua_app;
