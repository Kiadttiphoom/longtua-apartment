import { MoreHorizontal, Trash2 } from "lucide-react";

export function SimpleTable({
  headers,
  rows,
  onDelete,
  disableDelete = false,
}: {
  headers: string[];
  rows: string[][];
  onDelete?: (index: number) => void;
  disableDelete?: boolean;
}) {
  return (
    <div className="w-full mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              {headers.map((header) => (
                <th className="px-5 py-3.5" key={header}>
                  {header}
                </th>
              ))}
              <th className="px-5 py-3.5 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td className="px-5 py-4" key={`${cell}-${cellIndex}`}>
                    {cellIndex === 0 ? <strong className="text-slate-800 font-bold">{cell}</strong> : cell}
                  </td>
                ))}
                <td className="px-5 py-4 text-right">
                  {onDelete ? (
                    <button
                      aria-label={`ลบ ${row[0]}`}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                      disabled={disableDelete}
                      onClick={() => onDelete(index)}
                      title="ลบรายการ"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      aria-label={`ตัวเลือก ${row[0]}`}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                      type="button"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
