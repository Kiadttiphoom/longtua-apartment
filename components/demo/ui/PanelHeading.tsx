import { ChevronRight } from "lucide-react";

export function PanelHeading({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-1">
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {action ? (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-0"
          type="button"
        >
          <span>{action}</span>
          <ChevronRight size={14} />
        </button>
      ) : null}
    </div>
  );
}
