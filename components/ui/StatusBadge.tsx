import { statusLabel } from "@/lib/format";

export function StatusBadge({ status, label, compact = false }: { status: string; label?: string; compact?: boolean }) {
  return <span className={`shared-status ${status}${compact ? " compact" : ""}`}>{label ?? statusLabel(status)}</span>;
}
