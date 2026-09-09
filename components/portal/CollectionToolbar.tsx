"use client";

import { Search } from "lucide-react";
import { SelectControl, type SelectOption } from "@/components/ui/SelectControl";

type CollectionToolbarProps = {
  title: string;
  description: string;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filter?: {
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
  };
  extraFilters?: React.ReactNode;
  actions?: React.ReactNode;
};

export function CollectionToolbar({ title, description, query, onQueryChange, placeholder, filter, extraFilters, actions }: CollectionToolbarProps) {
  return (
    <section className="mb-6 p-4 lg:p-5 flex flex-wrap lg:flex-nowrap items-center gap-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="flex flex-col min-w-[180px] mr-auto">
        <strong className="text-slate-800 text-[15px] font-bold">{title}</strong>
        <span className="text-slate-500 text-xs mt-0.5">{description}</span>
      </div>
      <label className="flex items-center gap-2.5 px-3.5 h-[42px] min-w-[220px] max-w-sm flex-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-100 transition-all">
        <Search aria-hidden="true" size={16} />
        <input
          aria-label={placeholder}
          className="w-full bg-transparent border-0 outline-none text-slate-800 text-[13px] placeholder:text-slate-400"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={query}
        />
      </label>
      {extraFilters ? <div className="flex items-center gap-2">{extraFilters}</div> : null}
      {filter ? (
        <div className="min-w-[160px]">
          <SelectControl ariaLabel={filter.label} onValueChange={filter.onChange} options={filter.options} value={filter.value} />
        </div>
      ) : null}
      {actions ? <div className="flex items-center gap-2.5 ml-auto lg:ml-0">{actions}</div> : null}
    </section>
  );
}
