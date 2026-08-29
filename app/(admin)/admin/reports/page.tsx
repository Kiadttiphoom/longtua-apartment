import { AdminSectionPage, type AdminSearchParams } from "@/components/admin/AdminSectionPage";

export default function AdminReportsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminSectionPage section="reports" searchParams={searchParams} />;
}
