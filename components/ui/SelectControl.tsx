"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string; description?: string };

type SelectControlProps = {
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  searchable?: boolean;
  ariaLabel?: string;
  onValueChange?: (value: string, form: HTMLFormElement | null) => void;
};

type PanelPosition = { left: number; top: number; width: number; maxHeight: number };

export function SelectControl({
  name,
  options,
  value,
  defaultValue = "",
  placeholder = "เลือกรายการ",
  disabled = false,
  invalid = false,
  searchable,
  ariaLabel,
  onValueChange,
}: SelectControlProps) {
  const listboxId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<PanelPosition>({ left: 0, top: 0, width: 240, maxHeight: 320 });
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);
  const hasSearch = searchable ?? true;
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th-TH");
    return needle ? options.filter((option) => `${option.label} ${option.description ?? ""} ${option.value}`.toLocaleLowerCase("th-TH").includes(needle)) : options;
  }, [options, query]);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
    const preferredHeight = Math.min(360, Math.max(180, filtered.length * 44 + (hasSearch ? 58 : 12)));
    const opensAbove = roomBelow < Math.min(preferredHeight, 240) && rect.top > roomBelow;
    const maxHeight = Math.max(160, Math.min(preferredHeight, opensAbove ? rect.top - viewportPadding : roomBelow));
    const width = Math.max(rect.width, 240);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
    setPosition({ left, top: opensAbove ? Math.max(viewportPadding, rect.top - maxHeight - 8) : rect.bottom + 8, width, maxHeight });
  }, [filtered.length, hasSearch]);

  const openPanel = () => {
    if (disabled) return;
    updatePosition();
    const selectedIndex = filtered.findIndex((option) => option.value === selectedValue);
    setActiveIndex(Math.max(0, selectedIndex));
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    if (hiddenInputRef.current) hiddenInputRef.current.value = nextValue;
    onValueChange?.(nextValue, buttonRef.current?.closest("form") ?? null);
    closePanel();
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) closePanel();
    };
    const handleViewportChange = () => updatePosition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    const frame = requestAnimationFrame(() => { if (hasSearch) searchRef.current?.focus(); });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, hasSearch, updatePosition]);

  const moveActive = (delta: number) => {
    if (!filtered.length) return;
    setActiveIndex((current) => (current + delta + filtered.length) % filtered.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (!open) openPanel();
      else moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      if (!open) {
        event.preventDefault();
        openPanel();
      } else if (!hasSearch && filtered[activeIndex]) {
        event.preventDefault();
        choose(filtered[activeIndex].value);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closePanel();
    }
  };

  const panel = open && typeof document !== "undefined" ? createPortal(
    <div className="ui-select-popover" ref={panelRef} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}>
      {hasSearch ? <label className="ui-select-search"><Search size={16} /><input aria-label={`ค้นหา${ariaLabel ?? "รายการ"}`} ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); moveActive(event.key === "ArrowDown" ? 1 : -1); }
        if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex].value); }
        if (event.key === "Escape") { event.preventDefault(); closePanel(); buttonRef.current?.focus(); }
      }} placeholder="ค้นหา..." /></label> : null}
      <div aria-label={ariaLabel} className="ui-select-options" id={listboxId} role="listbox">
        {filtered.length ? filtered.map((option, index) => <button aria-selected={option.value === selectedValue} className={option.value === selectedValue ? "selected" : ""} data-active={index === activeIndex} id={`${listboxId}-${index}`} key={option.value} onClick={() => choose(option.value)} onMouseEnter={() => setActiveIndex(index)} role="option" tabIndex={-1} type="button"><span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span>{option.value === selectedValue ? <Check size={17} /> : null}</button>) : <div className="ui-select-empty">ไม่พบรายการที่ค้นหา</div>}
      </div>
    </div>,
    document.body,
  ) : null;

  return <>
    {name ? <input name={name} readOnly ref={hiddenInputRef} type="hidden" value={selectedValue} /> : null}
    <button aria-activedescendant={open && filtered[activeIndex] ? `${listboxId}-${activeIndex}` : undefined} aria-controls={listboxId} aria-expanded={open} aria-haspopup="listbox" aria-invalid={invalid} aria-label={ariaLabel} className={`ui-select-trigger ${open ? "open" : ""}`} disabled={disabled} onClick={() => open ? closePanel() : openPanel()} onKeyDown={handleKeyDown} ref={buttonRef} role="combobox" type="button"><span className={selected ? "" : "placeholder"}>{selected?.label ?? placeholder}</span><ChevronDown size={17} /></button>
    {panel}
  </>;
}
