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

  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs ${compact ? "p-0" : "mb-6"}`}>
      <table className="w-full text-left text-[13px] border-collapse whitespace-nowrap">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr className="hover:bg-slate-50/70 transition-colors" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3.5 align-middle text-slate-700" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
