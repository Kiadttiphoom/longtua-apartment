"use client";

import { useState } from "react";

type Point = { time: string; success: number; errors: number };
export function MonitorCharts({ series, actions }: { series: Point[]; actions: Array<{ action: string; total: number }> }) {
  const [selected, setSelected] = useState(0);
  const max = Math.max(2, ...series.map((p) => Math.max(p.success, p.errors)));
  const x = (i: number) => 42 + i * 620 / Math.max(1, series.length - 1);
  const y = (value: number) => 192 - value / max * 160;
  const line = (field: "success" | "errors") => series.map((p, i) => `${x(i)},${y(p[field])}`).join(" ");
  const point = series[Math.min(selected, series.length - 1)];
  const top = Math.max(1, ...actions.map((a) => a.total));
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-800">แนวโน้มกิจกรรมและข้อผิดพลาด</h2>
        <div className="mt-2 flex gap-4 text-xs"><span className="text-blue-600">● สำเร็จ</span><span className="text-rose-600">● Error</span></div>
        {series.length ? <>
          <svg viewBox="0 0 700 228" className="mt-4 w-full" role="img" aria-label="กราฟเส้นจำนวนเหตุการณ์สำเร็จและข้อผิดพลาด ใช้ปุ่มลูกศรเพื่อดูแต่ละช่วงเวลา" tabIndex={0}
            onKeyDown={(e) => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); setSelected((value) => Math.max(0, Math.min(series.length - 1, value + (e.key === "ArrowRight" ? 1 : -1)))); } }}>
            {[0, 0.5, 1].map((ratio) => <g key={ratio}><line x1="42" x2="662" y1={y(max * ratio)} y2={y(max * ratio)} stroke="#e2e8f0" /><text x="34" y={y(max * ratio) + 4} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(max * ratio)}</text></g>)}
            <polyline points={line("success")} fill="none" stroke="#2563eb" strokeWidth="2.5" />
            <polyline points={line("errors")} fill="none" stroke="#e11d48" strokeWidth="2.5" />
            {series.map((p, i) => <g key={p.time} onMouseEnter={() => setSelected(i)} onClick={() => setSelected(i)}>
              <rect x={x(i) - Math.max(3, 310 / series.length)} y="20" width={Math.max(6, 620 / series.length)} height="178" fill="transparent"><title>{p.time} เวลาไทย: สำเร็จ {p.success}, Error {p.errors}</title></rect>
            </g>)}
            {point && <g><line x1={x(selected)} x2={x(selected)} y1="24" y2="195" stroke="#94a3b8" strokeDasharray="4 4" /><circle cx={x(selected)} cy={y(point.success)} r="4" fill="#2563eb" /><circle cx={x(selected)} cy={y(point.errors)} r="4" fill="#e11d48" /></g>}
            <text x="42" y="218" fontSize="10" fill="#64748b">{series[0]?.time}</text>
            <text x="662" y="218" textAnchor="end" fontSize="10" fill="#64748b">{series.at(-1)?.time}</text>
          </svg>
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600" aria-live="polite">{point?.time} (เวลาไทย) · สำเร็จ <strong className="text-blue-600">{point?.success}</strong> · Error <strong className="text-rose-600">{point?.errors}</strong></p>
        </> : <p className="py-16 text-center text-sm text-slate-500">ยังไม่มีข้อมูลในช่วงที่เลือก</p>}
      </section>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-800">กิจกรรมที่เกิดบ่อย 10 อันดับ</h2>
        <p className="mt-1 text-xs text-slate-500">จำนวนเหตุการณ์ตามตัวกรองทั้งหมด</p>
        <div className="mt-5 space-y-3">
          {actions.map((item) => <div key={item.action}>
            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-slate-600" title={item.action}>{item.action}</span><strong>{item.total.toLocaleString("th-TH")}</strong></div>
            <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${item.total / top * 100}%` }} /></div>
          </div>)}
          {!actions.length && <p className="py-14 text-center text-sm text-slate-500">ไม่พบกิจกรรมตามตัวกรอง</p>}
        </div>
      </section>
    </div>
  );
}
