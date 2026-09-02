export function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const barBg =
    color === "emerald" || color === "green"
      ? "bg-emerald-500"
      : color === "rose" || color === "red"
      ? "bg-rose-500"
      : "bg-blue-500";
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <strong className="font-semibold text-slate-700">{label}</strong>
        <small className="text-slate-400">
          {value} กิจการ ({pct}%)
        </small>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barBg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
