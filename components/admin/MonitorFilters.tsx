"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function MonitorRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-blue-600 disabled:opacity-50">{pending ? "กำลังโหลด..." : "รีเฟรชข้อมูล"}</button>;
}

export function MonitorFilters({ initial }: { initial: Record<string, string> }) {
  const [mode, setMode] = useState(initial.mode || "date");
  const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" action="/admin/monitor">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">ช่วงข้อมูล
          <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
            <option value="date">ช่วงวันที่</option><option value="month">เดือน</option><option value="year">ปี</option>
          </select>
        </label>
        {mode === "date" ? <>
          <label className="text-xs font-semibold text-slate-600">ตั้งแต่วันที่<input className={inputClass} type="date" name="from" required defaultValue={initial.from} /></label>
          <label className="text-xs font-semibold text-slate-600">ถึงวันที่ (รวมวันนี้)<input className={inputClass} type="date" name="to" required defaultValue={initial.to} /></label>
        </> : mode === "month" ? (
          <label className="text-xs font-semibold text-slate-600">เดือน / ปี<input className={inputClass} type="month" name="month" required defaultValue={initial.month} /></label>
        ) : (
          <label className="text-xs font-semibold text-slate-600">ปี ค.ศ.<input className={inputClass} type="number" name="year" min="2000" max="2100" required defaultValue={initial.year} /></label>
        )}
        <label className="text-xs font-semibold text-slate-600">ผลลัพธ์<select name="outcome" className={inputClass} defaultValue={initial.outcome || "all"}><option value="all">ทั้งหมด</option><option value="success">สำเร็จ</option><option value="error">ข้อผิดพลาด</option></select></label>
        <label className="text-xs font-semibold text-slate-600">เวลาเริ่มต้นในแต่ละวัน<input type="time" name="timeFrom" className={inputClass} defaultValue={initial.timeFrom || "00:00"} required /></label>
        <label className="text-xs font-semibold text-slate-600">เวลาสิ้นสุดในแต่ละวัน<input type="time" name="timeTo" className={inputClass} defaultValue={initial.timeTo || "23:59"} required /></label>
        <label className="text-xs font-semibold text-slate-600">ชื่อกิจการ<input name="organization" className={inputClass} defaultValue={initial.organization} placeholder="ค้นหาบางส่วนของชื่อกิจการ" maxLength={160} /></label>
        <label className="text-xs font-semibold text-slate-600">ชื่อคน / ชื่อผู้ใช้<input name="actor" className={inputClass} defaultValue={initial.actor} placeholder="ชื่อจริง หรือ username" maxLength={160} /></label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">ค้นหากิจกรรม / Error / รหัสอ้างอิง<input name="q" className={inputClass} defaultValue={initial.q} placeholder="เช่น rent_invoices, 23505 หรือรหัสอ้างอิง" maxLength={200} /></label>
        <div className="flex items-end gap-3 sm:col-span-2">
          <button type="submit" className="h-10 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700">ค้นหา / อัปเดตกราฟ</button>
          <Link href="/admin/monitor" className="py-2 text-sm text-slate-500 hover:text-blue-600">ล้างตัวกรอง</Link>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">เวลาไทย (UTC+7) · ช่วงวันที่เลือกได้สูงสุด 370 วัน · ถ้าเวลาเริ่มมากกว่าเวลาสิ้นสุด จะค้นหาช่วงข้ามเที่ยงคืนในแต่ละวัน</p>
    </form>
  );
}
