"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  requestContractUploadPresignedUrl,
  confirmContractUpload,
} from "@/app/(tenant)/tenant/lease/upload-action";
import { prepareSlipImage } from "@/lib/tenant/prepare-slip-image";
import { SelectControl } from "@/components/ui/SelectControl";
import { alertSuccess, alertError, alertWarning } from "@/lib/sweetalert";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Maximize2,
  ExternalLink,
} from "lucide-react";

interface PreviewItem {
  id: string;
  file: File;
  previewUrl: string;
  isHeic: boolean;
  preparingPreview?: boolean;
}

export function ContractUploadForm({
  leases,
  uploadCountsByLease = {},
}: {
  leases: Array<{ id: string; lease_number: string }>;
  uploadCountsByLease?: Record<string, number>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState(leases[0]?.id ?? "");
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [viewingItem, setViewingItem] = useState<PreviewItem | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const existingCount = uploadCountsByLease[selectedLeaseId] || 0;
  const MAX_IMAGES = 5;
  const remainingQuota = Math.max(0, MAX_IMAGES - existingCount);

  // Close preview modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingItem(null);
    };
    if (viewingItem) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewingItem]);

  // Clean up object URLs on unmount or item removal
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [items]);

  // Asynchronously prepare preview for HEIC files if needed
  useEffect(() => {
    items.forEach(async (item) => {
      if (item.isHeic && !item.previewUrl && !item.preparingPreview) {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, preparingPreview: true } : p));
        try {
          const prepared = await prepareSlipImage(item.file);
          const url = URL.createObjectURL(prepared);
          setItems(prev => prev.map(p => p.id === item.id ? { ...p, previewUrl: url, preparingPreview: false } : p));
        } catch {
          setItems(prev => prev.map(p => p.id === item.id ? { ...p, preparingPreview: false } : p));
        }
      }
    });
  }, [items]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMessage(null);

    if (existingCount >= MAX_IMAGES) {
      setMessage({
        ok: false,
        text: `สัญญานี้แนบภาพครบ ${MAX_IMAGES} ภาพแล้ว (ภาพเดิมมีอยู่แล้ว ${existingCount} ภาพ) หากต้องการเพิ่มภาพใหม่ กรุณากดลบภาพเดิมออกก่อน`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const availableSlots = remainingQuota - items.length;

    if (availableSlots <= 0) {
      setMessage({
        ok: false,
        text: `คุณเลือกภาพใหม่ครบโควตาแล้ว (ภาพเดิม ${existingCount} + เลือกใหม่ ${items.length} = รวม ${MAX_IMAGES} ภาพ)`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (files.length > availableSlots) {
      setMessage({
        ok: false,
        text: `สัญญานี้มีภาพเดิมแล้ว ${existingCount} ภาพ และคุณเลือกไว้แล้ว ${items.length} ภาพ จึงสามารถแนบเพิ่มได้อีกเพียง ${availableSlots} ภาพ (รวมทั้งหมดต้องไม่เกิน ${MAX_IMAGES} ภาพ)`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validFiles: PreviewItem[] = [];
    const invalidNames: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isHeic = /\.(heic|heif)$/i.test(file.name) || ["image/heic", "image/heif"].includes(file.type);
      const isImage = isHeic || file.type.startsWith("image/");

      if (!isImage) {
        invalidNames.push(file.name);
        continue;
      }

      let previewUrl = "";
      if (!isHeic) {
        previewUrl = URL.createObjectURL(file);
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        isHeic,
      });
    }

    if (invalidNames.length > 0) {
      setMessage({
        ok: false,
        text: `บางไฟล์ไม่ใช่รูปภาพจึงไม่ถูกเพิ่ม (${invalidNames.join(", ")}) ระบบรองรับเฉพาะภาพถ่ายเท่านั้น`,
      });
    }

    if (validFiles.length > 0) {
      setItems(prev => [...prev, ...validFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeItem = (id: string) => {
    setViewingItem(curr => curr?.id === id ? null : curr);
    setItems(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const clearAll = () => {
    setViewingItem(null);
    items.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setItems([]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setMessage({ ok: false, text: "กรุณาเลือกภาพสัญญาอย่างน้อย 1 ภาพ" });
      await alertWarning("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกภาพสัญญาอย่างน้อย 1 ภาพ");
      return;
    }
    if (existingCount + items.length > MAX_IMAGES) {
      const warnMsg = `สัญญานี้มีภาพเดิมแล้ว ${existingCount} ภาพ และคุณเลือกใหม่ ${items.length} ภาพ รวมเป็น ${existingCount + items.length} ภาพ ซึ่งเกินกำหนดสูงสุดไม่เกิน ${MAX_IMAGES} ภาพ`;
      setMessage({
        ok: false,
        text: warnMsg,
      });
      await alertWarning("เกินจำนวนที่กำหนด", warnMsg);
      return;
    }
    if (!selectedLeaseId) {
      setMessage({ ok: false, text: "กรุณาเลือกสัญญา" });
      await alertWarning("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสัญญา");
      return;
    }

    setPending(true);
    setMessage(null);
    let successCount = 0;
    const currentQueue = [...items];

    try {
      for (let i = 0; i < currentQueue.length; i++) {
        const item = currentQueue[i];

        let processed: File;
        try {
          processed = await prepareSlipImage(item.file);
        } catch (err) {
          throw new Error(`ภาพ "${item.file.name}": ${err instanceof Error ? err.message : "แปลงภาพไม่สำเร็จ"}`);
        }

        const presigned = await requestContractUploadPresignedUrl({
          leaseId: selectedLeaseId,
          fileName: item.file.name,
          contentType: processed.type,
        });

        if (!presigned.ok) {
          throw new Error(`ภาพ "${item.file.name}": ${presigned.message}`);
        }

        let uploadRes: Response;
        try {
          uploadRes = await fetch(presigned.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": processed.type,
            },
            body: processed,
          });
        } catch {
          throw new Error(
            `ไม่สามารถอัปโหลดภาพ "${item.file.name}" ได้ กรุณาลองใหม่อีกครั้ง`
          );
        }

        if (!uploadRes.ok) {
          throw new Error(
            `อัปโหลดภาพ "${item.file.name}" ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง`
          );
        }

        const confirmRes = await confirmContractUpload({
          leaseId: selectedLeaseId,
          fileUri: presigned.fileUri,
          fileName: item.file.name,
          contentType: processed.type,
        });

        if (!confirmRes.ok) {
          throw new Error(`บันทึกข้อมูลภาพ "${item.file.name}": ${confirmRes.message}`);
        }

        successCount++;
        // Clean up and remove this uploaded item from list
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setItems(prev => prev.filter(p => p.id !== item.id));
      }

      setMessage({ ok: true, text: `แนบภาพสัญญาสำเร็จเรียบร้อยทั้งหมด ${successCount} ภาพ` });
      router.refresh();
      await alertSuccess("แนบภาพสัญญาสำเร็จ", `แนบภาพสัญญาสำเร็จเรียบร้อยทั้งหมด ${successCount} ภาพ`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลด";
      setMessage({
        ok: false,
        text: errMsg,
      });
      await alertError("อัปโหลดไม่สำเร็จ", errMsg);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={handleUpload}>
      {leases.length > 1 ? (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">เลือกสัญญา</label>
          <SelectControl
            name="leaseId"
            ariaLabel="เลือกสัญญา"
            defaultValue={selectedLeaseId}
            onValueChange={(val) => setSelectedLeaseId(val)}
            options={leases.map((l) => ({ value: l.id, label: l.lease_number }))}
            disabled={pending}
          />
        </div>
      ) : (
        <div>
          <span className="block text-xs font-semibold text-slate-500">สัญญา</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800">
              เลขที่สัญญา: {leases[0]?.lease_number ?? "-"}
            </span>
          </div>
          <input type="hidden" name="leaseId" value={selectedLeaseId} />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            แนบภาพสัญญา {existingCount > 0 ? `(มีเดิมแล้ว ${existingCount} ภาพ · แนบเพิ่มได้อีก ${remainingQuota} ภาพ)` : "(สูงสุดไม่เกิน 5 ภาพ)"}
          </label>
          <span className={`text-[11px] font-medium ${items.length >= remainingQuota || existingCount >= MAX_IMAGES ? "text-amber-600 font-bold" : "text-slate-500"}`}>
            {items.length} / {remainingQuota} ภาพ
          </span>
        </div>
        
        {/* Drop / Pick area */}
        <div
          onClick={() => {
            if (pending) return;
            if (existingCount >= MAX_IMAGES) {
              setMessage({
                ok: false,
                text: `สัญญานี้มีภาพที่แนบไว้ครบ ${MAX_IMAGES} ภาพแล้ว (หากต้องการเพิ่มใหม่ กรุณาลบภาพเดิมด้านล่างออกก่อน)`,
              });
              return;
            }
            if (items.length >= remainingQuota) {
              setMessage({
                ok: false,
                text: `คุณเลือกภาพใหม่ครบโควตาแล้ว (ภาพเดิม ${existingCount} + เลือกใหม่ ${items.length} = รวม ${MAX_IMAGES} ภาพ)`,
              });
              return;
            }
            fileInputRef.current?.click();
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center transition ${
            existingCount + items.length >= MAX_IMAGES
              ? "border-slate-300 bg-slate-50 opacity-75 cursor-not-allowed"
              : "border-blue-300 bg-blue-50/70 hover:bg-blue-50"
          } ${pending ? "pointer-events-none opacity-50" : ""}`}
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${existingCount + items.length >= MAX_IMAGES ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-600"}`}>
            <UploadCloud size={24} />
          </div>
          <div className="text-xs text-slate-600">
            {existingCount >= MAX_IMAGES ? (
              <span className="font-semibold text-amber-700">สัญญานี้มีภาพครบ 5 ภาพแล้ว</span>
            ) : items.length >= remainingQuota ? (
              <span className="font-semibold text-slate-700">เลือกภาพใหม่ครบโควตา ({items.length} ภาพ) แล้ว</span>
            ) : (
              <>
                <span className="font-semibold text-blue-700">คลิกเพื่อเลือกภาพ</span> หรือลากไฟล์มาวางที่นี่
              </>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              {existingCount >= MAX_IMAGES
                ? "สัญญานี้มีภาพเดิมครบ 5 ภาพแล้ว หากต้องการเพิ่มภาพใหม่ กรุณากดลบภาพเดิมด้านล่างออกก่อน"
                : remainingQuota - items.length <= 0
                ? "เลือกภาพใหม่ครบตามจำนวนที่แนบได้แล้ว"
                : `สามารถแนบเพิ่มได้อีกไม่เกิน ${remainingQuota - items.length} ภาพ (เฉพาะภาพ JPG, PNG หรือ HEIC จาก iPhone)`}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
            className="hidden"
            disabled={pending || existingCount + items.length >= MAX_IMAGES}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>
      </div>

      {/* Preview Section */}
      {items.length > 0 && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              ภาพที่เลือก ({items.length} ภาพ)
            </span>
            {!pending && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex aspect-3/4 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                {/* Thumbnail image or placeholder */}
                <div
                  onClick={() => {
                    if (item.previewUrl) setViewingItem(item);
                  }}
                  className={`relative flex-1 bg-slate-100 flex items-center justify-center overflow-hidden ${
                    item.previewUrl ? "cursor-pointer" : ""
                  }`}
                  title={item.previewUrl ? "คลิกเพื่อดูภาพขนาดใหญ่" : undefined}
                >
                  {item.previewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      {/* Hover overlay hint */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <span className="flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-xs">
                          <Maximize2 size={12} />
                          ดูภาพขยาย
                        </span>
                      </div>
                    </>
                  ) : item.preparingPreview ? (
                    <div className="flex flex-col items-center gap-1 text-slate-400 p-2 text-center">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                      <span className="text-[10px]">กำลังโหลดรูป...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400 p-2 text-center">
                      <ImageIcon size={24} />
                      <span className="text-[10px]">ภาพ iPhone (HEIC)</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {!pending && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white shadow-xs hover:bg-rose-600 transition cursor-pointer"
                      title="ลบภาพนี้"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Index badge */}
                  <span className="absolute bottom-1.5 left-1.5 z-10 rounded-md bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    #{index + 1}
                  </span>
                </div>

                {/* File info footer */}
                <div className="p-2 bg-white">
                  <p className="truncate text-[11px] font-medium text-slate-700" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}

            {/* Add More button card */}
            {!pending && existingCount + items.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-3/4 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-blue-100">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-semibold">เพิ่มภาพอีก</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Message alert */}
      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={pending || !leases.length || items.length === 0}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span>กำลังแนบภาพสัญญา...</span>
          </>
        ) : (
          `แนบภาพสัญญา${items.length > 0 ? ` (${items.length} ภาพ)` : ""}`
        )}
      </button>

      {/* Image Preview Lightbox Modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setViewingItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[92vh] max-w-[95vw] sm:max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-bold text-slate-800" title={viewingItem.file.name}>
                  {viewingItem.file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(viewingItem.file.size / (1024 * 1024)).toFixed(2)} MB · กด ESC เพื่อปิด
                </p>
              </div>
              <div className="flex items-center gap-2">
                {viewingItem.previewUrl && (
                  <a
                    href={viewingItem.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                  >
                    <ExternalLink size={13} />
                    <span>เปิดแท็บใหม่</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                  title="ปิด"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-900/5 p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingItem.previewUrl}
                alt={viewingItem.file.name}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
