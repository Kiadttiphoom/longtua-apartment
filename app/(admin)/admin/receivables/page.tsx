import { AdminSectionPage, type AdminSearchParams } from "@/components/admin/AdminSectionPage";

export default function AdminReceivablesPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminSectionPage section="receivables" searchParams={searchParams} />;
}
