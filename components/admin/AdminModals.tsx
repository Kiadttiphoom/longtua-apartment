"use client";

import { Modal } from "@/components/portal/PortalUI";
import { AlertTriangle, Trash2 } from "lucide-react";

export { Modal as AdminModal };

export function AdminConfirmDeleteModal({
  title = "ยืนยันการลบข้อมูล",
  message,
  itemName,
  action,
  idFieldName,
  idValue,
  isOpen,
  onClose,
}: {
  title?: string;
  message?: string;
  itemName: string;
  action: (formData: FormData) => void;
  idFieldName: string;
  idValue: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <Modal title={title} onClose={onClose} maxWidth={460}>
      <form action={action} className="p-6 space-y-4">
        <input type="hidden" name={idFieldName} value={idValue} />
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={20} />
          <div className="text-xs space-y-1">
            <p className="font-semibold">{message ?? "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"}</p>
            <p className="font-bold text-rose-900 bg-rose-100/70 px-2 py-1 rounded">
              {itemName}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
          >
            <Trash2 size={14} />
            <span>ยืนยันการลบ</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
