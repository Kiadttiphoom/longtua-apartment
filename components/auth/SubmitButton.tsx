"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button className="button primary large" disabled={pending} type="submit">
      {pending ? "กำลังดำเนินการ..." : children}
    </button>
  );
}
