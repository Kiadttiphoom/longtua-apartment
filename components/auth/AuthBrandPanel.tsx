import { Check } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthBrandPanel() {
  return (
    <section className="hidden md:flex flex-col justify-between p-8 lg:p-12 bg-[#091830] text-white">
      <div>
        <BrandLogo
          className="max-h-12 w-auto object-contain"
          variant="inverse"
        />
      </div>
      <div className="space-y-6 max-w-md my-auto py-10">
        <div className="space-y-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
            บริหารทุกหอพัก
            <br />
            ครบจบในที่เดียวอย่างเป็นระบบ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            เช็กสถานะห้อง บันทึกมิเตอร์ ออกบิลค่าเช่า ค่าน้ำ ค่าไฟ
            และตรวจยอดชำระเงินได้สะดวกรวดเร็ว
          </p>
        </div>
        <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Check size={13} />
            </span>
            <span>จัดการได้หลายตึก หลายหอพัก ในบัญชีเดียว</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Check size={13} />
            </span>
            <span>แบ่งหน้าที่และกำหนดสิทธิ์ทีมงานได้ชัดเจน</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Check size={13} />
            </span>
            <span>ผู้เช่าเช็กบิลและส่งสลิปโอนเงินผ่านมือถือได้ทันที</span>
          </li>
        </ul>
      </div>
      <div className="text-[11px] text-slate-400">
        ระบบบริหารหอพักและอพาร์ตเมนต์มืออาชีพ
      </div>
    </section>
  );
}
