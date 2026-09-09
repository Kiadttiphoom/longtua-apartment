"use client";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { ThaiResidentialLeaseDocument, type ThaiResidentialLeaseDocumentProps } from "@/components/contracts/ThaiResidentialLeaseDocument";
import type { LeaseContent } from "@/lib/contracts/types";
import { printDocument } from "@/lib/portal/print-document";

export function TenantLeaseDocument({ documents }: { documents: Array<{ id: string; label: string; snapshot: ThaiResidentialLeaseDocumentProps; content?: LeaseContent }> }) {
  const [selected, setSelected] = useState(documents[0]?.id ?? "");
  const current = documents.find(item => item.id === selected);
  if (!current) return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">ยังไม่มีสัญญาเช่า</p>;
  async function download() {
    await document.fonts.ready;
    const area = document.getElementById("print-area");
    if (!area) return;
    const styles = await Promise.all(Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(async link => (await fetch(link.href)).text()));
    const copy = area.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("aside").forEach(node => node.remove());
    const html = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>สัญญาเช่า</title><style>${styles.join("\n")} body{background:white;padding:24px} #print-area{max-width:190mm;margin:auto}</style><body>${copy.outerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `lease-${current!.id}.html`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <header className="space-y-3 print:hidden"><h1 className="text-2xl font-bold">สัญญาเช่าของฉัน</h1>
      <select aria-label="เลือกสัญญา" className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" value={selected} onChange={e => setSelected(e.target.value)}>{documents.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void printDocument()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"><Printer size={16} />พิมพ์ / บันทึกเป็น PDF</button><button type="button" onClick={() => void download()} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"><Download size={16} />ดาวน์โหลดเอกสาร</button></div>
      <p className="text-xs text-slate-500">สำหรับ PDF กด “พิมพ์ / บันทึกเป็น PDF” แล้วเลือกบันทึกเป็น PDF ในหน้าต่างพิมพ์</p>
    </header>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-200 p-3 sm:p-6 print:border-0 print:p-0"><div className="mx-auto w-[190mm] bg-white p-8 shadow-sm [&_aside]:hidden print:w-full print:p-0 print:shadow-none"><ThaiResidentialLeaseDocument {...current.snapshot} content={current.content} /></div></div>
  </>;
}
