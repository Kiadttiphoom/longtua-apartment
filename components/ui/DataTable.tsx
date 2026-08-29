import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export function DataTable({ headers, rows, emptyTitle = "ยังไม่มีข้อมูล", emptyDescription, compact = false }: {
  headers: string[];
  rows: ReactNode[][];
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  if (!rows.length) return <EmptyState compact={compact} description={emptyDescription} title={emptyTitle} />;

  return <div className={`shared-table-wrap${compact ? " compact" : ""}`}>
    <table className="shared-table">
      <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
