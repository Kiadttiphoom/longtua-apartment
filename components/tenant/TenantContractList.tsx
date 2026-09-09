"use client";

import { useState, useEffect } from "react";
import { thaiDate } from "@/lib/format";
import { Eye, Download, Maximize2, X, Trash2, Loader2 } from "lucide-react";
import { deleteTenantContract } from "@/app/(tenant)/tenant/lease/upload-action";

export interface TenantContractFile {
  id: string;
  file_name: string;
  created_at: string;
}

export function TenantContractList({ files }: { files: TenantContractFile[] }) {
  const [viewingFile, setViewingFile] = useState<TenantContractFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<TenantContractFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Close preview modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingFile(null);
    };
    if (viewingFile) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewingFile]);

  if (!files.length) {
    return <p className="text-sm text-slate-500">ยังไม่มีไฟล์สัญญา</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <article
            key={file.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
          >
            {/* Thumbnail with click to open lightbox */}
            <div
              onClick={() => setViewingFile(file)}
              className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-slate-100 flex items-center justify-center"
              title="คลิกเพื่อดูภาพสัญญาขยาย"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tenant-contracts/${file.id}`}
                alt={file.file_name}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs">
                  <Maximize2 size={13} />
                  กดเพื่อดูภาพขยาย
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <strong className="block truncate text-sm font-semibold text-slate-800" title={file.file_name}>
                  {file.file_name}
                </strong>
                <p className="mt-1 text-xs text-slate-500">แนบเมื่อ {thaiDate(file.created_at)}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewingFile(file)}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye size={15} />
                  <span>ดูภาพสัญญา</span>
                </button>
                <div className="flex items-center gap-3">
                  <a
                    href={`/api/tenant-contracts/${file.id}?download`}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-800"
                  >
                    <Download size={14} />
                    <span>ดาวน์โหลด</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setFileToDelete(file);
                    }}
                    className="flex items-center gap-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="ลบไฟล์สัญญานี้"
                  >
                    <Trash2 size={14} />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setViewingFile(null)}
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
                <p className="truncate text-sm font-bold text-slate-800" title={viewingFile.file_name}>
                  {viewingFile.file_name}
                </p>
                <p className="text-xs text-slate-500">
                  แนบเมื่อ {thaiDate(viewingFile.created_at)} · กด ESC เพื่อปิด
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/tenant-contracts/${viewingFile.id}?download`}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingFile;
                    setViewingFile(null);
                    setDeleteError("");
                    setFileToDelete(target);
                  }}
                  className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>ลบภาพนี้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFile(null)}
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
                src={`/api/tenant-contracts/${viewingFile.id}`}
                alt={viewingFile.file_name}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => !deleting && setFileToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบภาพสัญญา</h3>
                <p className="text-xs text-slate-500">ไฟล์จะถูกลบออกจากระบบถาวร</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 break-all font-medium">
              {fileToDelete.file_name}
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    const res = await deleteTenantContract(fileToDelete.id);
                    if (!res.ok) {
                      setDeleteError(res.message);
                      setDeleting(false);
                    } else {
                      setFileToDelete(null);
                      setDeleting(false);
                    }
                  } catch {
                    setDeleteError("เกิดข้อผิดพลาดในการลบไฟล์");
                    setDeleting(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันลบ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
