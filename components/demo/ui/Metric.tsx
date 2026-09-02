import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export function Metric({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<LucideProps>;
  tone: string;
}) {
  const toneClasses =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
      : tone === "orange"
      ? "bg-amber-50 text-amber-600 border border-amber-100"
      : tone === "violet" || tone === "purple"
      ? "bg-purple-50 text-purple-600 border border-purple-100"
      : "bg-blue-50 text-blue-600 border border-blue-100";

  return (
    <article className="p-5 flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${toneClasses}`}>
        <Icon size={20} />
      </span>
      <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
      <strong className="text-2xl font-bold text-slate-800 tracking-tight">{value}</strong>
      <small className="text-[11px] text-slate-400 mt-1">{delta}</small>
    </article>
  );
}
