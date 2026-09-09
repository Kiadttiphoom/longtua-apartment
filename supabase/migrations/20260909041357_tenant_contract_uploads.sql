create table public.tenant_contract_uploads (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 tenant_id uuid not null references public.tenants(id),
 lease_id uuid not null references public.leases(id),
 file_uri text not null unique,
 file_name text not null,
 content_type text not null check (content_type in ('image/jpeg','image/png','application/pdf')),
 created_at timestamptz not null default now()
);
alter table public.tenant_contract_uploads enable row level security;
revoke all on public.tenant_contract_uploads from anon, authenticated;
grant select, insert on public.tenant_contract_uploads to authenticated;
grant all on public.tenant_contract_uploads to service_role;
create policy tenant_contract_read on public.tenant_contract_uploads for select to authenticated using (
 exists (select 1 from public.tenant_accounts a where a.auth_user_id = auth.uid() and a.status = 'active' and a.tenant_id = tenant_contract_uploads.tenant_id and a.organization_id = tenant_contract_uploads.organization_id)
);
create policy tenant_contract_insert on public.tenant_contract_uploads for insert to authenticated with check (
 exists (select 1 from public.tenant_accounts a join public.leases l on l.primary_tenant_id = a.tenant_id and l.organization_id = a.organization_id where a.auth_user_id = auth.uid() and a.status = 'active' and a.tenant_id = tenant_contract_uploads.tenant_id and a.organization_id = tenant_contract_uploads.organization_id and l.id = tenant_contract_uploads.lease_id)
);
create index tenant_contract_uploads_tenant_idx on public.tenant_contract_uploads(tenant_id,created_at desc);
