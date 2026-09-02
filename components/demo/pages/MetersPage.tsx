"use client";

import { useMemo, useState } from "react";
import { Droplets, Gauge, History, LayoutGrid, List, Zap } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  Field,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function MetersPage({
  isLocked,
  onToast,
  meterRooms,
  onMeterChange,
  appSettings,
  activeProperty,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const [modalRoom, setModalRoom] = useState(meterRooms[0]?.number ?? "101");
  const [modalPrev, setModalPrev] = useState(12430);
  const [modalNew, setModalNew] = useState(12510);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return meterRooms.filter(
      (r) =>
        !needle ||
        `${r.number} ${r.tenant} ${activeProperty.name}`.toLowerCase().includes(needle)
    );
  }, [meterRooms, query, activeProperty.name]);

  function handleSaveMeter() {
    onMeterChange(modalRoom, modalNew);
    setShowModal(false);
    onToast(`บันทึกมิเตอร์ห้อง ${modalRoom} เรียบร้อยแล้ว`);
  }

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "บันทึกมิเตอร์" : undefined}
        description="บันทึกหรือแก้ไขเลขมิเตอร์ตามรอบเดือน ระบบคำนวณหน่วยใช้งานให้อัตโนมัติ"
        onAction={() => setShowModal(true)}
        title="มิเตอร์"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {meterRooms.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">รายการจดทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-amber-600 tracking-tight">
            {meterRooms.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">มิเตอร์ไฟฟ้า</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-sky-600 tracking-tight">0</strong>
          <span className="text-xs text-slate-500 mt-0.5">มิเตอร์น้ำ</span>
        </div>
      </section>

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} รายการ`}
        filter={{
          label: "กรองประเภทมิเตอร์",
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { value: "all", label: "ทุกประเภท" },
            { value: "electric", label: "ไฟฟ้า" },
            { value: "water", label: "น้ำประปา" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาห้อง หอพัก หรือรอบเดือน"
        query={query}
        title="ประวัติการจดมิเตอร์"
      />

      {viewMode === "table" ? (
        <div className="w-full mb-6">
          <DataTable
            emptyDescription="ยังไม่มีการบันทึกเลขมิเตอร์"
            emptyTitle="ไม่พบข้อมูลมิเตอร์"
            headers={[
              "ห้อง / หอพัก",
              "ประเภท",
              "รอบเดือน",
              "เลขครั้งก่อน",
              "เลขครั้งนี้",
              "หน่วยที่ใช้",
              "คำนวณเงิน",
              "การจัดการ",
            ]}
            rows={filtered.map((room) => {
              const currentVal = room.newElec ?? room.prevElec;
              const units = Math.max(0, currentVal - room.prevElec);
              const cost = units * appSettings.electricRate;

              return [
                <div className="flex items-center gap-2.5" key="room">
                  <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                    {room.number}
                  </span>
                  <div className="flex flex-col text-xs min-w-0">
                    <strong className="text-slate-800 font-bold truncate">ห้อง {room.number}</strong>
                    <small className="text-slate-400 mt-0.5">{activeProperty.name}</small>
                  </div>
                </div>,
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" key="type">
                  <Zap size={12} />
                  ไฟฟ้า
                </span>,
                <span className="text-slate-700 text-xs" key="period">สิงหาคม 2568</span>,
                <span className="font-mono text-slate-600 text-xs" key="prev">{room.prevElec.toLocaleString("th-TH")}</span>,
                <div className="w-24" key="input">
                  <input
                    aria-label={`เลขมิเตอร์ใหม่ห้อง ${room.number}`}
                    className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    defaultValue={room.newElec ?? ""}
                    disabled={isLocked}
                    onBlur={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      onMeterChange(room.number, val);
                      if (val) onToast(`บันทึกมิเตอร์ห้อง ${room.number}: ${val}`);
                    }}
                    placeholder={String(room.prevElec)}
                    type="number"
                  />
                </div>,
                <strong className={`font-mono text-xs ${units > 0 ? "text-blue-600 font-bold" : "text-slate-400"}`} key="units">
                  {units} หน่วย
                </strong>,
                <strong className="font-mono text-slate-800 text-xs font-bold" key="cost">
                  ฿{cost.toFixed(2)}
                </strong>,
                <button
                  key="act"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                  onClick={() => {
                    setModalRoom(room.number);
                    setModalPrev(room.prevElec);
                    setModalNew(room.newElec ?? room.prevElec);
                    setShowModal(true);
                  }}
                  type="button"
                >
                  แก้ไข
                </button>,
              ];
            })}
          />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {filtered.map((room) => {
            const currentVal = room.newElec ?? room.prevElec;
            const units = Math.max(0, currentVal - room.prevElec);
            const cost = units * appSettings.electricRate;

            return (
              <article
                className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
                key={room.number}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-10 h-8 px-2.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100">
                      {room.number}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate">ห้อง {room.number}</h2>
                      <small className="text-[11px] text-slate-400 block truncate">{activeProperty.name}</small>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Zap size={12} />
                    ไฟฟ้า
                  </span>
                </header>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">เลขครั้งก่อน</span>
                    <strong className="font-mono text-slate-700 font-bold mt-0.5 block">{room.prevElec}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เลขครั้งนี้</span>
                    <strong className="font-mono text-blue-600 font-bold mt-0.5 block">{currentVal}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-t border-b border-slate-100">
                  <span className="text-slate-500">หน่วยใช้งาน ({units} หน่วย):</span>
                  <strong className="font-mono text-slate-800 font-bold">฿{cost.toFixed(2)}</strong>
                </div>

                <footer className="mt-auto pt-1">
                  <button
                    className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                    onClick={() => {
                      setModalRoom(room.number);
                      setModalPrev(room.prevElec);
                      setModalNew(room.newElec ?? room.prevElec);
                      setShowModal(true);
                    }}
                    type="button"
                  >
                    <span>บันทึก / แก้ไขมิเตอร์</span>
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      {showModal ? (
        <Modal
          description={`บันทึกเลขมิเตอร์ไฟฟ้าประจำงวดสำหรับห้อง ${modalRoom}`}
          onClose={() => setShowModal(false)}
          title={`บันทึกมิเตอร์ห้อง ${modalRoom}`}
        >
          <div className="p-6 flex flex-col gap-4 text-left">
            <SelectField
              clear={() => {}}
              label="เลือกห้องพัก"
              name="room_select"
              onChange={(v) => {
                setModalRoom(v);
                const r = meterRooms.find((rm) => rm.number === v);
                if (r) {
                  setModalPrev(r.prevElec);
                  setModalNew(r.newElec ?? r.prevElec);
                }
              }}
              options={meterRooms.map((r) => ({ value: r.number, label: `ห้อง ${r.number} (${r.tenant || "ว่าง"})` }))}
              value={modalRoom}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                clear={() => {}}
                defaultValue={modalPrev}
                disabled
                label="เลขครั้งก่อน"
                name="prev_reading"
                type="number"
              />
              <Field
                clear={() => {}}
                defaultValue={modalNew}
                label="เลขครั้งนี้"
                name="new_reading"
                onChange={(v) => setModalNew(parseInt(v, 10) || 0)}
                required
                type="number"
              />
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 flex justify-between">
              <span>หน่วยที่ใช้: <strong>{Math.max(0, modalNew - modalPrev)} หน่วย</strong></span>
              <span>คำนวณเงิน: <strong>฿{(Math.max(0, modalNew - modalPrev) * appSettings.electricRate).toFixed(2)}</strong></span>
            </div>
            <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer"
                onClick={() => setShowModal(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 cursor-pointer"
                onClick={handleSaveMeter}
                type="button"
              >
                บันทึกมิเตอร์
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
