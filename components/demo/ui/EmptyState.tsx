import { Search } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center gap-2 text-slate-400 text-xs">
      <Search size={24} className="text-slate-300" />
      <span>{message}</span>
    </div>
  );
}
