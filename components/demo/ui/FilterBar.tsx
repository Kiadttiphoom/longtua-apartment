import { useState } from "react";
import { Search } from "lucide-react";
import { SelectControl } from "@/components/ui/SelectControl";

export function FilterBar({
  placeholder,
  filters = [],
  value,
  onSearchChange,
}: {
  placeholder: string;
  filters?: Array<{ label: string; options: string[] }>;
  value?: string;
  onSearchChange?: (term: string) => void;
}) {
  const [internalValue, setInternalValue] = useState("");
  const searchTerm = value !== undefined ? value : internalValue;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <label className="flex items-center gap-2.5 px-3.5 h-10 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 text-xs transition-all flex-1">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          className="bg-transparent border-0 outline-none text-slate-800 w-full placeholder:text-slate-400 font-medium"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            if (onSearchChange) {
              onSearchChange(e.target.value);
            } else {
              setInternalValue(e.target.value);
            }
          }}
        />
      </label>
      {filters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <div key={f.label} className="min-w-[150px]">
              <SelectControl
                ariaLabel={f.label}
                options={[
                  { value: "", label: f.label },
                  ...f.options.map((opt) => ({ value: opt, label: opt })),
                ]}
                placeholder={f.label}
                searchable={false}
                value=""
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
