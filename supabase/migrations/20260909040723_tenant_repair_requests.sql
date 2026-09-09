create table public.repair_requests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 tenant_id uuid not null references public.tenants(id),
 property_id uuid not null references public.properties(id),
 room_id uuid not null references public.rooms(id),
 title text not null check (char_length(title) between 3 and 160),
 detail text not null check (char_length(detail) between 5 and 3000),
 status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.repair_requests enable row level security;
revoke all on public.repair_requests from anon;
grant select, insert, update on public.repair_requests to authenticated;
grant all on public.repair_requests to service_role;
create policy repair_read on public.repair_requests for select to authenticated using (
 private.is_organization_member(organization_id) or exists (
 select 1 from public.tenant_accounts a where a.auth_user_id = auth.uid() and a.tenant_id = repair_requests.tenant_id and a.organization_id = repair_requests.organization_id and a.status = 'active'
 ));
create policy repair_create on public.repair_requests for insert to authenticated with check (
 status = 'pending' and exists (
 select 1 from public.tenant_accounts a join public.leases l on l.primary_tenant_id = a.tenant_id and l.organization_id = a.organization_id
 where a.auth_user_id = auth.uid() and a.status = 'active' and l.status = 'active'
 and a.tenant_id = repair_requests.tenant_id and a.organization_id = repair_requests.organization_id
 and l.room_id = repair_requests.room_id and l.property_id = repair_requests.property_id
 ));
create policy repair_update on public.repair_requests for update to authenticated
 using (private.can_write_organization(organization_id)) with check (private.can_write_organization(organization_id));
create index repair_requests_tenant_created_idx on public.repair_requests(tenant_id, created_at desc);
