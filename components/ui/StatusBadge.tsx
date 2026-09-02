import { statusLabel } from "@/lib/format";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  occupied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  vacant: "bg-blue-50 text-blue-700 border-blue-200",
  trialing: "bg-blue-50 text-blue-700 border-blue-200",
  issued: "bg-blue-50 text-blue-700 border-blue-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  void: "bg-rose-50 text-rose-700 border-rose-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export function StatusBadge({ status, label, compact = false }: { status: string; label?: string; compact?: boolean }) {
  const style = statusStyles[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]"
      } ${style}`}
    >
      <i aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{label ?? statusLabel(status)}</span>
    </span>
  );
}
