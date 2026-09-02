export function StatusBadge({ status }: { status: string }) {
  if (
    status === "active" ||
    status === "อยู่ระหว่างเช่า" ||
    status === "มีผลอยู่" ||
    status === "กำลังใช้งาน" ||
    status === "ชำระแล้ว" ||
    status === "มีผู้เช่า" ||
    status === "บันทึกแล้ว"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        {status === "active" ? "Active" : status}
      </span>
    );
  }
  if (
    status === "trial" ||
    status === "draft" ||
    status === "ร่าง" ||
    status === "ห้องว่าง" ||
    status === "รอชำระ"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <i className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
        {status === "trial" ? "Trial" : status}
      </span>
    );
  }
  if (status === "warning" || status === "ใกล้หมดอายุ" || status === "รอมิเตอร์") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <i className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        {status}
      </span>
    );
  }
  if (
    status === "danger" ||
    status === "expired" ||
    status === "หมดอายุ" ||
    status === "เกินกำหนด" ||
    status === "ยกเลิก" ||
    status === "สัญญาหมด"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <i className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
        {status === "expired" ? "หมดอายุ" : status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      <i className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
      {status}
    </span>
  );
}
