import { AdminSectionPage, type AdminSearchParams } from "@/components/admin/AdminSectionPage";

export default function AdminOverviewPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminSectionPage section="overview" searchParams={searchParams} />;
}
