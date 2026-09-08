-- Append-only documents: changes preserve earlier print versions.
create table public.lease_document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lease_id uuid not null,
  parent_id uuid,
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 500000),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 500000),
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  foreign key (lease_id, organization_id) references public.leases(id, organization_id) on delete cascade,
  unique (id, lease_id),
  foreign key (parent_id, lease_id) references public.lease_document_versions(id, lease_id)
);
create unique index lease_document_versions_single_successor on public.lease_document_versions
  (lease_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index lease_document_versions_history on public.lease_document_versions (organization_id, lease_id, created_at desc);

create table public.property_lease_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null,
  parent_id uuid,
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 500000),
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete cascade,
  unique (id, property_id),
  foreign key (parent_id, property_id) references public.property_lease_templates(id, property_id)
);
create unique index property_lease_templates_single_successor on public.property_lease_templates
  (property_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index property_lease_templates_history on public.property_lease_templates (organization_id, property_id, created_at desc);

alter table public.lease_document_versions enable row level security;
alter table public.property_lease_templates enable row level security;
revoke all on public.lease_document_versions, public.property_lease_templates from public, anon, authenticated;
grant select, insert on public.lease_document_versions, public.property_lease_templates to authenticated;
grant all on public.lease_document_versions, public.property_lease_templates to service_role;

create policy lease_document_versions_read on public.lease_document_versions for select to authenticated
using ((select private.has_menu_action(organization_id, 'customer_leases', 'view')));
create policy lease_document_versions_add on public.lease_document_versions for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.has_menu_action(organization_id, 'customer_leases', 'update')));
create policy property_lease_templates_read on public.property_lease_templates for select to authenticated
using ((select private.has_menu_action(organization_id, 'customer_leases', 'view')));
create policy property_lease_templates_add on public.property_lease_templates for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.has_menu_action(organization_id, 'customer_leases', 'update'))
  and (select private.has_menu_action(organization_id, 'customer_settings', 'update')));
