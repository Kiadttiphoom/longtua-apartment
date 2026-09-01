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
  actions?: React.ReactNode;
};

export function CollectionToolbar({ title, description, query, onQueryChange, placeholder, filter, actions }: CollectionToolbarProps) {
  return (
    <section className={`portal-room-toolbar portal-collection-toolbar${filter ? "" : " no-filter"}${actions ? " with-actions" : ""}`}>
      <div><strong>{title}</strong><span>{description}</span></div>
      <label className="portal-room-search">
        <Search aria-hidden="true" size={16} />
        <input aria-label={placeholder} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} type="search" value={query} />
      </label>
      {filter ? <SelectControl ariaLabel={filter.label} onValueChange={filter.onChange} options={filter.options} value={filter.value} /> : null}
      {actions ? <div className="portal-toolbar-actions">{actions}</div> : null}
    </section>
  );
}
