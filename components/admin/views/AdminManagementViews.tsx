import Link from "next/link";
import { AlertTriangle, CheckCircle2, MessageCircle, Package, Pencil, Save, Trash2, XCircle } from "lucide-react";
import { approveTrialRequestAction, deleteRoleAction, rejectTrialRequestAction, saveMenuAction, saveRoleAction, saveSubscriptionPlanAction, setRegistrationEnabledAction, updateSubscriptionAction } from "@/app/(admin)/admin/actions";
import { AdminTable, dateInput, statusLabel, thaiDate } from "@/components/admin/AdminPrimitives";
import { RolePermissionMatrix, UserPermissionMatrix } from "@/components/admin/PermissionMatrix";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

const subscriptionStatuses = ["trialing", "active", "past_due", "readonly", "paused", "cancelled"];
const trialRiskLabels: Record<string, string> = {
  similar_property_name: "ชื่อคล้ายหอในระบบ",
  existing_tenant_phone: "เบอร์ตรงกับผู้เช่าเดิม",
};

export function AdminTrialRequestsView({ trialRequests }: Pick<AdminViewContentProps, "trialRequests">) {
  const pendingCount = trialRequests.filter((item) => item.status === "pending").length;
  return (
    <div className="space-y-6">
      <section className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
            {pendingCount}
          </div>
          <div>
            <strong className="text-sm font-bold text-amber-950 block">รอตรวจสอบ {pendingCount} คำขอ</strong>
            <p className="text-xs text-amber-800 mt-0.5">
              รับสูงสุด 20 กิจการทั้งระบบ อนุมัติเมื่อยืนยันว่าเป็นผู้ประกอบการจริงแล้วเท่านั้น ระบบจะสร้าง 1 กิจการ 1 หอ และเริ่ม Trial 30 วัน (สูงสุด 10 ห้อง)
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {trialRequests.map((item) => (
          <article className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4" key={item.id}>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-blue-600">{item.operator_name}</span>
                <h2 className="text-lg font-bold text-slate-800">{item.property_name}</h2>
                <small className="text-xs text-slate-400">@{item.username} · ส่งเมื่อ {thaiDate(item.submitted_at)}</small>
              </div>
              <StatusBadge compact label={statusLabel(item.status)} status={item.status} />
            </header>

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <dt className="text-slate-400 font-medium mb-0.5">อีเมลติดต่อ</dt>
                <dd className="font-semibold text-slate-700 truncate">{item.contact_email}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium mb-0.5">เบอร์โทร</dt>
                <dd className="font-semibold text-slate-700">{item.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium mb-0.5">จำนวนห้อง</dt>
                <dd className="font-semibold text-slate-700">{item.requested_room_count.toLocaleString("th-TH")} ห้อง</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium mb-0.5">Request ID</dt>
                <dd className="font-mono text-[11px] text-slate-600 truncate">{item.id}</dd>
              </div>
            </dl>

            {item.risk_flags.length ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="shrink-0 text-amber-600" size={16} />
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-semibold">ควรตรวจสอบเพิ่มเติม:</strong>
                  {item.risk_flags.map((flag) => (
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/60 font-medium" key={flag}>
                      {trialRiskLabels[flag] ?? flag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>ไม่พบสัญญาณซ้ำอัตโนมัติ</span>
              </div>
            )}

            {item.status === "pending" ? (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <form action={approveTrialRequestAction}>
                  <input name="requestId" type="hidden" value={item.id} />
                  <button
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                    type="submit"
                  >
                    <CheckCircle2 size={16} />
                    <span>อนุมัติและเริ่ม Trial</span>
                  </button>
                </form>
                <form action={rejectTrialRequestAction} className="flex items-center gap-2">
                  <input name="requestId" type="hidden" value={item.id} />
                  <input
                    aria-label="เหตุผลที่ปฏิเสธ"
                    className="h-9 px-3 rounded-xl border border-slate-200 text-xs placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 w-64"
                    maxLength={500}
                    minLength={3}
                    name="reason"
                    placeholder="ระบุเหตุผลที่ปฏิเสธ"
                    required
                  />
                  <button
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                    type="submit"
                  >
                    <XCircle size={16} />
                    <span>ปฏิเสธ</span>
                  </button>
                </form>
              </div>
            ) : null}

            {item.rejection_reason ? (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                <strong>เหตุผลที่ปฏิเสธ:</strong> {item.rejection_reason}
              </p>
            ) : null}
          </article>
        ))}
        {!trialRequests.length ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs">
            ยังไม่มีคำขอทดลองใช้
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function AdminLineView() {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-5">
      <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
        <MessageCircle size={28} />
      </span>
      <div className="space-y-1 flex-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ADD-ON</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">LINE แจ้งเตือน</h2>
        <p className="text-xs text-slate-500 max-w-xl">
          เมนูเตรียมไว้แล้ว แต่ระบบจริงยังไม่ได้เชื่อม LINE Messaging API จึงยังไม่มีการส่งข้อความออก เพื่อไม่ให้เกิดความสับสน
        </p>
      </div>
      <StatusBadge compact label="ยังไม่เชื่อมต่อ" status="inactive" />
    </section>
  );
}

export function AdminSubscriptionsView({ subscriptions, subscriptionPlans, organizationMap }: Pick<AdminViewContentProps, "subscriptions" | "subscriptionPlans" | "organizationMap">) {
  const plans = subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : [];

  return (
    <div className="space-y-8">
      {/* Section 1: Subscription Plans Catalogue */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Package size={13} />
              <span>SUBSCRIPTION PLANS CATALOGUE</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">แคตตาล็อกแพ็กเกจราคา</h2>
            <p className="text-xs text-slate-500">
              ข้อมูลแพ็กเกจนี้ถูกบันทึกในฐานข้อมูลและส่งต่อไปยังหน้าเว็บ longtua.com ผ่าน API <code>/api/public/plans</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => (
            <details
              key={plan.code}
              className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors"
            >
              <summary className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-50 transition-colors select-none">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${plan.is_active ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-slate-300"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{plan.name}</span>
                      <code className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-mono">
                        {plan.code}
                      </code>
                      {plan.badge ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {plan.badge}
                        </span>
                      ) : null}
                      {plan.popular ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          ยอดนิยม
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.target_audience || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-sm">
                      {plan.price_monthly === 0 ? "ฟรี" : `฿${plan.price_monthly.toLocaleString()}`}
                    </span>
                    <span className="text-slate-400 text-[11px]"> / {plan.period}</span>
                  </div>
                  <div className="hidden sm:flex flex-col text-[11px] text-slate-500 border-l border-slate-200 pl-4 space-y-0.5">
                    <span>{plan.max_properties_label || `${plan.max_properties} หอพัก`} · {plan.max_rooms_label || `${plan.max_rooms} ห้อง`}</span>
                    <span className="text-emerald-700 font-medium">
                      {plan.max_slip_verifications_label || `ตรวจสลิป ${plan.max_slip_verifications} ครั้ง`}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-open:text-slate-400 ml-2">
                    <Pencil size={13} />
                    <span className="group-open:hidden">แก้ไข</span>
                    <span className="hidden group-open:inline">ย่อ</span>
                  </span>
                </div>
              </summary>

              <form action={saveSubscriptionPlanAction} className="p-5 border-t border-slate-200 bg-white space-y-4">
                <input type="hidden" name="code" value={plan.code} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ชื่อแพ็กเกจ (Name)</label>
                    <input
                      name="name"
                      defaultValue={plan.name}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ราคาต่อเดือน (บาท)</label>
                    <input
                      name="priceMonthly"
                      type="number"
                      min={0}
                      defaultValue={plan.price_monthly}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ระยะเวลา (Period)</label>
                    <input
                      name="period"
                      defaultValue={plan.period || "เดือน"}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Badge ป้ายกำกับ</label>
                    <input
                      name="badge"
                      defaultValue={plan.badge || ""}
                      placeholder="เช่น ⭐ ยอดนิยม หรือ สำหรับองค์กร"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">โควตาหอพัก (Max Properties)</label>
                    <div className="flex gap-2">
                      <input
                        name="maxProperties"
                        type="number"
                        min={1}
                        defaultValue={plan.max_properties}
                        required
                        className="w-20 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        name="maxPropertiesLabel"
                        defaultValue={plan.max_properties_label}
                        placeholder="Label เช่น 1 หอพัก"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">โควตาห้องพัก (Max Rooms)</label>
                    <div className="flex gap-2">
                      <input
                        name="maxRooms"
                        type="number"
                        min={1}
                        defaultValue={plan.max_rooms}
                        required
                        className="w-20 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        name="maxRoomsLabel"
                        defaultValue={plan.max_rooms_label}
                        placeholder="Label เช่น รวมสูงสุด 100 ห้อง"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">โควตาผู้ใช้งาน (-1 = ไม่จำกัด)</label>
                    <div className="flex gap-2">
                      <input
                        name="maxUsers"
                        type="number"
                        defaultValue={plan.max_users}
                        required
                        className="w-20 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        name="maxUsersLabel"
                        defaultValue={plan.max_users_label}
                        placeholder="Label เช่น ผู้ใช้งาน 5 คน"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">โควตาตรวจสลิป (ต่อเดือน)</label>
                    <div className="flex gap-2">
                      <input
                        name="maxSlipVerifications"
                        type="number"
                        min={0}
                        defaultValue={plan.max_slip_verifications}
                        required
                        className="w-20 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        name="maxSlipVerificationsLabel"
                        defaultValue={plan.max_slip_verifications_label}
                        placeholder="Label เช่น ตรวจสลิป 150 ครั้ง / เดือน"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">กลุ่มเป้าหมาย (Target Audience)</label>
                    <input
                      name="targetAudience"
                      defaultValue={plan.target_audience}
                      placeholder="เช่น เจ้าของหลายอาคาร หรือหอพักขนาดกลาง"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        name="popular"
                        value="true"
                        defaultChecked={Boolean(plan.popular)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>ตั้งเป็นแพ็กเกจยอดนิยม (Highlighted)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        value="true"
                        defaultChecked={plan.is_active}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>เปิดใช้งานแพ็กเกจนี้</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    รายการฟีเจอร์ (1 บรรทัด = 1 ฟังก์ชัน)
                  </label>
                  <textarea
                    name="features"
                    rows={4}
                    defaultValue={Array.isArray(plan.features) ? plan.features.join("\n") : ""}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-sans bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="ตรวจสลิปโอนเงินอัตโนมัติ&#10;บันทึกมิเตอร์น้ำ-ไฟ&#10;ใบแจ้งหนี้ & ใบเสร็จรับเงินดิจิทัล"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    <Save size={14} />
                    <span>บันทึกการเปลี่ยนแปลงแพ็กเกจ {plan.name}</span>
                  </button>
                </div>
              </form>
            </details>
          ))}

          {plans.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
              ยังไม่มีข้อมูลแพ็กเกจในตาราง subscription_plans กรุณารัน migration <code>20260904170000_subscription_plans_and_usage.sql</code>
            </div>
          ) : null}
        </div>
      </section>

      {/* Section 2: Active Subscriptions List */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">การสมัครใช้งานจริง</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">สถานะสมาชิกและโควตารายกิจการ</h2>
        </div>

        <AdminTable
          headers={["กิจการ", "Trial", "สิ้นสุดรอบ", "โควตาหอ/ห้อง", "จัดการสิทธิ์ใช้งาน"]}
          rows={subscriptions.map((item) => [
            organizationMap.get(item.organization_id) ?? "—",
            thaiDate(item.trial_ends_at),
            thaiDate(item.current_period_end),
            <span key="q" className="text-xs text-slate-600 font-medium">
              {item.max_properties ?? 1} หอ / {item.max_rooms ?? 100} ห้อง
            </span>,
            <form action={updateSubscriptionAction} className="inline-flex flex-wrap items-center gap-2" key="f">
              <input name="organizationId" type="hidden" value={item.organization_id} />
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.status}
                name="status"
              >
                {subscriptionStatuses.map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
              <input
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={dateInput(item.access_until)}
                name="accessUntil"
                title="อนุญาตให้เข้าใช้งานได้ถึง"
                type="date"
              />
              <div className="flex items-center gap-1">
                <input
                  className="h-8 w-14 px-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue={item.max_properties ?? 1}
                  min={1}
                  max={50}
                  name="maxProperties"
                  placeholder="หอ"
                  title="โควตาหอพักสูงสุด"
                  type="number"
                />
                <span className="text-[11px] text-slate-400">หอ</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  className="h-8 w-16 px-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue={item.max_rooms ?? 100}
                  min={1}
                  max={5000}
                  name="maxRooms"
                  placeholder="ห้อง"
                  title="โควตาห้องพักสูงสุด"
                  type="number"
                />
                <span className="text-[11px] text-slate-400">ห้อง</span>
              </div>
              <button
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                type="submit"
              >
                บันทึก
              </button>
            </form>,
          ])}
        />
      </section>
    </div>
  );
}

export function AdminRolesView({ roles }: Pick<AdminViewContentProps, "roles">) {
  return (
    <div className="space-y-6">
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ROLE ใหม่</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">เพิ่มบทบาทใหม่</h2>
        </div>

        <form action={saveRoleAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="code"
            pattern="[a-z][a-z0-9_]{2,49}"
            placeholder="code เช่น auditor"
            required
          />
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="name"
            placeholder="ชื่อ Role"
            required
          />
          <select
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue="organization"
            name="scopeType"
          >
            <option value="platform">Platform</option>
            <option value="organization">กิจการ</option>
            <option value="property">หอพัก</option>
          </select>
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="description"
            placeholder="คำอธิบาย"
          />
          <button
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            type="submit"
          >
            เพิ่ม Role
          </button>
        </form>
      </section>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายการบทบาท</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">บทบาททั้งหมดในระบบ</h2>
        </div>

        <AdminTable
          headers={["Code", "แก้ไข Role", "ประเภท", "จัดการ"]}
          rows={roles.map((role) => [
            <code className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" key="c">
              {role.code}
            </code>,
            <form action={saveRoleAction} className="flex flex-wrap items-center gap-2" key="f">
              <input name="roleId" type="hidden" value={role.id} />
              <input
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={role.name}
                name="name"
                required
              />
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={role.scope_type}
                name="scopeType"
              >
                <option value="platform">Platform</option>
                <option value="organization">กิจการ</option>
                <option value="property">หอพัก</option>
              </select>
              <input
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                defaultValue={role.description ?? ""}
                name="description"
                placeholder="คำอธิบาย"
              />
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={role.status}
                name="status"
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
              <button
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                type="submit"
              >
                บันทึก
              </button>
            </form>,
            role.is_system ? "System" : "กำหนดเอง",
            !role.is_system && role.code !== "super_admin" ? (
              <form
                key="del"
                action={deleteRoleAction}
                onSubmit={(e) => {
                  if (!confirm(`ยืนยันการลบ Role "${role.name}" หรือไม่?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="roleId" value={role.id} />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="ลบ Role"
                >
                  <Trash2 size={15} />
                </button>
              </form>
            ) : (
              <span key="del" className="text-slate-400 text-xs">—</span>
            ),
          ])}
        />
      </section>
    </div>
  );
}

export function AdminPermissionsView({ granularPermissionsReady, params, organizations, roles, matrixActions, matrixMenus, matrixRoles, selectedRoleId, selectedOrganizationId, selectedOrganizationUsers, selectedUserId }: Pick<AdminViewContentProps, "granularPermissionsReady" | "params" | "organizations" | "roles" | "matrixActions" | "matrixMenus" | "matrixRoles" | "selectedRoleId" | "selectedOrganizationId" | "selectedOrganizationUsers" | "selectedUserId">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MENU × ACTION</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">กำหนดสิทธิ์การใช้งาน</h2>
        <p className="text-xs text-slate-500 mt-1">สิทธิ์รายผู้ใช้มีผลเหนือ Role และระบบจะปฏิเสธสิทธิ์ที่ไม่ได้กำหนดไว้โดยอัตโนมัติ</p>
      </div>

      {!granularPermissionsReady ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          ระบบสิทธิ์แบบละเอียดยังไม่พร้อม กรุณา apply migration <code>20260828101032_granular_menu_permissions.sql</code>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Link
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                params.mode !== "user" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
              href="/admin/permissions"
            >
              สิทธิ์ตาม Role
            </Link>
            <Link
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                params.mode === "user" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
              href="/admin/permissions?mode=user"
            >
              กำหนดเฉพาะผู้ใช้
            </Link>
          </div>

          {params.mode === "user" ? (
            <UserPermissionMatrix
              actions={matrixActions}
              menus={matrixMenus}
              organizations={organizations.map((item) => ({ id: item.id, name: item.name }))}
              organizationRoles={roles.filter((item) => item.scope_type === "organization" && item.status === "active").map((item) => ({ code: item.code, name: item.name }))}
              selectedOrganizationId={selectedOrganizationId}
              selectedUserId={selectedUserId}
              users={selectedOrganizationUsers}
            />
          ) : (
            <RolePermissionMatrix
              actions={matrixActions}
              menus={matrixMenus}
              roles={matrixRoles}
              selectedRoleId={selectedRoleId}
            />
          )}
        </div>
      )}
    </section>
  );
}

export function AdminMenusView({ menus, permissions }: Pick<AdminViewContentProps, "menus" | "permissions">) {
  return (
    <div className="space-y-6">
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MENU ใหม่</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">เพิ่มเมนูระบบ</h2>
        </div>

        <form action={saveMenuAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="code"
            pattern="[a-z][a-z0-9_]{2,49}"
            placeholder="menu_code"
            required
          />
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="label"
            placeholder="ชื่อเมนู"
            required
          />
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="href"
            pattern="/.*"
            placeholder="/path"
            required
          />
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            name="icon"
            placeholder="Icon เช่น Circle"
          />
          <input
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue="100"
            name="sortOrder"
            type="number"
          />
          <select
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue=""
            name="requiredPermission"
          >
            <option value="">ไม่กำหนด Permission</option>
            {permissions.map((permission) => (
              <option key={permission.code} value={permission.code}>{permission.code}</option>
            ))}
          </select>
          <select
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue="customer"
            name="audience"
          >
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <button
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            type="submit"
          >
            เพิ่มเมนู
          </button>
        </form>
      </section>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายการเมนู</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">เมนูทั้งหมดในระบบ</h2>
        </div>

        <AdminTable
          headers={["Code", "แก้ไขเมนู"]}
          rows={menus.map((item) => [
            <code className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" key="c">
              {item.code}
            </code>,
            <form action={saveMenuAction} className="flex flex-wrap items-center gap-2" key="f">
              <input name="menuId" type="hidden" value={item.id} />
              <input
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.label}
                name="label"
                required
              />
              <input
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.href}
                name="href"
                required
              />
              <input
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                defaultValue={item.icon}
                name="icon"
              />
              <input
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-16"
                defaultValue={item.sort_order}
                name="sortOrder"
                type="number"
              />
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.required_permission ?? ""}
                name="requiredPermission"
              >
                <option value="">ไม่กำหนด</option>
                {permissions.map((permission) => (
                  <option key={permission.code} value={permission.code}>{permission.code}</option>
                ))}
              </select>
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.audience}
                name="audience"
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
                <option value="all">ทั้งหมด</option>
              </select>
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.status}
                name="status"
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
              <button
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                type="submit"
              >
                บันทึก
              </button>
            </form>,
          ])}
        />
      </section>
    </div>
  );
}

export function AdminAuditView({ audits, profileMap }: Pick<AdminViewContentProps, "audits" | "profileMap">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">LOGS</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Audit Log</h2>
      </div>

      <AdminTable
        headers={["เวลา", "ผู้ดำเนินการ", "เหตุการณ์", "ข้อมูล", "รายละเอียด"]}
        rows={audits.map((item) => [
          thaiDate(item.created_at),
          profileMap.get(item.actor_user_id ?? "") ?? "ระบบ",
          item.action,
          `${item.entity_type}${item.entity_id ? ` · ${item.entity_id}` : ""}`,
          <details className="cursor-pointer text-xs text-blue-600" key="d">
            <summary className="font-medium">ดูการเปลี่ยนแปลง</summary>
            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-w-lg">
              {JSON.stringify({ before: item.before_data, after: item.after_data }, null, 2)}
            </pre>
          </details>,
        ])}
        empty="ยังไม่มี Audit Log"
      />
    </section>
  );
}

export function AdminSettingsView({ registration }: Pick<AdminViewContentProps, "registration">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">การตั้งค่าระบบ</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">เปิด/ปิดคำขอทดลองใช้</h2>
        <p className="text-xs text-slate-500 max-w-xl">
          ควบคุมการรับคำขอจากหน้าสมัครสมาชิกในแอปและเว็บไซต์หลัก เมื่อครบ 20 กิจการจะไม่รับสมัครหรืออนุมัติเพิ่ม แม้เปิดสวิตช์ไว้ ผู้ใช้เดิมยังเข้าสู่ระบบได้ตามปกติ และคำขอที่ส่งแล้วไม่ถูกลบ
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            registration.enabled
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {registration.enabled ? "เปิดรับคำขอ" : "ปิดรับคำขอ"}
        </span>
        <form action={setRegistrationEnabledAction}>
          <input name="enabled" type="hidden" value={registration.enabled ? "false" : "true"} />
          <button
            className={`h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
              registration.enabled
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            type="submit"
          >
            {registration.enabled ? "ปิดรับคำขอ" : "เปิดรับคำขอ"}
          </button>
        </form>
      </div>
    </section>
  );
}
