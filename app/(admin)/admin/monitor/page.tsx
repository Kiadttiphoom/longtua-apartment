import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, Building2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { monitorFilters } from "@/lib/monitor/filters.mjs";
import { MonitorFilters, MonitorRefreshButton } from "@/components/admin/MonitorFilters";
import { MonitorCharts } from "@/components/admin/MonitorCharts";

export const dynamic = "force-dynamic";
type Params = Record<string, string | string[] | undefined>;
type Event = { id: number; occurred_at: string; actor_name: string | null; organization_name: string | null; action: string; outcome: string; source: string; entity_type: string | null; entity_id: string | null; error_code: string | null; request_id: string | null; message: string | null };
type MonitorData = { total: number; errors: number; users: number; organizations: number; series: Array<{ time: string; success: number; errors: number }>; actions: Array<{ action: string; total: number }>; rows: Event[] };
const timestamp = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(value));

export default async function AdminMonitorPage({ searchParams }: { searchParams: Promise<Params> }) {
  const client = await createClient();
  const { data: auth } = await client.auth.getClaims();
  if (!auth?.claims?.sub || !await isSystemAdmin(auth.claims.sub)) redirect("/login");
  const params = await searchParams;
  const strings = Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  let filters = monitorFilters();
  let issue = "";
  try { filters = monitorFilters(params); } catch (error) { issue = error instanceof Error ? error.message : "ตัวกรองไม่ถูกต้อง"; }
  const { defaults, ...query } = filters;
  let data: MonitorData | null = null;
  if (!issue) {
    const result = await createAdminClient().rpc("query_admin_monitor", query);
    if (result.error) issue = ["PGRST202", "42P01", "42883"].includes(result.error.code)
      ? "Monitor ยังไม่พร้อม กรุณารัน migration admin_monitor ในฐานข้อมูลก่อน"
      : "โหลดข้อมูล Monitor ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    else data = result.data as MonitorData;
  }
  const pageLink = (page: number) => `/admin/monitor?${new URLSearchParams({ ...strings, page: String(page) })}`;
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / 50));
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Longtua · Monitor</p><h1 className="mt-1 text-2xl font-bold text-slate-800">กิจกรรมและข้อผิดพลาดของระบบ</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบว่าใครทำอะไร ในกิจการใด พร้อมวันเวลาและรหัสอ้างอิง</p></div>
        <MonitorRefreshButton />
      </header>
      <MonitorFilters key={JSON.stringify(strings)} initial={{ ...defaults, ...strings }} />
      {issue ? <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{issue}</p> : data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["เหตุการณ์ทั้งหมด", data.total, Activity, "text-blue-600"], ["ข้อผิดพลาด", data.errors, AlertTriangle, "text-rose-600"], ["ผู้ใช้งานที่ระบุตัวตนได้", data.users, Users, "text-violet-600"], ["กิจการที่มีกิจกรรม", data.organizations, Building2, "text-emerald-600"]].map(([label, count, Icon, color]) => {
            const CardIcon = Icon as typeof Activity;
            return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><CardIcon size={20} className={String(color)} /><p className="mt-3 text-xs text-slate-500">{String(label)}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-800">{Number(count).toLocaleString("th-TH")}</p></div>;
          })}
        </div>
        <MonitorCharts key={JSON.stringify(query)} series={data.series} actions={data.actions} />
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-800">รายการเหตุการณ์</h2><p className="mt-1 text-xs text-slate-500">{data.total.toLocaleString("th-TH")} รายการ · หน้า {filters.page_number} / {pageCount} · วันเวลาไทย (ค.ศ.)</p></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500"><tr>{["วันที่ / เวลา", "ผู้ทำรายการ", "กิจการ", "กิจกรรม", "ผลลัพธ์", "รายละเอียด / รหัสอ้างอิง"].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{data.rows.map((event) => <tr key={event.id} className="align-top hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-4"><time dateTime={event.occurred_at}>{timestamp(event.occurred_at)}</time></td>
              <td className="min-w-36 px-4 py-4 font-semibold text-slate-700">{event.actor_name || "ระบบ / ไม่ระบุผู้ใช้"}</td>
              <td className="min-w-36 px-4 py-4">{event.organization_name || "ระบบ / ไม่ระบุกิจการ"}</td>
              <td className="px-4 py-4"><span className="font-medium text-slate-700">{event.action}</span><span className="mt-1 block text-[10px] text-slate-400">{event.source}</span></td>
              <td className="px-4 py-4"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 font-semibold ${event.outcome === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{event.outcome === "error" ? "Error" : "สำเร็จ"}</span></td>
              <td className="min-w-64 px-4 py-4 text-slate-600">{event.message || event.entity_type || "—"}{(event.request_id || event.entity_id || event.error_code) && <details className="mt-2"><summary className="cursor-pointer text-blue-600">ดูรหัสอ้างอิง</summary><div className="mt-2 space-y-1 break-all font-mono text-[11px]">{event.error_code && <p>Error: {event.error_code}</p>}{event.request_id && <p>Request: {event.request_id}</p>}{event.entity_id && <p>Record: {event.entity_id}</p>}</div></details>}</td>
            </tr>)}{!data.rows.length && <tr><td colSpan={6} className="p-12 text-center text-slate-500">ไม่พบเหตุการณ์ตามตัวกรองที่เลือก</td></tr>}</tbody>
          </table></div>
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
            {filters.page_number > 1 ? <Link className="text-blue-600" href={pageLink(filters.page_number - 1)}>← ก่อนหน้า</Link> : <span className="text-slate-300">← ก่อนหน้า</span>}
            {filters.page_number < pageCount ? <Link className="text-blue-600" href={pageLink(filters.page_number + 1)}>ถัดไป →</Link> : <span className="text-slate-300">ถัดไป →</span>}
          </div>
        </section>
      </>}
      <p className="text-xs leading-relaxed text-slate-500">กราฟนับเหตุการณ์ที่บันทึกไว้ การทำรายการหนึ่งครั้งอาจเปลี่ยนข้อมูลหลายแถวและมีหลายเหตุการณ์ ประวัติเก่าแสดงเฉพาะ Audit Log ที่เคยมี ส่วน Error และการเปลี่ยนข้อมูลแบบละเอียดเริ่มเก็บหลังเปิดใช้ Monitor ไม่รวม error ในเบราว์เซอร์หรือบริการภายนอกที่ไม่ได้ส่งเข้าระบบ</p>
    </div>
  );
}
