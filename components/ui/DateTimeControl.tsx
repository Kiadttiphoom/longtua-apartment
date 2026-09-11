"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SelectControl } from "@/components/ui/SelectControl";

export type DateTimeMode = "date" | "month" | "time" | "datetime-local";

type DateTimeControlProps = {
  name: string;
  mode?: DateTimeMode;
  type?: DateTimeMode;
  defaultValue?: string | number | null;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  ariaLabel?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

const weekdays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(2026, month, 1)));
const monthNamesLong = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("th-TH", { month: "long" }).format(new Date(2026, month, 1)));
const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

function parseValue(value: string) {
  const now = new Date();
  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?$/);
  const timeMatch = value.match(/^(\d{2}):(\d{2})$/);
  return {
    year: match ? Number(match[1]) : now.getFullYear(),
    month: match ? Number(match[2]) - 1 : now.getMonth(),
    day: match?.[3] ? Number(match[3]) : now.getDate(),
    hour: match?.[4] ? Number(match[4]) : timeMatch ? Number(timeMatch[1]) : now.getHours(),
    minute: match?.[5] ? Number(match[5]) : timeMatch ? Number(timeMatch[2]) : Math.floor(now.getMinutes() / 5) * 5,
  };
}

function displayValue(value: string, mode: DateTimeMode) {
  if (!value) return "";
  if (mode === "time") return `${value} น.`;
  const parsed = parseValue(value);
  if (mode === "month") return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(parsed.year, parsed.month, 1));
  const date = new Date(parsed.year, parsed.month, parsed.day);
  const formattedDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
  return mode === "datetime-local" ? `${formattedDate} · ${pad(parsed.hour)}:${pad(parsed.minute)} น.` : formattedDate;
}

export function DateTimeControl({ name, mode, type, defaultValue, placeholder, invalid = false, disabled = false, min, max, ariaLabel, className, onValueChange }: DateTimeControlProps) {
  const activeMode = mode ?? type ?? "date";
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [value, setValue] = useState(String(defaultValue ?? ""));
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setValue(String(defaultValue ?? ""));
  }
  const initial = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 340, maxHeight: 520 });

  const calendarDays = useMemo(() => {
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => new Date(viewYear, viewMonth, index - firstWeekday + 1));
  }, [viewYear, viewMonth]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = Math.min(viewYear - 10, currentYear - 80);
    const end = Math.max(viewYear + 10, currentYear + 30);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [viewYear]);

  const monthOptions = useMemo(
    () =>
      monthNamesLong.map((monthName, index) => ({
        value: String(index),
        label: monthName,
      })),
    [],
  );

  const yearSelectOptions = useMemo(
    () =>
      yearOptions.map((y) => ({
        value: String(y),
        label: `พ.ศ. ${y + 543} (${y})`,
      })),
    [yearOptions],
  );

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }

    const viewportPadding = 12;
    const isMobile = window.innerWidth < 480;
    const width = isMobile ? window.innerWidth - viewportPadding * 2 : Math.min(360, window.innerWidth - viewportPadding * 2);
    const panelMeasuredHeight = panelRef.current?.offsetHeight;
    const estimatedHeight = activeMode === "month" ? 230 : activeMode === "time" ? 340 : activeMode === "datetime-local" ? 520 : 380;
    const contentHeight = panelMeasuredHeight || estimatedHeight;

    const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
    const roomAbove = rect.top - viewportPadding;

    const opensAbove = roomBelow < contentHeight && roomAbove > roomBelow;

    let top: number;
    let maxHeight: number;

    if (opensAbove) {
      maxHeight = Math.min(contentHeight, Math.max(180, roomAbove));
      top = Math.max(viewportPadding, rect.top - (panelMeasuredHeight || maxHeight) - 8);
    } else {
      maxHeight = Math.min(contentHeight, Math.max(180, roomBelow));
      top = rect.bottom + 8;
    }

    if (window.innerHeight < 680 && activeMode === "datetime-local" && roomBelow < 380 && roomAbove < 380) {
      maxHeight = Math.min(520, window.innerHeight - viewportPadding * 2);
      top = Math.max(viewportPadding, Math.round((window.innerHeight - maxHeight) / 2));
    }

    const left = isMobile
      ? viewportPadding
      : Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);

    setPosition({ left, top, width, maxHeight });
  }, [activeMode]);

  const openPanel = () => {
    if (disabled) return;
    const parsed = parseValue(value);
    setViewYear(parsed.year); setViewMonth(parsed.month); setDay(parsed.day); setHour(parsed.hour); setMinute(parsed.minute);
    updatePosition();
    setOpen(true);
  };

  const commit = (nextValue: string) => {
    setValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(() => updatePosition());

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target) &&
        !target?.closest?.('[role="listbox"], [role="option"]')
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    };

    const handleResize = () => updatePosition();

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      // Scrolling inside the panel (e.g. year select list or clock time list) should not close the panel
      if (
        target &&
        (panelRef.current?.contains(target) ||
          (target instanceof Element && target.closest?.('[role="listbox"], [role="option"]')))
      ) {
        return;
      }
      // Scrolling the page closes the popover to prevent detachment
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updatePosition]);

  const isDisabledDate = (candidate: string) => (typeof min !== "undefined" && candidate < String(min)) || (typeof max !== "undefined" && candidate > String(max));
  const selectDay = (date: Date) => {
    const candidate = dateValue(date.getFullYear(), date.getMonth(), date.getDate());
    if (isDisabledDate(candidate)) return;
    setViewYear(date.getFullYear()); setViewMonth(date.getMonth()); setDay(date.getDate());
    if (activeMode === "date") commit(candidate);
  };
  const today = new Date();
  const selectedDate = dateValue(viewYear, viewMonth, day);

  const clock = (
    <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 my-2">
      <div className="flex-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 text-center">ชั่วโมง</span>
        <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-1">
          {Array.from({ length: 24 }, (_, index) => (
            <button
              aria-pressed={hour === index}
              className={`h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                hour === index ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-200 text-slate-700"
              }`}
              key={index}
              onClick={() => setHour(index)}
              type="button"
            >
              {pad(index)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 text-center">นาที</span>
        <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto p-1">
          {Array.from(new Set([...Array.from({ length: 12 }, (_, index) => index * 5), minute]))
            .sort((a, b) => a - b)
            .map((item) => (
              <button
                aria-pressed={minute === item}
                className={`h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  minute === item ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-200 text-slate-700"
                }`}
                key={item}
                onClick={() => setMinute(item)}
                type="button"
              >
                {pad(item)}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const panel = open && typeof document !== "undefined" ? createPortal(
    <div
      className="fixed z-[150] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      id={panelId}
      ref={panelRef}
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
    >
      {activeMode !== "time" ? (
        <header className="shrink-0 flex items-center justify-between p-3.5 pb-2.5 border-b border-slate-100 gap-1.5 bg-white">
          <button
            aria-label={activeMode === "month" ? "ปีก่อนหน้า" : "เดือนก่อนหน้า"}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            onClick={() =>
              activeMode === "month"
                ? setViewYear((current) => current - 1)
                : viewMonth === 0
                ? (setViewYear((current) => current - 1), setViewMonth(11))
                : setViewMonth((current) => current - 1)
            }
            type="button"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            {activeMode !== "month" ? (
              <div className="w-[124px]">
                <SelectControl
                  ariaLabel="เลือกเดือน"
                  onValueChange={(val) => setViewMonth(Number(val))}
                  options={monthOptions}
                  panelWidth={140}
                  searchable={false}
                  triggerClassName="w-full h-8 px-2 rounded-lg border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-bold text-slate-800"
                  value={String(viewMonth)}
                />
              </div>
            ) : null}

            <div className="w-[145px]">
              <SelectControl
                ariaLabel="เลือกปี"
                onValueChange={(val) => setViewYear(Number(val))}
                options={yearSelectOptions}
                panelWidth={175}
                searchable={true}
                triggerClassName="w-full h-8 px-2 rounded-lg border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-bold text-slate-800 font-mono"
                value={String(viewYear)}
              />
            </div>
          </div>

          <button
            aria-label={activeMode === "month" ? "ปีถัดไป" : "เดือนถัดไป"}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            onClick={() =>
              activeMode === "month"
                ? setViewYear((current) => current + 1)
                : viewMonth === 11
                ? (setViewYear((current) => current + 1), setViewMonth(0))
                : setViewMonth((current) => current + 1)
            }
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </header>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-1">
        {activeMode === "month" ? (
          <div className="grid grid-cols-3 gap-2 py-3">
            {monthNames.map((monthName, index) => (
              <button
                className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  value === `${viewYear}-${pad(index + 1)}`
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                disabled={isDisabledDate(`${viewYear}-${pad(index + 1)}`)}
                key={monthName}
                onClick={() => commit(`${viewYear}-${pad(index + 1)}`)}
                type="button"
              >
                {monthName}
              </button>
            ))}
          </div>
        ) : activeMode !== "time" ? (
          <div className="py-2.5">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1.5">
              {weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((date) => {
                const candidate = dateValue(date.getFullYear(), date.getMonth(), date.getDate());
                const isToday = candidate === dateValue(today.getFullYear(), today.getMonth(), today.getDate());
                const isSelected = candidate === selectedDate;
                const isOutside = date.getMonth() !== viewMonth;
                return (
                  <button
                    aria-label={new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(date)}
                    className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : isToday
                        ? "border border-blue-400 text-blue-600 font-semibold"
                        : isOutside
                        ? "text-slate-300 hover:bg-slate-50"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    disabled={isDisabledDate(candidate)}
                    key={candidate}
                    onClick={() => selectDay(date)}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeMode === "time" || activeMode === "datetime-local" ? clock : null}
      </div>

      {activeMode !== "month" ? (
        <footer className="shrink-0 flex items-center justify-between p-3 border-t border-slate-100 bg-white gap-2">
          <button
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
            disabled={!value}
            onClick={() => commit("")}
            type="button"
          >
            <X size={14} />
            <span>ล้างค่า</span>
          </button>

          <div className="flex items-center gap-1.5">
            {activeMode === "datetime-local" && (
              <button
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition"
                onClick={() => {
                  const now = new Date();
                  const yr = now.getFullYear();
                  const m = now.getMonth();
                  const d = now.getDate();
                  const h = now.getHours();
                  const min5 = Math.floor(now.getMinutes() / 5) * 5;
                  setViewYear(yr);
                  setViewMonth(m);
                  setDay(d);
                  setHour(h);
                  setMinute(min5);
                  commit(`${dateValue(yr, m, d)}T${pad(h)}:${pad(min5)}`);
                }}
                type="button"
                title="ตั้งเวลาเป็นเวลาปัจจุบัน"
              >
                ตอนนี้
              </button>
            )}

            {activeMode === "date" ? (
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                onClick={() => commit(dateValue(today.getFullYear(), today.getMonth(), today.getDate()))}
                type="button"
              >
                วันนี้
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer transition"
                onClick={() => commit(activeMode === "time" ? `${pad(hour)}:${pad(minute)}` : `${selectedDate}T${pad(hour)}:${pad(minute)}`)}
                type="button"
              >
                ตกลง
              </button>
            )}
          </div>
        </footer>
      ) : null}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative min-w-0">
      <input name={name} readOnly type="hidden" value={value} />
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid}
        aria-label={ariaLabel}
        className={`w-full min-w-0 h-11 px-3.5 flex items-center justify-between gap-2 rounded-xl border text-xs font-bold outline-none transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${
          invalid
            ? "border-rose-300 bg-rose-50/40 text-rose-900"
            : open
            ? "border-blue-600 bg-white ring-4 ring-blue-500/15 text-slate-900 shadow-2xs"
            : "border-slate-200/90 bg-slate-50/50 hover:bg-white text-slate-800 hover:border-slate-300"
        } ${className ?? ""}`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className={value ? "text-slate-800 truncate font-mono font-bold" : "text-slate-400 truncate font-normal"}>
          {displayValue(value, activeMode) || placeholder || (activeMode === "month" ? "เลือกเดือน" : activeMode === "time" ? "เลือกเวลา" : "เลือกวันที่")}
        </span>
        {activeMode === "time" ? <Clock3 className="text-slate-400 shrink-0" size={16} /> : <CalendarDays className="text-slate-400 shrink-0" size={16} />}
      </button>
      {panel}
    </div>
  );
}
