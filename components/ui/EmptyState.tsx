import { Home } from "lucide-react";

export function EmptyState({ title, description, compact = false }: { title: string; description?: string; compact?: boolean }) {
  return <div className={`shared-empty${compact ? " compact" : ""}`}>
    {!compact ? <span><Home aria-hidden="true" size={25} /></span> : null}
    <h2>{title}</h2>
    {description ? <p>{description}</p> : null}
  </div>;
}
