import { Building2, LayoutGrid, ListFilter, Search } from "lucide-react";
import {
  SelectControl,
  type SelectOption,
} from "@/components/ui/SelectControl";

type ViewMode = "grid" | "table";

export function PropertyListToolbar({
  propertyName,
  description,
  placeholder,
  query,
  onQueryChange,
  filterLabel,
  status,
  options,
  onStatusChange,
  onClear,
  viewMode,
  onViewChange,
}: {
  propertyName?: string;
  description: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  filterLabel: string;
  status: string;
  options: SelectOption[];
  onStatusChange: (value: string) => void;
  onClear?: () => void;
  viewMode: ViewMode;
  onViewChange: (value: ViewMode) => void;
}) {
  return (
    <div className="p-4 lg:p-4.5 flex flex-wrap lg:flex-nowrap items-center gap-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="flex flex-col min-w-[180px] mr-auto">
        <strong className="text-slate-900 text-sm font-bold flex items-center gap-2">
          <Building2 size={15} className="text-blue-600" />
          <span>{propertyName}</span>
        </strong>
        <span className="text-slate-500 text-xs mt-0.5 font-medium">
          {description}
        </span>
      </div>
      <label className="flex items-center gap-2.5 px-3.5 h-10 min-w-[200px] max-w-sm flex-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
        <Search aria-hidden="true" size={16} strokeWidth={2.2} />
        <input
          aria-label={placeholder}
          className="w-full bg-transparent border-0 outline-none text-slate-900 text-xs font-medium placeholder:text-slate-400"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={query}
        />
      </label>
      <div className="min-w-[160px]">
        <SelectControl
          ariaLabel={filterLabel}
          onValueChange={onStatusChange}
          options={options}
          value={status}
        />
      </div>
      {onClear ? (
        <button
          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
          onClick={onClear}
          type="button"
        >
          ล้างตัวกรอง
        </button>
      ) : null}
      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
        <button
          aria-label="มุมมองตาราง"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            viewMode === "table"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => onViewChange("table")}
          type="button"
        >
          <ListFilter size={15} strokeWidth={2.2} />
          <span>ตาราง</span>
        </button>
        <button
          aria-label="มุมมองการ์ด"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            viewMode === "grid"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => onViewChange("grid")}
          type="button"
        >
          <LayoutGrid size={15} strokeWidth={2.2} />
          <span>การ์ด</span>
        </button>
      </div>
    </div>
  );
}
