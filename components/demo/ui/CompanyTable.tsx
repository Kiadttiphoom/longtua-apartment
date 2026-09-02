import { MoreHorizontal, Trash2 } from "lucide-react";
import type { Company } from "../types";
import { StatusBadge } from "./StatusBadge";

export function CompanyTable({
  rows,
  onDelete,
}: {
  rows: Company[];
  onDelete?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-5 py-3.5">กิจการ</th>
            <th className="px-5 py-3.5">แพ็กเกจ</th>
            <th className="px-5 py-3.5">หอพัก</th>
            <th className="px-5 py-3.5">ผู้ใช้งาน</th>
            <th className="px-5 py-3.5">รอบบริการ</th>
            <th className="px-5 py-3.5">สถานะ</th>
            <th className="px-5 py-3.5 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((company, index) => (
            <tr key={`${company.name}-${index}`} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-100 shrink-0">
                    {company.name.charAt(0)}
                  </span>
                  <div>
                    <strong className="text-slate-800 font-bold block">{company.name}</strong>
                    <small className="text-[11px] text-slate-400">{company.owner}</small>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 font-semibold text-slate-700">{company.plan}</td>
              <td className="px-5 py-4">{company.properties} หอพัก</td>
              <td className="px-5 py-4">{company.users} คน</td>
              <td className="px-5 py-4 text-slate-500">{company.date}</td>
              <td className="px-5 py-4">
                <StatusBadge status={company.status} />
              </td>
              <td className="px-5 py-4 text-right">
                {onDelete ? (
                  <button
                    aria-label={`ลบ ${company.name}`}
                    className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                    onClick={() => onDelete(index)}
                    title="ลบรายการ"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    aria-label={`ตัวเลือก ${company.name}`}
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
  );
}
