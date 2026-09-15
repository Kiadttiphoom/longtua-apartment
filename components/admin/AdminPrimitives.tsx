import type { ReactNode } from "react";
import { DataTable } from "@/components/ui/DataTable";

export { dateInput, money, statusLabel, thaiDateTime as thaiDate } from "@/lib/format";

export function AdminTable({ headers, rows, empty = "ยังไม่มีข้อมูล" }: { headers: string[]; rows: ReactNode[][]; empty?: string }) {
  return <DataTable compact emptyTitle={empty} headers={headers} rows={rows} />;
}

// Re-export for backward compatibility in Client Components
export { AdminModal, AdminConfirmDeleteModal } from "@/components/admin/AdminModals";
