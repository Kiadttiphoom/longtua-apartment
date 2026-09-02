import { Home, Plus } from "lucide-react";

export function EmptyState({
  title,
  description,
  compact = false,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-white ${compact ? "py-6 px-4" : "py-12 px-6"}`}>
      {!compact ? (
        <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
          <Home aria-hidden="true" size={24} />
        </span>
      ) : null}
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {description ? <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          onClick={onAction}
          type="button"
        >
          <Plus size={15} />
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
