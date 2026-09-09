"use client";

import { X } from "lucide-react";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { SelectControl } from "@/components/ui/SelectControl";

export type DateFilterMode = "date" | "month" | "year";

export interface DateFilterControlProps {
  mode: DateFilterMode;
  onModeChange: (mode: DateFilterMode) => void;
  value: string;
  onValueChange: (value: string) => void;
  availableYears?: string[];
  placeholderDate?: string;
  placeholderMonth?: string;
  allowedModes?: DateFilterMode[];
  className?: string;
}

export function DateFilterControl({
  mode,
  onModeChange,
  value,
  onValueChange,
  availableYears,
  placeholderDate = "ทุกวันที่ (ว/ด/ป)",
  placeholderMonth = "ทุกรอบเดือน (ด/ป)",
  allowedModes = ["date", "month", "year"],
  className = "",
}: DateFilterControlProps) {
  const currentYear = new Date().getFullYear();
  const years = availableYears && availableYears.length > 0
    ? availableYears
    : [String(currentYear + 1), String(currentYear), String(currentYear - 1), String(currentYear - 2)];

  return (
    <div className={`flex items-center gap-1.5 flex-wrap sm:flex-nowrap ${className}`}>
      {allowedModes.length > 1 && (
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 gap-0.5 shrink-0">
          {allowedModes.includes("date") && (
            <button
              aria-label="กรองรายวัน"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                mode === "date"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                onModeChange("date");
                onValueChange("");
              }}
              type="button"
            >
              วัน
            </button>
          )}
          {allowedModes.includes("month") && (
            <button
              aria-label="กรองรายเดือน"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                mode === "month"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                onModeChange("month");
                onValueChange("");
              }}
              type="button"
            >
              เดือน
            </button>
          )}
          {allowedModes.includes("year") && (
            <button
              aria-label="กรองรายปี"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                mode === "year"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                onModeChange("year");
                onValueChange("");
              }}
              type="button"
            >
              ปี
            </button>
          )}
        </div>
      )}

      <div className="min-w-[140px] flex-1 sm:flex-initial sm:w-[170px]">
        {mode === "year" ? (
          <SelectControl
            ariaLabel="เลือกปี"
            onValueChange={onValueChange}
            options={[
              { value: "", label: "ทุกปี" },
              ...years.map((y) => ({
                value: y,
                label: `ปี พ.ศ. ${Number(y) + 543}`,
              })),
            ]}
            triggerClassName="h-[42px] px-3.5 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold"
            value={value}
          />
        ) : (
          <DateTimeControl
            ariaLabel={mode === "date" ? "เลือกวันที่" : "เลือกรอบเดือน"}
            className="h-[42px] text-xs font-bold bg-slate-50 border-slate-200"
            defaultValue={value}
            key={mode}
            mode={mode}
            name="date_filter"
            onValueChange={onValueChange}
            placeholder={mode === "date" ? placeholderDate : placeholderMonth}
          />
        )}
      </div>

      {value ? (
        <button
          aria-label="ล้างตัวกรองวันที่"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
          onClick={() => onValueChange("")}
          title="ล้างตัวกรองวันที่"
          type="button"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
