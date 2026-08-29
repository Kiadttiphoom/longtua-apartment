import { AdminSectionPage, type AdminSearchParams } from "@/components/admin/AdminSectionPage";

export default function AdminUsersPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminSectionPage section="users" searchParams={searchParams} />;
}
