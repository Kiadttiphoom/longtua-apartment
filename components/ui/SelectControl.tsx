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
  triggerClassName?: string;
  panelWidth?: number;
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
  triggerClassName,
  panelWidth,
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
    const width = panelWidth ?? Math.max(rect.width, 240);
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
    <div
      className="fixed z-[200] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      ref={panelRef}
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
    >
      {hasSearch ? (
        <label className="p-2.5 border-b border-slate-100 flex items-center gap-2 text-slate-400 bg-slate-50/50">
          <Search size={15} />
          <input
            aria-label={`ค้นหา${ariaLabel ?? "รายการ"}`}
            className="w-full bg-transparent border-0 outline-none text-slate-800 text-xs placeholder:text-slate-400"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                moveActive(event.key === "ArrowDown" ? 1 : -1);
              }
              if (event.key === "Enter" && filtered[activeIndex]) {
                event.preventDefault();
                choose(filtered[activeIndex].value);
              }
              if (event.key === "Escape") {
                event.preventDefault();
                closePanel();
                buttonRef.current?.focus();
              }
            }}
            placeholder="ค้นหา..."
            ref={searchRef}
            value={query}
          />
        </label>
      ) : null}
      <div aria-label={ariaLabel} className="flex-1 overflow-y-auto p-1.5 space-y-0.5" id={listboxId} role="listbox">
        {filtered.length ? (
          filtered.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isActive = index === activeIndex;
            return (
              <button
                aria-selected={isSelected}
                className={`w-full px-3 py-2 flex items-center justify-between rounded-xl text-left text-[13px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : isActive
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                data-active={isActive}
                id={`${listboxId}-${index}`}
                key={option.value}
                onClick={() => choose(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <span className="flex flex-col">
                  <strong>{option.label}</strong>
                  {option.description ? <small className="text-[11px] text-slate-400 font-normal">{option.description}</small> : null}
                </span>
                {isSelected ? <Check className="text-blue-600" size={16} /> : null}
              </button>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">ไม่พบรายการที่ค้นหา</div>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      {name ? <input name={name} readOnly ref={hiddenInputRef} type="hidden" value={selectedValue} /> : null}
      <button
        aria-activedescendant={open && filtered[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        aria-label={ariaLabel}
        className={
          triggerClassName
            ? `${triggerClassName} flex items-center justify-between gap-1.5 outline-none cursor-pointer transition-all ${
                open ? "ring-2 ring-blue-500/20" : ""
              }`
            : `w-full h-10 px-3.5 flex items-center justify-between gap-2 rounded-xl border text-[13px] font-medium outline-none transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${
                invalid
                  ? "border-rose-300 bg-rose-50/40 text-rose-900"
                  : open
                  ? "border-blue-500 bg-white ring-2 ring-blue-100 text-slate-900"
                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
              }`
        }
        disabled={disabled}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        role="combobox"
        type="button"
      >
        <span className={selected ? "text-slate-800 truncate" : "text-slate-400 truncate"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180 text-blue-600" : ""}`} size={16} />
      </button>
      {panel}
    </>
  );
}
