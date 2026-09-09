import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Loads notification badge counts for portal sidebar menu items.
 * - customer_payments: Pending payment submissions waiting for review
 * - customer_receivables: Unpaid/overdue invoices with balance due
 */
export const loadPortalMenuBadges = cache(
  async (organizationId: string, isImpersonating?: boolean): Promise<Record<string, number>> => {
    if (!organizationId) return {};

    try {
      const supabase = isImpersonating ? createAdminClient() : await createClient();
      const [pendingSubmissions, outstandingInvoices] = await Promise.all([
        supabase
          .from("payment_submissions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", "pending"),
        supabase
          .from("rent_invoices")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .gt("balance_due", 0)
          .neq("status", "void"),
      ]);

      const badges: Record<string, number> = {};
      const pendingCount = pendingSubmissions.count ?? 0;
      const outstandingCount = outstandingInvoices.count ?? 0;

      if (pendingCount > 0) {
        badges["customer_payments"] = pendingCount;
      }
      if (outstandingCount > 0) {
        badges["customer_receivables"] = outstandingCount;
      }

      return badges;
    } catch {
      return {};
    }
  }
);
