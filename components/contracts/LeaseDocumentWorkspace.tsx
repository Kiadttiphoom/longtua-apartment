"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { loadLeaseDocumentAction } from "@/app/(portal)/lease-document-actions";
import { saveLeaseDocumentAction } from "@/app/(portal)/resource-actions";
import { ThaiResidentialLeaseDocument, type ThaiResidentialLeaseDocumentProps } from "./ThaiResidentialLeaseDocument";
import defaultContent from "@/lib/contracts/default-lease-content.json";
import { LEASE_TOKENS, moveLeaseClause, validateLeaseContent } from "@/lib/contracts/lease-content.mjs";
import type { LeaseContent, LeaseDocumentState } from "@/lib/contracts/types";

const originalContent = defaultContent as LeaseContent;
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed";
const field = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function LeaseDocumentWorkspace({ leaseId, organizationId, canEdit, onDirtyChange, autoPrint = false, ...documentProps }: ThaiResidentialLeaseDocumentProps & {
  autoPrint?: boolean;
  leaseId: string; organizationId: string; canEdit: boolean; onDirtyChange: (dirty: boolean) => void;
}) {
  const [data, setData] = useState<LeaseDocumentState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState<LeaseContent>(originalContent);
  const [baseline, setBaseline] = useState<LeaseContent>(originalContent);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const printed = useRef(false);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    let cancelled = false;
    loadLeaseDocumentAction(leaseId).then(result => {
      if (cancelled) return;
      if (!result.ok) { setLoadError(result.message); return; }
      setData(result.state);
      setSelectedVersion(result.state.versions[0]?.id ?? "");
      setLoadError("");
    }).catch(() => { if (!cancelled) setLoadError("เชื่อมต่อไม่สำเร็จ กรุณาลองโหลดอีกครั้ง"); });
    return () => { cancelled = true; };
  }, [leaseId, reload]);

  useEffect(() => { onDirtyChange(dirty || pending); }, [dirty, pending, onDirtyChange]);
  useEffect(() => {
    if (!autoPrint || !data || printed.current) return;
    const frame = requestAnimationFrame(() => { printed.current = true; window.print(); });
    return () => cancelAnimationFrame(frame);
  }, [autoPrint, data]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const version = data?.versions.find(item => item.id === selectedVersion);
  const displayedContent = version?.content ?? data?.initialTemplate ?? originalContent;
  const displayedProps = version?.snapshot ?? documentProps;
  const validationError = validateLeaseContent(draft);

  function beginEditing() {
    setDraft(displayedContent); setBaseline(displayedContent); setEditing(true); setPreview(false); setNotice(null);
  }
  function replaceDraft(content: LeaseContent) {
    if (!dirty || window.confirm("แทนที่ข้อความที่กำลังแก้ไขด้วยแม่แบบที่เลือก?")) { setDraft(content); setNotice(null); }
  }
  function updateClause(id: string, key: "title" | "body", value: string) {
    setDraft(current => ({ ...current, clauses: current.clauses.map(clause => clause.id === id ? { ...clause, [key]: value } : clause) }));
    setNotice(null);
  }
  function save(target: "lease" | "template") {
    if (!data || validationError) { setNotice({ ok: false, message: validationError || "กรุณารอโหลดข้อมูล" }); return; }
    const form = new FormData();
    form.set("organizationId", organizationId); form.set("leaseId", leaseId); form.set("target", target);
    form.set("parentId", (target === "lease" ? data.versions[0]?.id : data.templateId) ?? "");
    form.set("content", JSON.stringify(draft));
    startTransition(async () => {
      try {
        const result = await saveLeaseDocumentAction(form);
        setNotice(result);
        if (result.ok && result.version) {
          setData(current => current ? { ...current, versions: [result.version!, ...current.versions].slice(0, 50) } : current);
          setSelectedVersion(result.version.id); setBaseline(result.version.content); setDraft(result.version.content); setEditing(false);
        }
        if (result.ok && result.templateId) setData(current => current ? { ...current, templateId: result.templateId!, template: draft } : current);
      } catch { setNotice({ ok: false, message: "เชื่อมต่อไม่สำเร็จ ข้อความยังอยู่ กรุณาลองบันทึกอีกครั้ง" }); }
    });
  }

  if (!data) return <div className="p-6 print:hidden" role="status">
    <p className={loadError ? "text-sm text-rose-700" : "text-sm text-slate-600"}>{loadError || "กำลังโหลดข้อความสัญญา…"}</p>
    {loadError ? <button type="button" className={`${button} mt-3`} onClick={() => { setLoadError(""); setReload(n => n + 1); }}>ลองโหลดอีกครั้ง</button> : null}
  </div>;

  return <>
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 sm:px-6 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        {editing ? <>
          <button type="button" className={button} disabled={pending} onClick={() => setPreview(!preview)}>{preview ? <Pencil size={16} /> : <Eye size={16} />}{preview ? "กลับไปแก้ข้อความ" : "ดูตัวอย่าง"}</button>
          <button type="button" className={`${button} border-blue-600! bg-blue-600! text-white! hover:bg-blue-700!`} disabled={pending || Boolean(validationError)} onClick={() => save("lease")}><Save size={16} />{pending ? "กำลังบันทึก…" : "บันทึกฉบับนี้"}</button>
          <button type="button" className={button} disabled={pending} onClick={() => { if (!dirty || window.confirm("ยกเลิกข้อความที่ยังไม่ได้บันทึก?")) { setEditing(false); setNotice(null); } }}>ยกเลิก</button>
        </> : <>
          {canEdit ? <button type="button" className={button} disabled={!data.storageReady} onClick={beginEditing}><Pencil size={16} />{version && version.id !== data.versions[0]?.id ? "สร้างฉบับใหม่จากนี้" : "ปรับข้อความสัญญา"}</button> : null}
          <button type="button" className={button} onClick={() => window.print()}><Printer size={16} />พิมพ์สัญญา A4</button>
          {data.versions.length ? <label className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600">ประวัติ 50 ฉบับล่าสุด
            <select aria-label="ฉบับสัญญาที่แสดง" className={`${field} w-auto! max-w-full`} value={selectedVersion} onChange={event => { setSelectedVersion(event.target.value); setNotice(null); }}>
              {data.versions.map((item, index) => <option key={item.id} value={item.id}>{index === 0 ? "ล่าสุด · " : ""}{new Date(item.created_at).toLocaleString("th-TH")}</option>)}
            </select>
          </label> : null}
        </>}
      </div>
      {!data.storageReady ? <p role="status" className="mt-2 text-sm text-amber-900">ยังไม่ได้เปิดใช้การบันทึกข้อความสัญญา กรุณาให้ผู้ดูแลอัปเดตฐานข้อมูล สามารถดูและพิมพ์แบบเดิมได้</p> : null}
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{editing ? "แก้ข้อความและลำดับข้อได้ทุกข้อ ตัวแปรจะใช้ข้อมูลสัญญาปัจจุบัน บันทึกฉบับนี้ก่อนพิมพ์" : version ? "แสดงข้อความและข้อมูล ณ เวลาบันทึกฉบับนี้ การแก้ไขครั้งถัดไปจะสร้างฉบับใหม่โดยเก็บฉบับเดิมไว้" : "ยังไม่มีฉบับที่บันทึก ใช้แม่แบบ ณ วันที่สร้างสัญญา"}</p>
      {notice ? <p role={notice.ok ? "status" : "alert"} className={`mt-2 text-sm ${notice.ok ? "text-emerald-800" : "text-rose-700"}`}>{notice.message}</p> : null}
    </div>
    {editing && !preview ? <div className="space-y-6 p-4 sm:p-6 print:hidden">
      <label className="block space-y-2 text-sm font-semibold text-slate-800">ชื่อเอกสาร<input className={field} value={draft.title} maxLength={160} disabled={pending} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      <details className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold">ตัวแปรอัตโนมัติและแม่แบบ</summary>
        <p className="mt-3 text-xs leading-relaxed">คัดลอกตัวแปรไปวางในข้อความเพื่อดึงค่าของแต่ละสัญญา เช่น ชื่อผู้เช่าและค่าเช่า ไม่ต้องกรอกซ้ำ หากพิมพ์ตัวเลขเอง ข้อความนั้นจะไม่เปลี่ยนตามระบบบิล</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{Object.entries(LEASE_TOKENS).map(([key, label]) => <div key={key} className="text-xs"><span>{String(label)} </span><code className="select-all text-blue-800">{`{{${key}}}`}</code></div>)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={button} disabled={pending} onClick={() => replaceDraft(originalContent)}><RotateCcw size={16} />คืนค่าแม่แบบระบบ</button>
          {data.template ? <button type="button" className={button} disabled={pending} onClick={() => replaceDraft(data.template!)}>ใช้แม่แบบล่าสุดของหอพัก</button> : null}
          {data.canSaveTemplate ? <button type="button" className={button} disabled={pending || Boolean(validationError)} onClick={() => save("template")}>บันทึกเป็นแม่แบบหอพัก</button> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed">แม่แบบมีผลกับสัญญาที่สร้างหลังจากนี้เท่านั้น ตรวจว่าข้อความไม่มีชื่อหรือข้อมูลเฉพาะของผู้เช่ารายนี้ก่อนบันทึกแม่แบบ การบันทึกแม่แบบไม่ใช่การบันทึกฉบับนี้</p>
      </details>
      <ol className="space-y-6">{draft.clauses.map((clause, index) => <li key={clause.id} className="space-y-3 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-slate-800">ข้อ {index + 1}</span><div className="flex gap-1">
          <button type="button" className={button} aria-label={`เลื่อนข้อ ${index + 1} ขึ้น`} disabled={pending || index === 0} onClick={() => setDraft({ ...draft, clauses: moveLeaseClause(draft.clauses, index, -1) })}><ArrowUp size={16} /></button>
          <button type="button" className={button} aria-label={`เลื่อนข้อ ${index + 1} ลง`} disabled={pending || index === draft.clauses.length - 1} onClick={() => setDraft({ ...draft, clauses: moveLeaseClause(draft.clauses, index, 1) })}><ArrowDown size={16} /></button>
          <button type="button" className={button} aria-label={`ลบข้อ ${index + 1}`} disabled={pending || draft.clauses.length === 1} onClick={() => { if (window.confirm(`ลบข้อ ${index + 1} “${clause.title}” จากฉบับที่กำลังแก้ไข?`)) setDraft({ ...draft, clauses: draft.clauses.filter(item => item.id !== clause.id) }); }}><Trash2 size={16} /></button>
        </div></div>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">หัวข้อ<input className={field} value={clause.title} maxLength={160} disabled={pending} onChange={event => updateClause(clause.id, "title", event.target.value)} /></label>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">เนื้อหา<textarea className={`${field} min-h-36 resize-y leading-relaxed`} rows={5} maxLength={12000} value={clause.body} disabled={pending} onChange={event => updateClause(clause.id, "body", event.target.value)} /></label>
      </li>)}</ol>
      <button type="button" className={button} disabled={pending || draft.clauses.length >= 50} onClick={() => setDraft({ ...draft, clauses: [...draft.clauses, { id: crypto.randomUUID(), title: "ข้อตกลงเพิ่มเติม", body: "" }] })}><Plus size={16} />เพิ่มข้อสัญญา</button>
      {validationError ? <p role="alert" className="text-sm text-rose-700">{validationError}</p> : null}
    </div> : <div className="p-4 sm:p-8 print:p-0"><ThaiResidentialLeaseDocument {...(editing ? documentProps : displayedProps)} content={editing ? draft : displayedContent} /></div>}
  </>;
}
