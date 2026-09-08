import { money, thaiBahtText, thaiDate } from "@/lib/format";
import defaultContent from "@/lib/contracts/default-lease-content.json";
import type { LeaseContent } from "@/lib/contracts/types";
import { resolveLeaseText } from "@/lib/contracts/lease-content.mjs";

export type WaterBillingMethod = "meter" | "per_person" | "flat_room";

export type ThaiResidentialLeaseDocumentProps = {
  leaseNumber: string;
  contractDate: string;
  startDate: string;
  endDate?: string | null;
  propertyName: string;
  propertyAddress?: string | null;
  propertyPhone?: string | null;
  landlordName: string;
  landlordRepresentative?: string | null;
  tenantName: string;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  tenantIdCard?: string | null;
  roomNumber: string;
  floor?: string | null;
  occupantCount: number;
  rentAmount: number;
  depositAmount: number;
  advanceAmount: number;
  dueDay?: number | null;
  electricRate?: number | null;
  waterRate?: number | null;
  waterBillingMethod?: WaterBillingMethod;
  customTerms?: string | null;
  content?: LeaseContent;
};

const blank = "........................................................";

const inspectionItems = [
  "ประตู ลูกบิด และกุญแจ",
  "หน้าต่าง กระจก และมุ้งลวด",
  "พื้น ผนัง ฝ้าเพดาน และระเบียง",
  "เตียงนอนและที่นอน",
  "โต๊ะ เก้าอี้ และตู้เสื้อผ้า",
  "เครื่องปรับอากาศและรีโมต",
  "พัดลมและเครื่องใช้ไฟฟ้าอื่น",
  "โคมไฟ หลอดไฟ และเต้ารับ",
  "อ่างล้างมือ ก๊อกน้ำ และฝักบัว",
  "โถสุขภัณฑ์และท่อน้ำทิ้ง",
  "มิเตอร์ไฟฟ้า",
  "มิเตอร์น้ำประปา",
  "อุปกรณ์อินเทอร์เน็ต",
  "รายการอื่น ๆ",
];

function amount(value: number) {
  return `${money(value)} (${thaiBahtText(value)})`;
}

function number(value: number) {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

function waterCalculation(method: WaterBillingMethod, rate?: number | null) {
  const displayedRate = rate == null ? "อัตราที่ระบุในใบแจ้งหนี้" : `${number(rate)} บาท`;
  if (method === "per_person") return `${displayedRate} ต่อผู้พักอาศัยหนึ่งคนต่อเดือน`;
  if (method === "flat_room") return `${displayedRate} ต่อห้องต่อเดือน`;
  return `จำนวนหน่วยตามมิเตอร์คูณ ${displayedRate} ต่อหน่วย`;
}

function Clause({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="contract-clause space-y-1.5 wrap-anywhere">
      <h2 className="font-extrabold text-slate-900 break-after-avoid">
        ข้อ {number} {title}
      </h2>
      <div className="space-y-1.5 text-justify indent-8">{children}</div>
    </section>
  );
}

function Signature({ label, name }: { label: string; name: string }) {
  return (
    <div className="break-inside-avoid space-y-5 text-center">
      <p>ลงชื่อ {blank} {label}</p>
      <p>( {name || blank} )</p>
    </div>
  );
}

export function ThaiResidentialLeaseDocument(props: ThaiResidentialLeaseDocumentProps) {
  const dueDay = props.dueDay && props.dueDay >= 1 && props.dueDay <= 31 ? props.dueDay : 5;
  const totalUpfront = props.depositAmount + props.advanceAmount;
  const exceedsUpfrontLimit = props.rentAmount > 0 && totalUpfront > props.rentAmount * 3;
  const landlordRepresentative = props.landlordRepresentative || blank;
  const tenantId = props.tenantIdCard || blank;
  const content = props.content ?? defaultContent;
  const values = {
    roomNumber: props.roomNumber, floor: props.floor || "—", propertyName: props.propertyName,
    propertyAddress: props.propertyAddress || blank, tenantName: props.tenantName, landlordName: props.landlordName,
    occupantCount: number(props.occupantCount), startDate: thaiDate(props.startDate),
    endDate: props.endDate ? thaiDate(props.endDate) : "ไม่มีกำหนด โดยชำระค่าเช่าเป็นรายเดือน",
    rentAmount: amount(props.rentAmount), depositAmount: amount(props.depositAmount),
    advanceAmount: amount(props.advanceAmount), totalUpfront: amount(totalUpfront), dueDay,
    electricRate: props.electricRate == null ? "อัตราที่ระบุในใบแจ้งหนี้" : `${number(props.electricRate)} บาทต่อหน่วย`,
    waterCalculation: waterCalculation(props.waterBillingMethod || "meter", props.waterRate),
    customTerms: props.customTerms?.trim() || "ไม่มีข้อตกลงเพิ่มเติม",
  };

  return (
    <article
      className="thai-lease-document bg-white text-slate-800 text-xs sm:text-[13px] leading-[1.75] font-sans"
      id="print-area"
    >
      <aside className="print:hidden mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-950">
        <strong className="block text-xs">ตรวจข้อมูลก่อนพิมพ์</strong>
        แบบร่างนี้จัดหัวข้อตามแนวสัญญาเช่าที่อยู่อาศัยไทย โปรดตรวจชื่อผู้มีอำนาจลงนาม ช่องทางชำระ
        อัตราสาธารณูปโภค และรายการตรวจรับห้องให้ตรงกับกิจการจริง
        {exceedsUpfrontLimit ? (
          <span className="mt-1 block font-bold text-rose-700">
            เงินประกันและค่าเช่าล่วงหน้ารวม {money(totalUpfront)} สูงกว่าสามเดือนของค่าเช่า กรุณาตรวจสอบและแก้ไขก่อนใช้งานจริง
          </span>
        ) : null}
      </aside>

      <header className="contract-document-header break-inside-avoid border-b-2 border-slate-900 pb-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Residential Lease Agreement</p>
        <h1 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl wrap-anywhere">{resolveLeaseText(content.title, values)}</h1>
        <p className="mt-1 font-bold text-slate-700">{props.propertyName}</p>
      </header>

      <section className="contract-summary mt-4 break-inside-avoid rounded-xl border border-slate-300 bg-slate-50 p-3">
        <dl className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
          <div className="flex gap-2"><dt className="font-bold">เลขที่สัญญา:</dt><dd>{props.leaseNumber}</dd></div>
          <div className="flex gap-2"><dt className="font-bold">วันที่ทำสัญญา:</dt><dd>{thaiDate(props.contractDate)}</dd></div>
          <div className="flex gap-2 sm:col-span-2"><dt className="font-bold shrink-0">ทำที่:</dt><dd>{props.propertyName} {props.propertyAddress || blank}</dd></div>
        </dl>
      </section>

      <section className="contract-parties mt-5 break-inside-avoid space-y-3">
        <p className="text-justify indent-8">
          สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>{props.landlordName}</strong> ที่อยู่/สำนักงาน {props.propertyAddress || blank}
          {props.propertyPhone ? ` โทรศัพท์ ${props.propertyPhone}` : ""} โดย <strong>{landlordRepresentative}</strong> ผู้มีอำนาจลงนาม
          ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“ผู้ประกอบธุรกิจ (ผู้ให้เช่า)”</strong> ฝ่ายหนึ่ง
        </p>
        <p className="text-justify indent-8">
          กับ <strong>{props.tenantName || blank}</strong> ที่อยู่ {props.tenantAddress || blank} เลขประจำตัวประชาชน {tenantId}
          {props.tenantPhone ? ` โทรศัพท์ ${props.tenantPhone}` : ""} ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“ผู้บริโภค (ผู้เช่า)”</strong>
          อีกฝ่ายหนึ่ง คู่สัญญาตกลงกันดังต่อไปนี้
        </p>
      </section>

      <div className="contract-clauses mt-5 space-y-4">
        {content.clauses.map((clause, index) => (
          <Clause key={clause.id} number={index + 1} title={resolveLeaseText(clause.title, values)}>
            <p className="whitespace-pre-wrap">{resolveLeaseText(clause.body, values)}</p>
          </Clause>
        ))}
      </div>

      <section className="contract-execution mt-6 break-inside-avoid border-t border-slate-400 pt-4">
        <p className="text-justify indent-8">
          สัญญานี้จัดทำขึ้นเป็นภาษาไทยจำนวนสองฉบับ มีข้อความตรงกัน คู่สัญญาได้อ่านและเข้าใจโดยละเอียดแล้ว
          จึงลงลายมือชื่อไว้ต่อหน้าพยาน และต่างฝ่ายต่างเก็บไว้ฝ่ายละหนึ่งฉบับ
        </p>
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          <Signature label="ผู้เช่า" name={props.tenantName} />
          <Signature label="ผู้ให้เช่า" name={landlordRepresentative} />
          <Signature label="พยาน" name={blank} />
          <Signature label="พยาน" name={blank} />
        </div>
      </section>

      <section className="contract-appendix mt-10">
        <header className="break-inside-avoid border-b-2 border-slate-900 pb-3 text-center">
          <h2 className="text-lg font-black text-slate-950">เอกสารแนบท้ายสัญญา: หลักฐานตรวจรับสภาพห้อง</h2>
          <p className="mt-1">ห้อง {props.roomNumber}{props.floor ? ` ชั้น ${props.floor}` : ""} · {props.propertyName}</p>
        </header>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-10 border border-slate-400 px-2 py-1.5 text-center">ลำดับ</th>
                <th className="border border-slate-400 px-2 py-1.5">รายการ</th>
                <th className="w-20 border border-slate-400 px-2 py-1.5 text-center">จำนวน</th>
                <th className="w-24 border border-slate-400 px-2 py-1.5 text-center">สภาพ</th>
                <th className="w-36 border border-slate-400 px-2 py-1.5">หมายเหตุ / เลขมิเตอร์</th>
              </tr>
            </thead>
            <tbody>
              {inspectionItems.map((item, index) => (
                <tr className="break-inside-avoid" key={item}>
                  <td className="border border-slate-400 px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-slate-400 px-2 py-1">{item}</td>
                  <td className="border border-slate-400 px-2 py-1" />
                  <td className="border border-slate-400 px-2 py-1">□ ปกติ □ ไม่ปกติ</td>
                  <td className="border border-slate-400 px-2 py-1" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-justify indent-8">
          คู่สัญญาได้ตรวจสอบสภาพห้องและรายการข้างต้นร่วมกันแล้ว เห็นว่าถูกต้องครบถ้วน ผู้เช่าควรถ่ายภาพห้อง
          ทรัพย์สิน อุปกรณ์ และหน้าปัดมิเตอร์ในวันรับมอบไว้เป็นหลักฐานประกอบเอกสารฉบับนี้
        </p>
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          <Signature label="ผู้เช่า/ผู้ตรวจรับ" name={props.tenantName} />
          <Signature label="ผู้ให้เช่า/ผู้ส่งมอบ" name={landlordRepresentative} />
        </div>
      </section>
    </article>
  );
}
