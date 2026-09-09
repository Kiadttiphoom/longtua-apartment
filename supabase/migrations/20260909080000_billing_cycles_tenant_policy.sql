create policy billing_cycles_select_tenant
on public.billing_cycles for select to authenticated
using (
  exists (
    select 1 from public.rent_invoices invoice
    join public.leases lease on lease.id = invoice.lease_id and lease.organization_id = invoice.organization_id
    join public.tenant_accounts account on account.tenant_id = lease.primary_tenant_id and account.organization_id = lease.organization_id
    where invoice.billing_cycle_id = billing_cycles.id
      and account.auth_user_id = (select auth.uid())
      and account.status = 'active'
  )
);
