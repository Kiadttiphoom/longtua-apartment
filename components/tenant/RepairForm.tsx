"use client";

import { useState, useTransition } from "react";
import { submitRepair } from "@/app/(tenant)/tenant/repairs/actions";
import { alertSuccess, alertError } from "@/lib/sweetalert";
import { Loader2, Send, Wrench } from "lucide-react";

const quickCategories = [
  { label: "แอร์ไม่เย็น / น้ำหยด", category: "แอร์ / เครื่องปรับอากาศ" },
  { label: "ท่อน้ำตัน / ก๊อกรั่ว", category: "ประปา / ห้องน้ำ" },
  { label: "หลอดไฟดับ / ปลั๊กเสีย", category: "ไฟฟ้า / หลอดไฟ" },
  { label: "ลูกบิด / ประตูฝืด", category: "ประตู / หน้าต่าง" },
  { label: "เครื่องทำน้ำอุ่นไม่ทำงาน", category: "เครื่องทำน้ำอุ่น" },
  { label: "อื่นๆ", category: "อื่นๆ" },
];

export function RepairForm({ leases }: { leases: Array<{ id: string; label: string }> }) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const inputStyle =
    "w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50";

  const handleCategoryClick = (cat: typeof quickCategories[number]) => {
    setSelectedCategory(cat.category);
    setTitle(cat.label);
  };

  return (
    <form
      className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
      onSubmit={(e) => {
        e.preventDefault();
        setFormError("");
        const form = e.currentTarget;
        const data = new FormData(form);
        start(async () => {
          try {
            const result = await submitRepair(data);
            if (result.ok) {
              form.reset();
              setTitle("");
              setDetail("");
              setSelectedCategory(null);
              await alertSuccess(
                "ส่งคำขอแจ้งซ่อมสำเร็จ",
                result.message || "เจ้าหน้าที่ได้รับคำขอแจ้งซ่อมเรียบร้อยแล้ว"
              );
            } else {
              setFormError(result.message || "กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง");
            }
          } catch {
            const errMsg = "เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
            await alertError("เกิดข้อผิดพลาด", errMsg);
          }
        });
      }}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Wrench size={16} />
        </span>
        <strong className="text-sm font-bold text-slate-800">
          ส่งคำขอแจ้งซ่อมปัญหาห้องพัก
        </strong>
      </div>

      {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
      {/* Select Lease/Room if multiple */}
      {leases.length > 1 ? (
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
          <span>เลือกห้องพัก *</span>
          <select className={inputStyle} name="leaseId" required>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div>
          <span className="block text-xs font-semibold text-slate-500">ห้องพักที่แจ้ง</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800">
              {leases[0]?.label ?? "ห้องพัก"}
            </span>
          </div>
          <input type="hidden" name="leaseId" value={leases[0]?.id ?? ""} />
        </div>
      )}

      {/* Quick Problem Tag Chips */}
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700">
          เลือกหมวดหมู่ปัญหาด่วน (คลิกเพื่อใส่หัวข้อ)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickCategories.map((cat) => {
            const active = selectedCategory === cat.category;
            return (
              <button
                type="button"
                key={cat.label}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Title */}
      <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
        <span>หัวข้อปัญหาที่พบ *</span>
        <input
          className={inputStyle}
          name="title"
          minLength={3}
          maxLength={160}
          required
          placeholder="เช่น แอร์มีเสียงดังและไม่เย็น, ก๊อกน้ำอ่างล้างหน้ารั่ว"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {/* Details & Convenient Time */}
      <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
        <span>รายละเอียดปัญหา / วันและเวลาที่สะดวกให้ช่างเข้าซ่อม *</span>
        <textarea
          className={`${inputStyle} resize-y min-h-[90px]`}
          name="detail"
          rows={3}
          minLength={5}
          maxLength={3000}
          required
          placeholder="กรุณาระบุรายละเอียด เช่น เป็นมาแล้ว 2 วัน สะดวกให้ช่างเข้าดูช่วงบ่าย 13:00 - 17:00 น. หรือช่วงวันหยุด"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </label>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 active:scale-98 transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        disabled={pending || !leases.length}
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" size={17} />
            <span>กำลังส่งคำขอแจ้งซ่อม...</span>
          </>
        ) : (
          <>
            <Send size={16} />
            <span>ส่งคำขอแจ้งซ่อม</span>
          </>
        )}
      </button>
    </form>
  );
}
