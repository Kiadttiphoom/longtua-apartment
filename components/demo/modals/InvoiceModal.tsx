import { Building2, Printer, X } from "lucide-react";
import type { AppSettings, RoomRecord } from "../types";
import { thaiBahtText } from "../utils";

export function InvoiceModal({
  room,
  settings,
  onClose,
}: {
  room: RoomRecord;
  settings: AppSettings;
  onClose: () => void;
}) {
  const units = room.newElec !== null ? room.newElec - room.prevElec : 0;
  const elecCost = units * settings.electricRate;
  const total = room.rent + elecCost + settings.waterRate;
  const invNo = `INV-2569-09${room.number.replace(/\D/g, "")}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
            <span className="font-bold text-sm text-slate-800">
              ใบแจ้งหนี้ · ห้อง {room.number} ({invNo})
            </span>
          </div>
          <button
            className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            onClick={() => window.print()}
            type="button"
          >
            <Printer size={15} />
            <span>พิมพ์บิล A4</span>
          </button>
        </div>

        <div
          className="p-6 sm:p-10 overflow-y-auto text-slate-800 text-xs sm:text-[13px] leading-relaxed space-y-4 font-sans"
          id="print-area"
        >
          <div className="text-center pb-4 border-b border-slate-200 space-y-1">
            <div className="flex justify-center mb-2">
              <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                <Building2 size={24} strokeWidth={2.2} />
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">สมชายแมนชั่น</h1>
            <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              ใบแจ้งหนี้ / ใบเรียกเก็บเงินประจำเดือน (INVOICE)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium border border-slate-200">
            <div>
              <strong>เลขที่เอกสาร:</strong> {invNo}
            </div>
            <div>
              <strong>วันที่ออกบิล:</strong> 27 ส.ค. 2569
            </div>
            <div>
              <strong>กำหนดชำระ:</strong> 5 ก.ย. 2569
            </div>
            <div>
              <strong>ห้องพัก:</strong> {room.number}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>ผู้เช่าพักอาศัย:</strong> {room.tenant || "ผู้เช่าห้องพัก"} · <strong>รอบบิล:</strong> 1–31 สิงหาคม 2569
          </div>

          <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-left">ลำดับ</th>
                  <th className="p-3 text-left">รายการค่าใช้จ่าย</th>
                  <th className="p-3 text-right w-36">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 text-slate-500">1</td>
                  <td className="p-3 text-slate-800 font-semibold">ค่าเช่าห้องพักประจำเดือน (ห้อง {room.number})</td>
                  <td className="p-3 text-right font-semibold text-slate-900">{room.rent.toLocaleString()}.00</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-500">2</td>
                  <td className="p-3 text-slate-800 font-semibold">
                    ค่ากระแสไฟฟ้า ({room.prevElec.toLocaleString()} → {room.newElec?.toLocaleString() ?? "-"} = {units} หน่วย ×{" "}
                    {settings.electricRate} บ./หน่วย)
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-900">{elecCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-500">3</td>
                  <td className="p-3 text-slate-800 font-semibold">ค่าน้ำประปา (อัตราเหมาจ่าย)</td>
                  <td className="p-3 text-right font-semibold text-slate-900">{settings.waterRate.toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-3.5 text-slate-900" colSpan={2}>
                    ยอดรวมสุทธิที่ต้องชำระ (TOTAL AMOUNT):
                  </td>
                  <td className="p-3.5 text-right text-sm text-slate-900">฿{total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-100/60 rounded-xl text-xs text-slate-700">
            <strong>จำนวนเงินตัวอักษร:</strong> {thaiBahtText(total)}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <strong className="block font-bold">ช่องทางการชำระเงิน:</strong>
            <p>
              พร้อมเพย์: <strong>{settings.promptpay || "081-999-8888"}</strong> ({settings.accountName || "สมชายแมนชั่น"})
            </p>
            <small className="text-slate-500 block">
              * กรุณาชำระเงินภายในวันที่ <strong>5 ก.ย. 2569</strong>
            </small>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 mt-6 border-t border-dashed border-slate-300 text-center">
            <div className="flex flex-col items-center space-y-1">
              <p className="text-xs text-slate-600">ลงชื่อ ............................................................ ผู้แจ้งยอด</p>
              <div className="w-3/4 border-b border-dotted border-slate-300 my-2 h-4" />
              <p className="text-xs font-semibold text-slate-800">(สมชายแมนชั่น)</p>
              <p className="text-[11px] text-slate-400">เจ้าหน้าที่ / ผู้จัดการอาคาร</p>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <p className="text-xs text-slate-600">ลงชื่อ ............................................................ ผู้รับใบแจ้งหนี้</p>
              <div className="w-3/4 border-b border-dotted border-slate-300 my-2 h-4" />
              <p className="text-xs font-semibold text-slate-800">( {room.tenant || "ผู้เช่าห้องพัก"} )</p>
              <p className="text-[11px] text-slate-400">ผู้เช่าห้องพักหมายเลข {room.number}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
