"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import type { DashboardActionResult } from "@/app/(portal)/resource-actions";
import { DateTimeControl, type DateTimeMode } from "@/components/ui/DateTimeControl";
import { SelectControl, type SelectOption } from "@/components/ui/SelectControl";
export { DataTable } from "@/components/ui/DataTable";
export { EmptyState } from "@/components/ui/EmptyState";
export { StatusBadge } from "@/components/ui/StatusBadge";

export type FieldErrors = Record<string, string>;

export function PageHeader({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return <header className="portal-page-header"><div><h1>{title}</h1><p>{description}</p></div>{actionLabel && onAction ? <button className="portal-primary" onClick={onAction} type="button"><Plus size={18} />{actionLabel}</button> : null}</header>;
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

    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus());
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
    <div className="portal-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section
        aria-describedby={description ? "portal-modal-description" : undefined}
        aria-modal="true"
        aria-labelledby="portal-modal-title"
        className={`portal-modal ${className ?? ""}`}
        ref={dialogRef}
        role="dialog"
        style={maxWidth ? { width: `min(${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth}, 95vw)` } : undefined}
        tabIndex={-1}
      >
        <header>
          <div>
            <h2 id="portal-modal-title">{title}</h2>
            {description ? <p id="portal-modal-description">{description}</p> : null}
          </div>
          <div className="portal-modal-header-actions">
            {headerActions}
            <button aria-label="ปิด" className="portal-modal-close-btn" disabled={pending} onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}

export function PortalForm({ action, organizationId, validate, onSuccess, children, submitLabel = "บันทึกข้อมูล", submitDisabled = false, submitDisabledReason }: {
  action: (formData: FormData) => Promise<DashboardActionResult>;
  organizationId: string;
  validate: (values: Record<string, FormDataEntryValue>) => object;
  onSuccess: () => void;
  children: (errors: FieldErrors, clear: (name: string) => void) => React.ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<DashboardActionResult | null>(null);
  const clear = (name: string) => setErrors((current) => current[name] ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)) : current);

  return <form className="portal-form" noValidate onSubmit={(event) => {
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
      const nextResult = await action(formData);
      setResult(nextResult);
      if (nextResult.ok) {
        router.refresh();
        onSuccess();
      }
    });
  }}>
    {result && !result.ok ? <div className="portal-form-alert" role="alert"><AlertCircle size={17} /><span>{result.message}</span></div> : null}
    {children(errors, clear)}
    <footer><button className="portal-primary" disabled={pending || submitDisabled} title={submitDisabled ? submitDisabledReason : undefined} type="submit">{pending ? "กำลังบันทึก..." : submitLabel}</button></footer>
  </form>;
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

  return <Modal title={title} description="ตรวจสอบให้แน่ใจก่อนลบ ข้อมูลที่ลบแล้วไม่สามารถกู้คืนจากหน้านี้ได้" onClose={onClose} pending={pending}>
    <form className="portal-delete-form" onSubmit={(event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formData.set("organizationId", organizationId);
      formData.set(entityField, entityId);
      setResult(null);
      startTransition(async () => {
        const nextResult = await action(formData);
        setResult(nextResult);
        if (nextResult.ok) {
          router.refresh();
          onClose();
        }
      });
    }}>
      <div className="portal-delete-warning"><span><TriangleAlert aria-hidden="true" size={24} /></span><div><strong>{subject}</strong><p>{detail}</p></div></div>
      {result && !result.ok ? <div className="portal-form-alert" role="alert"><AlertCircle size={17} /><span>{result.message}</span></div> : null}
      <footer><button className="portal-secondary" disabled={pending} onClick={onClose} type="button">ยกเลิก</button><button className="portal-danger" disabled={pending} type="submit"><Trash2 size={16} />{pending ? "กำลังลบ..." : submitLabel}</button></footer>
    </form>
  </Modal>;
}

export function Field({ label, name, error, clear, required = false, type = "text", defaultValue, min, max, step, placeholder, disabled = false, readOnly = false, onChange }: { label: string; name: string; error?: string; clear: (name: string) => void; required?: boolean; type?: string; defaultValue?: string | number | null; min?: number | string; max?: number | string; step?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean; onChange?: (value: string) => void }) {
  if (["date", "month", "time", "datetime-local"].includes(type)) {
    return <div className="portal-field"><span>{label}{required ? " *" : ""}</span><DateTimeControl ariaLabel={label} defaultValue={defaultValue} disabled={disabled} invalid={Boolean(error)} max={max} min={min} mode={type as DateTimeMode} name={name} onValueChange={(value) => { clear(name); onChange?.(value); }} placeholder={placeholder} />{error ? <small className="field-error">{error}</small> : null}</div>;
  }
  return <label className="portal-field"><span>{label}{required ? " *" : ""}</span><input aria-invalid={Boolean(error)} aria-readonly={readOnly || undefined} defaultValue={defaultValue ?? ""} disabled={disabled} max={max} min={min} name={name} onChange={(event) => { clear(name); onChange?.(event.target.value); }} placeholder={placeholder} readOnly={readOnly} step={step} type={type} />{error ? <small className="field-error">{error}</small> : null}</label>;
}

export function SelectField({ label, name, error, clear, options, value, defaultValue = "", required = false, onChange }: { label: string; name: string; error?: string; clear: (name: string) => void; options: SelectOption[]; value?: string; defaultValue?: string; required?: boolean; onChange?: (value: string, form: HTMLFormElement | null) => void }) {
  return <div className="portal-field"><span>{label}{required ? " *" : ""}</span><SelectControl ariaLabel={label} defaultValue={defaultValue} invalid={Boolean(error)} name={name} onValueChange={(nextValue, form) => { clear(name); onChange?.(nextValue, form); }} options={options} placeholder={`เลือก${label}`} value={value} />{error ? <small className="field-error">{error}</small> : null}</div>;
}

export function EditButton({ label, onClick }: { label: string; onClick: () => void }) { return <button aria-label={`แก้ไข ${label}`} className="portal-icon-button" onClick={onClick} title="แก้ไข" type="button"><Pencil size={16} /></button>; }
export function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) { return <button aria-label={`ลบ ${label}`} className="portal-icon-button danger" onClick={onClick} title="ลบ" type="button"><Trash2 size={16} /></button>; }
