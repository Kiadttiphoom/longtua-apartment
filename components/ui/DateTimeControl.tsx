"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type DateTimeMode = "date" | "month" | "time" | "datetime-local";

type DateTimeControlProps = {
  name: string;
  mode: DateTimeMode;
  defaultValue?: string | number | null;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  ariaLabel?: string;
  onValueChange?: (value: string) => void;
};

const weekdays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(2026, month, 1)));
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

export function DateTimeControl({ name, mode, defaultValue, placeholder, invalid = false, disabled = false, min, max, ariaLabel, onValueChange }: DateTimeControlProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialValue = String(defaultValue ?? "");
  const initial = parseValue(initialValue);
  const [value, setValue] = useState(initialValue);
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

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const width = Math.min(360, window.innerWidth - viewportPadding * 2);
    const desiredHeight = mode === "month" ? 330 : mode === "time" ? 390 : 500;
    const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
    const opensAbove = roomBelow < Math.min(desiredHeight, 300) && rect.top > roomBelow;
    const maxHeight = Math.max(240, Math.min(desiredHeight, opensAbove ? rect.top - viewportPadding : roomBelow));
    setPosition({ left: Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding), top: opensAbove ? Math.max(viewportPadding, rect.top - maxHeight - 8) : rect.bottom + 8, width, maxHeight });
  }, [mode]);

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
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    };
    const handleViewportChange = () => updatePosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  const isDisabledDate = (candidate: string) => (typeof min !== "undefined" && candidate < String(min)) || (typeof max !== "undefined" && candidate > String(max));
  const selectDay = (date: Date) => {
    const candidate = dateValue(date.getFullYear(), date.getMonth(), date.getDate());
    if (isDisabledDate(candidate)) return;
    setViewYear(date.getFullYear()); setViewMonth(date.getMonth()); setDay(date.getDate());
    if (mode === "date") commit(candidate);
  };
  const today = new Date();
  const selectedDate = dateValue(viewYear, viewMonth, day);

  const clock = (
    <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 my-2">
      <div className="flex-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 text-center">ชั่วโมง</span>
        <div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto p-1">
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
        <div className="grid grid-cols-4 gap-1 max-h-28 overflow-y-auto p-1">
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
      className="fixed z-[100] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 overflow-hidden"
      id={panelId}
      ref={panelRef}
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
    >
      {mode !== "time" ? (
        <>
          <header className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              aria-label={mode === "month" ? "ปีก่อนหน้า" : "เดือนก่อนหน้า"}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              onClick={() =>
                mode === "month"
                  ? setViewYear((current) => current - 1)
                  : viewMonth === 0
                  ? (setViewYear((current) => current - 1), setViewMonth(11))
                  : setViewMonth((current) => current - 1)
              }
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <strong className="text-sm font-bold text-slate-800">
              {mode === "month"
                ? String(viewYear + 543)
                : new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1))}
            </strong>
            <button
              aria-label={mode === "month" ? "ปีถัดไป" : "เดือนถัดไป"}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              onClick={() =>
                mode === "month"
                  ? setViewYear((current) => current + 1)
                  : viewMonth === 11
                  ? (setViewYear((current) => current + 1), setViewMonth(0))
                  : setViewMonth((current) => current + 1)
              }
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </header>
          {mode === "month" ? (
            <div className="grid grid-cols-3 gap-2 py-3">
              {monthNames.map((monthName, index) => (
                <button
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    value === `${viewYear}-${pad(index + 1)}`
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  key={monthName}
                  onClick={() => commit(`${viewYear}-${pad(index + 1)}`)}
                  type="button"
                >
                  {monthName}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-3">
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
          )}
        </>
      ) : null}
      {mode === "time" || mode === "datetime-local" ? clock : null}
      {mode !== "month" ? (
        <footer className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
            disabled={!value}
            onClick={() => commit("")}
            type="button"
          >
            <X size={14} />
            <span>ล้างค่า</span>
          </button>
          {mode === "date" ? (
            <button
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              onClick={() => commit(dateValue(today.getFullYear(), today.getMonth(), today.getDate()))}
              type="button"
            >
              วันนี้
            </button>
          ) : (
            <button
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs cursor-pointer"
              onClick={() => commit(mode === "time" ? `${pad(hour)}:${pad(minute)}` : `${selectedDate}T${pad(hour)}:${pad(minute)}`)}
              type="button"
            >
              ยืนยันเวลา
            </button>
          )}
        </footer>
      ) : null}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <input name={name} readOnly type="hidden" value={value} />
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid}
        aria-label={ariaLabel}
        className={`w-full h-10 px-3.5 flex items-center justify-between gap-2 rounded-xl border text-[13px] font-medium outline-none transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${
          invalid
            ? "border-rose-300 bg-rose-50/40 text-rose-900"
            : open
            ? "border-blue-500 bg-white ring-2 ring-blue-100 text-slate-900"
            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
        }`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className={value ? "text-slate-800 truncate" : "text-slate-400 truncate"}>
          {displayValue(value, mode) || placeholder || (mode === "month" ? "เลือกเดือน" : mode === "time" ? "เลือกเวลา" : "เลือกวันที่")}
        </span>
        {mode === "time" ? <Clock3 className="text-slate-400 shrink-0" size={16} /> : <CalendarDays className="text-slate-400 shrink-0" size={16} />}
      </button>
      {panel}
    </div>
  );
}
