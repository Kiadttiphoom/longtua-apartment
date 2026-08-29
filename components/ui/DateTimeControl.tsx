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

  const clock = <div className="ui-clock-picker">
    <div><span>ชั่วโมง</span><div>{Array.from({ length: 24 }, (_, index) => <button aria-pressed={hour === index} className={hour === index ? "selected" : ""} key={index} onClick={() => setHour(index)} type="button">{pad(index)}</button>)}</div></div>
    <div><span>นาที</span><div>{Array.from(new Set([...Array.from({ length: 12 }, (_, index) => index * 5), minute])).sort((a, b) => a - b).map((item) => <button aria-pressed={minute === item} className={minute === item ? "selected" : ""} key={item} onClick={() => setMinute(item)} type="button">{pad(item)}</button>)}</div></div>
  </div>;

  const panel = open && typeof document !== "undefined" ? createPortal(
    <div className="ui-datetime-popover" id={panelId} ref={panelRef} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}>
      {mode !== "time" ? <>
        <header><button aria-label={mode === "month" ? "ปีก่อนหน้า" : "เดือนก่อนหน้า"} onClick={() => mode === "month" ? setViewYear((current) => current - 1) : viewMonth === 0 ? (setViewYear((current) => current - 1), setViewMonth(11)) : setViewMonth((current) => current - 1)} type="button"><ChevronLeft size={18} /></button><strong>{mode === "month" ? String(viewYear + 543) : new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1))}</strong><button aria-label={mode === "month" ? "ปีถัดไป" : "เดือนถัดไป"} onClick={() => mode === "month" ? setViewYear((current) => current + 1) : viewMonth === 11 ? (setViewYear((current) => current + 1), setViewMonth(0)) : setViewMonth((current) => current + 1)} type="button"><ChevronRight size={18} /></button></header>
        {mode === "month" ? <div className="ui-month-grid">{monthNames.map((monthName, index) => <button className={value === `${viewYear}-${pad(index + 1)}` ? "selected" : ""} key={monthName} onClick={() => commit(`${viewYear}-${pad(index + 1)}`)} type="button">{monthName}</button>)}</div> : <><div className="ui-calendar-weekdays">{weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div><div className="ui-calendar-grid">{calendarDays.map((date) => { const candidate = dateValue(date.getFullYear(), date.getMonth(), date.getDate()); const isToday = candidate === dateValue(today.getFullYear(), today.getMonth(), today.getDate()); return <button aria-label={new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(date)} className={`${date.getMonth() !== viewMonth ? "outside" : ""} ${candidate === selectedDate ? "selected" : ""} ${isToday ? "today" : ""}`} disabled={isDisabledDate(candidate)} key={candidate} onClick={() => selectDay(date)} type="button">{date.getDate()}</button>; })}</div></>}
      </> : null}
      {mode === "time" || mode === "datetime-local" ? clock : null}
      {mode !== "month" ? <footer><button className="ui-picker-clear" disabled={!value} onClick={() => commit("")} type="button"><X size={14} />ล้างค่า</button>{mode === "date" ? <button onClick={() => commit(dateValue(today.getFullYear(), today.getMonth(), today.getDate()))} type="button">วันนี้</button> : <button className="confirm" onClick={() => commit(mode === "time" ? `${pad(hour)}:${pad(minute)}` : `${selectedDate}T${pad(hour)}:${pad(minute)}`)} type="button">ยืนยันเวลา</button>}</footer> : null}
    </div>,
    document.body,
  ) : null;

  return <div className="ui-date-control">
    <input name={name} readOnly type="hidden" value={value} />
    <button aria-controls={panelId} aria-expanded={open} aria-haspopup="dialog" aria-invalid={invalid} aria-label={ariaLabel} className={`ui-date-trigger ${open ? "open" : ""}`} disabled={disabled} onClick={() => open ? setOpen(false) : openPanel()} ref={triggerRef} role="combobox" type="button"><span className={value ? "" : "placeholder"}>{displayValue(value, mode) || placeholder || (mode === "month" ? "เลือกเดือน" : mode === "time" ? "เลือกเวลา" : "เลือกวันที่")}</span>{mode === "time" ? <Clock3 size={17} /> : <CalendarDays size={17} />}</button>
    {panel}
  </div>;
}
