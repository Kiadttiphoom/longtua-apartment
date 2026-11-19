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
    <header className="demo-page-heading">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            {eyebrow}
          </p>
        ) : null}
        <h1>{title}</h1>
        <p className="demo-page-description">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actionLabel ? (
          <button
            className="demo-control cursor-pointer"
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
