import { AdminSectionPage, type AdminSearchParams } from "@/components/admin/AdminSectionPage";

export default function AdminRoomsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminSectionPage section="rooms" searchParams={searchParams} />;
}
