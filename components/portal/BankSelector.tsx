"use client";

import { useState } from "react";
import { SUPPORTED_BANKS, findBank, type BankOption } from "@/lib/constants/banks";
import { Check, ChevronDown, Landmark } from "lucide-react";

export function BankSelector({
  initialBank,
  onSelect,
  allowNone = false,
}: {
  initialBank?: string | null;
  onSelect?: (bank: BankOption | null) => void;
  allowNone?: boolean;
}) {
  const defaultBank = initialBank ? findBank(initialBank) ?? null : null;
  const [selected, setSelected] = useState<BankOption | null>(defaultBank);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBanks = SUPPORTED_BANKS.filter(
    (b) =>
      b.key !== "promptpay" && // exclude promptpay from bank list if it's bank-only selector
      (b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.shortName.toLowerCase().includes(search.toLowerCase()))
  );

  function handleSelect(bank: BankOption | null) {
    setSelected(bank);
    setOpen(false);
    onSelect?.(bank);
  }

  return (
    <div className="relative">
      <input type="hidden" name="bankName" value={selected?.key ?? ""} />

      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Landmark size={14} className="text-slate-500" />
          <span>ธนาคาร</span>
        </span>
        <span className="text-[11px] text-slate-400 font-normal">เลือกโลโก้และธนาคาร</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-12 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none transition flex items-center justify-between gap-3 text-left cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selected ? (
            <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shrink-0 flex items-center justify-center shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.image}
                alt={selected.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
              <Landmark size={16} />
            </div>
          )}
          <div className="min-w-0">
            <strong className="block truncate text-xs font-bold text-slate-800">
              {selected ? selected.name : "— ไม่ระบุบัญชีธนาคาร —"}
            </strong>
            <span className="block text-[10px] text-slate-400">
              {selected ? "บัญชีธนาคาร" : "เลือกธนาคารหากต้องการให้ผู้เช่าโอนเข้าบัญชี"}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-2">
          {/* Search filter */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาธนาคาร..."
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-slate-400"
            autoFocus
          />

          {/* Bank Options Grid/List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-0.5">
            {allowNone && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full p-2 rounded-xl flex items-center justify-between gap-2.5 transition text-left cursor-pointer ${
                  !selected ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
                    <Landmark size={14} />
                  </div>
                  <span className="truncate text-xs">ไม่ระบุบัญชีธนาคาร</span>
                </div>
                {!selected && <Check size={15} className="text-blue-600 shrink-0" />}
              </button>
            )}

            {filteredBanks.map((bank) => {
              const isSelected = selected?.key === bank.key;
              return (
                <button
                  key={bank.key}
                  type="button"
                  onClick={() => handleSelect(bank)}
                  className={`w-full p-2 rounded-xl flex items-center justify-between gap-2.5 transition text-left cursor-pointer ${
                    isSelected ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg overflow-hidden border border-slate-200/80 bg-white p-0.5 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bank.image}
                        alt={bank.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="truncate text-xs">{bank.name}</span>
                  </div>
                  {isSelected && <Check size={15} className="text-blue-600 shrink-0" />}
                </button>
              );
            })}
            {!filteredBanks.length && (
              <p className="p-3 text-center text-xs text-slate-400">ไม่พบธนาคารที่ค้นหา</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
