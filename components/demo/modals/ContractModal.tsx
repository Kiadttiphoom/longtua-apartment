import { Pencil, Printer, X } from "lucide-react";
import type { AppSettings, ContractRecord } from "../types";
import { thaiBahtText } from "../utils";

export function ContractModal({
  contract,
  settings,
  onClose,
  onEdit,
}: {
  contract: ContractRecord;
  settings: AppSettings;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={onClose}
              title="ปิด"
              type="button"
            >
              <X size={18} />
            </button>
            <span className="font-bold text-sm text-slate-800">
              สัญญาเช่า · ห้อง {contract.roomNumber} · {contract.tenantName} ({contract.id})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              onClick={onEdit}
              type="button"
            >
              <Pencil size={14} />
              <span>แก้ไข</span>
            </button>
            <button
              className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={14} />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
          </div>
        </div>

        <div
          className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4 font-sans print:p-0 print:border-none print:shadow-none print:space-y-2.5 print:text-[9.5pt] print:leading-[1.42]"
          id="print-area"
        >
          <div className="text-center pb-3 border-b border-slate-200 space-y-1 print:pb-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight print:text-[16pt]">
              สัญญาเช่าห้องพัก
            </h1>
          </div>

          <div className="flex justify-end pt-1">
            <div className="text-right space-y-1 text-xs sm:text-sm text-slate-700 print:text-[9pt] print:space-y-0.5">
              <p>
                <strong>ทำที่:</strong> สมชายแมนชั่น เลขที่ 123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา
              </p>
              <p>
                <strong>วันที่ทำสัญญา:</strong> {contract.startDate}
              </p>
              <p className="text-slate-400 text-[11px] print:text-[8pt]">เลขที่สัญญา: {contract.id}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed print:text-[9.5pt] print:leading-[1.42] print:space-y-1.5">
            <p className="text-justify indent-8">
              สัญญาเช่าฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท สมชายอพาร์ทเมนท์ จำกัด</strong> โดย <strong>นายสมชาย ใจดี</strong>{" "}
              ตั้งอยู่ข้างต้น ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>&quot;ผู้ให้เช่า&quot;</strong> ฝ่ายหนึ่งกับ{" "}
              <strong>{contract.tenantName || "...................................................."}</strong>{" "}
              อยู่บ้านเลขที่ ....................................................{" "}
              {contract.tenantIdCard ? `เลขประจำตัวประชาชน ${contract.tenantIdCard}` : ""}{" "}
              {contract.tenantPhone ? `โทร ${contract.tenantPhone}` : ""} ซึ่งต่อไปในสัญญานี้จะเรียกว่า{" "}
              <strong>&quot;ผู้เช่า&quot;</strong> ฝ่ายหนึ่ง คู่สัญญาได้ตกลงกันดังนี้
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed print:text-[9.5pt] print:leading-[1.42] print:space-y-1.5">
            <p className="text-justify indent-8">
              <strong>ข้อ ๑.</strong> ผู้ให้เช่าตกลงให้เช่าและผู้เช่าตกลงเช่าห้องพักเลขที่ <strong>{contract.roomNumber}</strong>{" "}
              ในอาคารของผู้ให้เช่าเพื่อเป็นที่อยู่อาศัยภายใต้ระเบียบที่ผู้ให้เช่ากำหนด โดยเฉพาะไม่ก่อกวน ต้องสงบในยามวิกาล
              ไม่ทะเลาะวิวาท ไม่ทำผิดศีลธรรมและกฎหมาย
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๒.</strong> ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าล่วงหน้า ๑ เดือนและเป็นรายเดือน
              โดยกำหนดชำระค่าเช่าภายในวันที่ ๕ ของทุกเดือน ในอัตราค่าเช่าเดือนละ{" "}
              <strong>
                ฿{contract.rent.toLocaleString()} บาท ({thaiBahtText(contract.rent)})
              </strong>
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๓.</strong> ผู้เช่าตกลงจะนำค่าเช่ามาชำระให้ ณ ที่ทำการของผู้ให้เช่าหรือตัวแทนภายในกำหนด
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๔.</strong> ห้ามเช่าช่วงเป็นอันขาด เว้นแต่ผู้ให้เช่าตกลงยินยอมด้วยเป็นลายลักษณ์อักษร
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๕.</strong> ค่าน้ำประปา ค่าไฟฟ้า และค่าใช้จ่ายอื่น ถ้ามีให้เรียกเก็บตามอัตราในมิเตอร์หรือโดยเฉลี่ยจากผู้เช่า
              (ค่าไฟฟ้าหน่วยละ {settings.electricRate} บาท, ค่าน้ำประปาเหมาจ่าย {settings.waterRate} บาท/ห้อง)
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๖.</strong> ผู้เช่าต้องบำรุงรักษาห้องเช่ารวมถึงอุปกรณ์ไฟฟ้า มุ้งลวด กระจกบานเกล็ด กุญแจห้อง กลอนประตู พัดลม
              หลอดไฟ เสื่อ ฝาผนัง และอื่น ๆ ให้อยู่ในสภาพที่ดีอยู่เสมอ หากเกิดชำรุดเสียหายไม่ว่าด้วยเหตุใดก็ตาม
              ผู้เช่าต้องทำให้กลับคืนสู่สภาพเดิมทันที ด้วยค่าใช้จ่ายของผู้เช่า
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๗.</strong> ผู้เช่ามีหน้าที่รักษาความสะอาดตามกฎหมาย ไม่เก็บวัตถุไวไฟหรือสิ่งอันตรายหรือสิ่งต้องห้ามตามกฎหมาย
              ผู้เช่ายินยอมให้ผู้ให้เช่าเข้าตรวจความถูกต้องเรียบร้อยในห้อง
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๘.</strong> ผู้เช่าจะดัดแปลงต่อเติมหรือรื้อถอนทรัพย์สินที่เช่าทั้งหมดหรือบางส่วนได้
              ต่อเมื่อได้รับความยินยอมเป็นหนังสือจากผู้ให้เช่า
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๙.</strong> ถ้าผู้เช่าผิดสัญญาไม่ชำระค่าเช่าตามกำหนดไว้ในข้อ ๒
              ผู้ให้เช่าต้องทวงสิทธิไว้ในการกลับเข้าครอบครองทรัพย์สินที่เช่าตามสัญญานี้โดยฉับพลัน
              และผู้เช่ายอมให้ผู้ให้เช่าย้ายบุคคลหรือทรัพย์สินของผู้เช่าออกจากทรัพย์ที่เช่าตามสัญญานี้
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๑๐.</strong> ผู้เช่ามีหน้าที่แจ้งให้ผู้ให้เช่าทราบล่วงหน้าในการเลิกเช่าไม่น้อยกว่าสามสิบวันจึงจะได้รับเงินล่วงหน้าคืน
              หรืออยู่อาศัยโดยหักจากการชำระล่วงหน้าตามข้อ ๒
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๑๑.</strong> ในวันทำสัญญานี้ ผู้เช่าได้ตรวจตราทรัพย์สินที่เช่าแล้วเห็นว่ามีสภาพปกติดีทุกประการและผู้ให้เช่าได้ส่งมอบทรัพย์สินที่เช่าให้แก่ผู้เช่าแล้ว
              (วางเงินประกันความเสียหายจำนวน ฿{contract.deposit.toLocaleString()} บาท)
            </p>

            <p className="text-justify indent-8">
              <strong>ข้อ ๑๒.</strong> ผู้เช่าได้มอบสำเนาบัตรประจำตัว สำเนาทะเบียนบ้านและเอกสารแสดงตัวตามกฎหมายที่ไม่หมดอายุพร้อมรูปถ่าย
              ให้ไว้กับผู้ให้เช่า
            </p>

            {contract.customClauses ? (
              <p className="text-justify indent-8">
                <strong>ข้อ ๑๓. (เงื่อนไขเพิ่มเติม)</strong> {contract.customClauses}
              </p>
            ) : null}
          </div>

          <div className="space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed pt-2 print:pt-1.5 print:text-[9.5pt]">
            <p className="text-justify indent-8">คู่สัญญาทั้งสองฝ่ายได้อ่านและทำความเข้าใจดีแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6 mt-4 border-t border-dashed border-slate-300 text-center print:pt-4 print:mt-3 print:gap-y-4">
            <div className="flex flex-col items-center space-y-1 print:space-y-0.5 print:text-[8.5pt]">
              <p className="text-xs sm:text-sm text-slate-600 print:text-[8.5pt]">
                ลงชื่อ ........................................................... ผู้เช่า
              </p>
              <div className="w-3/4 border-b border-dotted border-slate-400 my-1.5 h-3 print:my-1" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 print:text-[8.5pt]">
                ( {contract.tenantName || "...................................................."} )
              </p>
            </div>

            <div className="flex flex-col items-center space-y-1 print:space-y-0.5 print:text-[8.5pt]">
              <p className="text-xs sm:text-sm text-slate-600 print:text-[8.5pt]">
                ลงชื่อ ........................................................... ผู้ให้เช่า
              </p>
              <div className="w-3/4 border-b border-dotted border-slate-400 my-1.5 h-3 print:my-1" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 print:text-[8.5pt]">( นายสมชาย ใจดี )</p>
            </div>

            <div className="flex flex-col items-center space-y-1 print:space-y-0.5 print:text-[8.5pt]">
              <p className="text-xs sm:text-sm text-slate-600 print:text-[8.5pt]">
                ลงชื่อ ........................................................... พยาน
              </p>
              <div className="w-3/4 border-b border-dotted border-slate-400 my-1.5 h-3 print:my-1" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 print:text-[8.5pt]">
                ( ........................................................... )
              </p>
            </div>

            <div className="flex flex-col items-center space-y-1 print:space-y-0.5 print:text-[8.5pt]">
              <p className="text-xs sm:text-sm text-slate-600 print:text-[8.5pt]">
                ลงชื่อ ........................................................... พยาน
              </p>
              <div className="w-3/4 border-b border-dotted border-slate-400 my-1.5 h-3 print:my-1" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 print:text-[8.5pt]">
                ( ........................................................... )
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
