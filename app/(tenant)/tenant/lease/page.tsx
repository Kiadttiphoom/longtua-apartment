import { requireTenantContext } from "@/lib/auth/tenant-access";
import { ContractUploadForm } from "@/components/tenant/ContractUploadForm";
import { TenantContractList } from "@/components/tenant/TenantContractList";
import {
  Calendar,
  FileText,
  Home,
  ShieldCheck,
} from "lucide-react";
import { money, thaiDate } from "@/lib/format";

export default async function TenantLeasePage() {
  const context = await requireTenantContext();
  const { supabase, organizationId, tenantId } = context;

  // Load leases with complete details
  const { data: leases } = await supabase
    .from("leases")
    .select("id, lease_number, property_id, room_id, start_date, end_date, rent_amount, deposit_amount, advance_amount, occupant_count, terms, status")
    .eq("organization_id", organizationId)
    .eq("primary_tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Load rooms and properties
  const [roomsRes, propertiesRes, filesRes] = await Promise.all([
    supabase.from("rooms").select("id, room_number, floor, property_id").eq("organization_id", organizationId),
    supabase.from("properties").select("id, name, address, phone").eq("organization_id", organizationId),
    supabase
      .from("tenant_contract_uploads")
      .select("id, file_name, created_at, lease_id")
      .eq("tenant_id", tenantId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);

  const rooms = roomsRes.data ?? [];
  const properties = propertiesRes.data ?? [];
  const files = filesRes.data ?? [];

  const uploadCountsByLease: Record<string, number> = {};
  files.forEach((f) => {
    if (f.lease_id) {
      uploadCountsByLease[f.lease_id] = (uploadCountsByLease[f.lease_id] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            เอกสารห้องพัก
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            สัญญาเช่าของฉัน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รายละเอียดข้อตกลง ค่าเช่า เงินประกัน และหลักฐานสัญญาเช่าดิจิทัล
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <FileText size={24} />
        </span>
      </header>

      {/* Lease Overview Cards */}
      {leases && leases.length > 0 ? (
        leases.map((lease) => {
          const room = rooms.find((r) => r.id === lease.room_id);
          const property = properties.find((p) => p.id === lease.property_id);

          return (
            <article
              key={lease.id}
              className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs"
            >
              {/* Card Header with Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                    <Home size={20} />
                  </span>
                  <div>
                    <strong className="block text-base font-bold text-slate-900">
                      ห้อง {room?.room_number ?? "—"}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {property?.name ?? "หอพัก"} · ชั้น {room?.floor || 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-600 px-2.5 py-1 rounded-xl bg-white border border-slate-200">
                    เลขที่สัญญา: {lease.lease_number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      lease.status === "active"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {lease.status === "active" ? "สัญญาปกติ" : "สิ้นสุดสัญญา"}
                  </span>
                </div>
              </div>

              {/* Financial & Terms Breakdown */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-blue-50/60 p-4 border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700 block">
                      ค่าเช่ารายเดือน
                    </span>
                    <strong className="text-xl sm:text-2xl font-black text-blue-900 mt-1 block tabular-nums">
                      {money(Number(lease.rent_amount))}
                    </strong>
                    <span className="text-[10px] text-blue-600 mt-0.5 block">บาท / เดือน</span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block">
                      เงินประกันความเสียหาย
                    </span>
                    <strong className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block tabular-nums">
                      {money(Number(lease.deposit_amount))}
                    </strong>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">คืนเมื่อย้ายออก</span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block">
                      ค่าเช่าล่วงหน้า
                    </span>
                    <strong className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block tabular-nums">
                      {money(Number(lease.advance_amount))}
                    </strong>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">ชำระตอนเข้าอยู่</span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block">
                      ผู้พักอาศัยที่ลงทะเบียน
                    </span>
                    <strong className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block tabular-nums">
                      {lease.occupant_count ?? 1} ท่าน
                    </strong>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">ตามสัญญาเช่า</span>
                  </div>
                </div>

                {/* Duration & Period */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700">
                      <Calendar size={18} />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        ระยะเวลาสัญญา
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        {thaiDate(lease.start_date)} — {lease.end_date ? thaiDate(lease.end_date) : "ไม่ระบุวันสิ้นสุด"}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>สัญญาผ่านการยืนยันตัวตนถูกต้อง</span>
                  </div>
                </div>

                {/* Terms text if provided */}
                {lease.terms && (
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <strong className="text-slate-800 font-bold block">เงื่อนไขเพิ่มเติม:</strong>
                    <p className="whitespace-pre-wrap leading-relaxed">{lease.terms}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <FileText size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">ไม่พบข้อมูลสัญญาเช่าที่ผูกกับบัญชีนี้</p>
        </section>
      )}

      {/* Contract Upload Form Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">แนบไฟล์หรือรูปภาพสัญญา</h2>
            <p className="text-xs text-slate-500">
              ถ่ายรูปสัญญาหรือแนบไฟล์เก็บไว้ในระบบเพื่อความสะดวกในการเปิดดู (สูงสุด 5 ภาพ)
            </p>
          </div>
        </div>

        <ContractUploadForm
          leases={(leases ?? []).map((l) => ({ id: l.id, lease_number: l.lease_number }))}
          uploadCountsByLease={uploadCountsByLease}
        />
      </section>

      {/* Uploaded Files Gallery Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">แกลเลอรีภาพสัญญาที่แนบไว้</h2>
            <p className="text-xs text-slate-500">
              คลิกที่รูปเพื่อเปิดดูแบบเต็มจอ ขยายดูตัวหนังสือ หรือดาวน์โหลดเก็บไว้
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 px-3 py-1 rounded-xl bg-white border border-slate-200">
            {files.length} ไฟล์
          </span>
        </div>

        <TenantContractList files={files} />
      </section>
    </div>
  );
}

