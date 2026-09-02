"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>กำลังดำเนินการ...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
