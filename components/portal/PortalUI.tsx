"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import type { DashboardActionResult } from "@/app/(portal)/resource-actions";
import { alertSuccess, alertError } from "@/lib/sweetalert";
import { DateTimeControl, type DateTimeMode } from "@/components/ui/DateTimeControl";
import { SelectControl, type SelectOption } from "@/components/ui/SelectControl";
export { DataTable } from "@/components/ui/DataTable";
export { EmptyState } from "@/components/ui/EmptyState";
export { StatusBadge } from "@/components/ui/StatusBadge";

export type FieldErrors = Record<string, string>;

export function PageHeader({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{title}</h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-2xl leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          onClick={onAction}
          type="button"
        >
          <Plus size={18} />
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </header>
  );
}

export function Modal({
  title,
  description,
  children,
  onClose,
  pending = false,
  maxWidth,
  className,
  headerActions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  pending?: boolean;
  maxWidth?: number | string;
  className?: string;
  headerActions?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const pendingRef = useRef(pending);

  useEffect(() => {
    closeRef.current = onClose;
    pendingRef.current = pending;
  }, [onClose, pending]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusableSelector = 'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusFrame = requestAnimationFrame(() => {
      const bodyTarget = dialogRef.current?.querySelector<HTMLElement>(
        'section > :not(header) input:not([disabled]):not([type="hidden"]), section > :not(header) select:not([disabled]), section > :not(header) textarea:not([disabled]), section > :not(header) button:not([disabled])'
      );
      (bodyTarget ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector))?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 p-4 grid place-items-center bg-slate-950/60 backdrop-blur-xs overflow-y-auto print:static print:block print:w-full print:p-0 print:bg-transparent print:backdrop-blur-none print:overflow-visible"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section
        aria-describedby={description ? "portal-modal-description" : undefined}
        aria-modal="true"
        aria-labelledby="portal-modal-title"
        className={`portal-modal w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-slate-100 print:static print:block print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible ${className ?? ""}`}
        ref={dialogRef}
        role="dialog"
        style={maxWidth ? { maxWidth } : undefined}
        tabIndex={-1}
      >
        <header className="min-h-[64px] shrink-0 px-6 py-5 flex items-center justify-between gap-4 border-b border-slate-100 print:hidden">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 leading-tight" id="portal-modal-title">{title}</h2>
            {description ? <p className="text-xs text-slate-500 mt-1" id="portal-modal-description">{description}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <button
              aria-label="ปิด"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-2 focus:ring-slate-200"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain print:overflow-visible">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function PortalForm({ action, organizationId, validate, onSuccess, onCancel, children, submitLabel = "บันทึกข้อมูล", submitDisabled = false, submitDisabledReason }: {
  action: (formData: FormData) => Promise<DashboardActionResult>;
  organizationId: string;
  validate: (values: Record<string, FormDataEntryValue>) => object;
  onSuccess: () => void;
  onCancel?: () => void;
  children: (errors: FieldErrors, clear: (name: string) => void) => React.ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<DashboardActionResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const clear = (name: string) => setErrors((current) => current[name] ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)) : current);

  return (
    <form className="portal-form min-w-0 [&_.grid>*]:min-w-0" noValidate onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("organizationId", organizationId);
        const nextErrors = validate(Object.fromEntries(formData)) as FieldErrors;
        setErrors(nextErrors);
        setResult(null);
        if (Object.keys(nextErrors).length) {
          requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
          return;
        }
        startTransition(async () => {
          try {
            const nextResult = await action(formData);
            setResult(nextResult);
            if (nextResult.ok) {
              onSuccess();
              router.refresh();
              await alertSuccess("บันทึกข้อมูลสำเร็จ", nextResult.message || "ระบบบันทึกข้อมูลเรียบร้อยแล้ว");
            } else {
              requestAnimationFrame(() => {
                resultRef.current?.scrollIntoView({ block: "nearest" });
                resultRef.current?.focus({ preventScroll: true });
              });
            }
          } catch {
            const errMsg = "บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง";
            setResult(null);
            await alertError("เกิดข้อผิดพลาด", errMsg);
          }
        });
      }}
    >
      <div className="p-6 flex flex-col gap-4 text-left">
        {result && !result.ok ? (
          <div ref={resultRef} tabIndex={-1} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium focus:outline-none" role="alert">
            <AlertCircle size={17} />
            <span>{result.message}</span>
          </div>
        ) : null}
        {children(errors, clear)}
        <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {onCancel ? (
            <button
              className="px-4.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              disabled={pending}
              onClick={onCancel}
              type="button"
            >
              ยกเลิก
            </button>
          ) : null}
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            disabled={pending || submitDisabled}
            title={submitDisabled ? submitDisabledReason : undefined}
            type="submit"
          >
            {pending ? "กำลังบันทึก..." : submitLabel}
          </button>
        </footer>
      </div>
    </form>
  );
}

export function DeleteConfirmation({ action, organizationId, entityId, entityField, title, subject, detail, submitLabel, onClose }: {
  action: (formData: FormData) => Promise<DashboardActionResult>;
  organizationId: string;
  entityId: string;
  entityField: string;
  title: string;
  subject: string;
  detail: string;
  submitLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DashboardActionResult | null>(null);

  return (
    <Modal title={title} description="ตรวจสอบให้แน่ใจก่อนลบ ข้อมูลที่ลบแล้วไม่สามารถกู้คืนจากหน้านี้ได้" onClose={onClose} pending={pending}>
      <form
        className="p-6 flex flex-col gap-4 text-left"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("organizationId", organizationId);
          formData.set(entityField, entityId);
          setResult(null);
          startTransition(async () => {
            try {
              const nextResult = await action(formData);
              setResult(nextResult);
              if (nextResult.ok) {
                onClose();
                router.refresh();
                await alertSuccess("ลบข้อมูลสำเร็จ", nextResult.message || "รายการถูกลบเรียบร้อยแล้ว");
              } else {
                await alertError("ลบข้อมูลไม่สำเร็จ", nextResult.message || "ไม่สามารถลบรายการได้");
              }
            } catch {
              const errMsg = "ลบข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง";
              setResult({ ok: false, message: errMsg });
              await alertError("เกิดข้อผิดพลาด", errMsg);
            }
          });
        }}
      >
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
          <span className="p-2 rounded-lg bg-rose-100 text-rose-600">
            <TriangleAlert aria-hidden="true" size={22} />
          </span>
          <div>
            <strong className="text-sm font-bold block">{subject}</strong>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">{detail}</p>
          </div>
        </div>
        {result && !result.ok ? (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold" role="alert">
            <AlertCircle size={17} />
            <span>{result.message}</span>
          </div>
        ) : null}
        <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            disabled={pending}
            type="submit"
          >
            <Trash2 size={16} />
            <span>{pending ? "กำลังลบ..." : submitLabel}</span>
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function Field({ label, name, error, clear, required = false, type = "text", value, defaultValue, min, max, step, placeholder, disabled = false, readOnly = false, onChange }: { label: string; name: string; error?: string; clear: (name: string) => void; required?: boolean; type?: string; value?: string | number; defaultValue?: string | number | null; min?: number | string; max?: number | string; step?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean; onChange?: (value: string) => void }) {
  if (["date", "month", "time", "datetime-local"].includes(type)) {
    return (
      <div className="flex flex-col gap-1.5 text-left">
        <span className="text-xs font-semibold text-slate-700">{label}{required ? " *" : ""}</span>
        <DateTimeControl ariaLabel={label} defaultValue={defaultValue} disabled={disabled} invalid={Boolean(error)} max={max} min={min} mode={type as DateTimeMode} name={name} onValueChange={(val) => { clear(name); onChange?.(val); }} placeholder={placeholder} />
        {error ? <small className="field-error">{error}</small> : null}
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-semibold text-slate-700">{label}{required ? " *" : ""}</span>
      <input
        aria-invalid={Boolean(error)}
        aria-readonly={readOnly || undefined}
        className={`w-full h-10 px-3 rounded-xl border text-slate-900 text-sm outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            : "border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        }`}
        defaultValue={value !== undefined ? undefined : (defaultValue ?? "")}
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onChange={(event) => { clear(name); onChange?.(event.target.value); }}
        placeholder={placeholder}
        readOnly={readOnly}
        step={step}
        type={type}
        value={value}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function SelectField({ label, name, error, clear, options, value, defaultValue = "", required = false, onChange }: { label: string; name: string; error?: string; clear: (name: string) => void; options: SelectOption[]; value?: string; defaultValue?: string; required?: boolean; onChange?: (value: string, form: HTMLFormElement | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-semibold text-slate-700">{label}{required ? " *" : ""}</span>
      <SelectControl ariaLabel={label} defaultValue={defaultValue} invalid={Boolean(error)} name={name} onValueChange={(nextValue, form) => { clear(name); onChange?.(nextValue, form); }} options={options} placeholder={`เลือก${label}`} value={value} />
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}

export function EditButton({ label, onClick, disabled = false, title = "แก้ไข" }: { label: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      aria-label={`แก้ไข ${label}`}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs shrink-0"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Pencil size={15} />
    </button>
  );
}

export function DeleteButton({ label, onClick, disabled = false, title = "ลบ" }: { label: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      aria-label={`ลบ ${label}`}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs shrink-0"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Trash2 size={15} />
    </button>
  );
}

export function ViewButton({ label, onClick, title = "ดูรายละเอียด" }: { label: string; onClick: () => void; title?: string }) {
  return (
    <button
      aria-label={`${title} ${label}`}
      className="h-8 px-3 rounded-lg flex items-center gap-1.5 border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
      onClick={onClick}
      title={title}
      type="button"
    >
      <span>{title}</span>
    </button>
  );
}

export function PrintButton({ label, onClick, title = "พิมพ์ A4" }: { label: string; onClick: () => void; title?: string }) {
  return (
    <button
      aria-label={`${title} ${label}`}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
      onClick={onClick}
      title={title}
      type="button"
    >
      <X size={0} className="hidden" />
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    </button>
  );
}
