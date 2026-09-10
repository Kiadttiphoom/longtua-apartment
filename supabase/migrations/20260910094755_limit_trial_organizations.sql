-- Count every existing organization, including suspended/closed organizations.
-- Existing organizations are preserved if the database is already over capacity.
-- Serialize all creation paths so concurrent approvals cannot exceed 20.
create or replace function private.enforce_registration_organization_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('longtua.registration.organization_limit', 0));
  if (select count(*) from public.organizations) >= 20 then
    raise exception using errcode = '23514', message = 'registration_organization_limit_reached';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_registration_organization_limit() from public, anon, authenticated;

create trigger organizations_registration_limit
before insert on public.organizations
for each row execute function private.enforce_registration_organization_limit();

-- A request arriving as the final organization is approved is rejected too.
-- The server removes its newly created Auth account on this failure path.
create trigger trial_requests_registration_limit
before insert on public.trial_requests
for each row execute function private.enforce_registration_organization_limit();
