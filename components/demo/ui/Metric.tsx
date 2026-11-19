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
    <article className="demo-panel min-w-0">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneClasses}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      </div>
      <div className="px-4 py-3">
        <strong className="block text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
          {value}
        </strong>
        <small className="mt-1 block text-xs text-slate-600">{delta}</small>
      </div>
    </article>
  );
}
