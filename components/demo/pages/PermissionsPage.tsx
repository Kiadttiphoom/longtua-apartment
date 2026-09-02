import { permissionColumns, permissionRows } from "../mock-data";
import type { PageContentProps } from "../types";
import { PageHeader } from "../ui/PageHeader";

export function PermissionsPage({ isLocked, onToast }: PageContentProps) {
  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "บันทึกสิทธิ์" : undefined}
        description="ตารางความสัมพันธ์ระหว่าง Role และสิทธิ์ในการเข้าถึงฟังก์ชันต่างๆ"
        onAction={() => onToast("บันทึกตารางสิทธิ์แล้ว")}
        title="สิทธิ์การใช้งาน (Permissions Matrix)"
      />
      <div className="w-full mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">โมดูล / ฟังก์ชัน</th>
                {permissionColumns.map((col) => (
                  <th key={col} className="px-4 py-3.5 text-center">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionRows.map((row, rowIdx) => (
                <tr key={row} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-800">{row}</td>
                  {permissionColumns.map((col, colIdx) => {
                    const isChecked = !(rowIdx === 7 && colIdx > 2);
                    return (
                      <td key={col} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={isChecked}
                          disabled={isLocked}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
