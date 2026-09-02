import type { ReactNode } from "react";
import { Plus } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{eyebrow}</p> : null}
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel ? (
          <button
            className="h-10 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            onClick={onAction}
            type="button"
          >
            <Plus size={16} />
            <span>{actionLabel}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
