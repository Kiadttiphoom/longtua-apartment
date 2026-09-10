import { AdminManageOrganizationButton } from "@/components/admin/AdminManageOrganization";
import { Hotel, KeyRound, ReceiptText, WalletCards } from "lucide-react";
import { AdminTable, money, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

export function AdminMetersView({ meters, organizationMap, propertyMap, roomMap, latestReadingByMeter, metersReady }: Pick<AdminViewContentProps, "meters" | "organizationMap" | "propertyMap" | "roomMap" | "latestReadingByMeter" | "metersReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ระบบมิเตอร์</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">มิเตอร์น้ำและไฟทั้งหมด</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "หอ/ห้อง", "ประเภท", "เลขล่าสุด", "หน่วยใช้", "วันที่จด", "สถานะ"]}
        rows={meters.map((item) => {
          const reading = latestReadingByMeter.get(item.id);
          return [
            <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="meters" /></div>,
            `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`,
            item.meter_type === "electric" ? "ไฟฟ้า" : "น้ำ",
            reading ? Number(reading.current_value).toLocaleString("th-TH") : "—",
            reading ? Number(reading.usage_value).toLocaleString("th-TH") : "—",
            thaiDate(reading?.read_at ?? null),
            <StatusBadge compact key="s" status={item.status} />,
          ];
        })}
        empty={!metersReady ? "ตารางมิเตอร์ยังไม่พร้อม" : "ยังไม่มีมิเตอร์"}
      />
    </section>
  );
}

export function AdminInvoicesView({ invoices, organizationMap, propertyMap, roomMap, invoicesReady }: Pick<AdminViewContentProps, "invoices" | "organizationMap" | "propertyMap" | "roomMap" | "invoicesReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ใบแจ้งหนี้</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">ใบแจ้งหนี้ทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "หอ/ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ"]}
        rows={invoices.map((item) => [
          <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="invoices" /></div>,
          item.invoice_number,
          `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`,
          thaiDate(item.issued_at),
          thaiDate(item.due_at),
          money(Number(item.total)),
          money(Number(item.balance_due)),
          <StatusBadge compact key="s" status={item.status} />,
        ])}
        empty={!invoicesReady ? "ตารางใบแจ้งหนี้ยังไม่พร้อม" : "ยังไม่มีใบแจ้งหนี้"}
      />
    </section>
  );
}

export function AdminPaymentsView({ payments, organizationMap, propertyMap, paymentsReady }: Pick<AdminViewContentProps, "payments" | "organizationMap" | "propertyMap" | "paymentsReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายการรับชำระ</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">ประวัติรับชำระเงินทั้งหมด</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบเสร็จ", "หอพัก", "วันที่รับ", "ยอดเงิน", "ช่องทาง", "อ้างอิง", "สถานะ"]}
        rows={payments.map((item) => [
          <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="payments" /></div>,
          item.receipt_number,
          propertyMap.get(item.property_id) ?? "—",
          thaiDate(item.paid_at),
          money(Number(item.amount)),
          item.method,
          item.reference || "—",
          <StatusBadge compact key="s" status={item.status} />,
        ])}
        empty={!paymentsReady ? "ตารางรับชำระยังไม่พร้อม" : "ยังไม่มีรายการรับชำระ"}
      />
    </section>
  );
}

export function AdminReceivablesView({ invoices, organizationMap, roomMap }: Pick<AdminViewContentProps, "invoices" | "organizationMap" | "roomMap">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ลูกหนี้คงค้าง</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">รายการค้างชำระทั้งหมด</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "ห้อง", "ครบกำหนด", "ยอดรวม", "ยอดค้าง", "สถานะ"]}
        rows={invoices
          .filter((item) => Number(item.balance_due) > 0 && item.status !== "void")
          .map((item) => [
            <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="receivables" /></div>,
            item.invoice_number,
            roomMap.get(item.room_id) ?? "—",
            thaiDate(item.due_at),
            money(Number(item.total)),
            <strong className="text-rose-600 font-bold" key="b">{money(Number(item.balance_due))}</strong>,
            <StatusBadge compact key="s" status={item.status} />,
          ])}
        empty="ไม่มียอดค้างชำระ"
      />
    </section>
  );
}

export function AdminReportsView({ properties, rooms, organizations, invoices, payments, totalCollected, totalOutstanding, totalBilled, occupiedRooms }: Pick<AdminViewContentProps, "properties" | "rooms" | "organizations" | "invoices" | "payments" | "totalCollected" | "totalOutstanding" | "totalBilled" | "occupiedRooms">) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Hotel size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">หอพักทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{properties.length}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <KeyRound size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">อัตราเข้าพัก</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">
              {rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0}%
            </strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <WalletCards size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">รับชำระสะสม</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{money(totalCollected)}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <ReceiptText size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">ยอดค้างทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{money(totalOutstanding)}</strong>
          </div>
        </article>
      </section>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PLATFORM FINANCE</span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">สรุปรายกิจการ</h2>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            ยอดออกบิลรวม {money(totalBilled)}
          </span>
        </div>

        <AdminTable
          headers={["กิจการ", "หอพัก", "ห้อง", "ออกบิล", "รับชำระ", "ยอดค้าง"]}
          rows={organizations.map((organization) => {
            const orgInvoices = invoices.filter((item) => item.organization_id === organization.id);
            const orgPayments = payments.filter((item) => item.organization_id === organization.id && item.status === "confirmed");
            return [
              organization.name,
              properties.filter((item) => item.organization_id === organization.id).length,
              rooms.filter((item) => item.organization_id === organization.id).length,
              money(orgInvoices.reduce((sum, item) => sum + Number(item.total), 0)),
              money(orgPayments.reduce((sum, item) => sum + Number(item.amount), 0)),
              money(orgInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0)),
            ];
          })}
        />
      </section>
    </div>
  );
}
