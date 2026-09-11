"use client";

import Swal from "sweetalert2";

function alertCopy(title: string, text: string | undefined, fallback: string) {
  return !text && title.length > 60
    ? { titleText: fallback, text: title }
    : { titleText: title, text };
}

export const alertSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: "success",
    ...alertCopy(title, text, "ดำเนินการสำเร็จ"),
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#059669", // emerald-600
    timer: 2500,
    timerProgressBar: true,
  });
};

export const alertError = (title: string, text?: string) => {
  return Swal.fire({
    icon: "error",
    ...alertCopy(title, text, "ไม่สามารถดำเนินการได้"),
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#e11d48", // rose-600
  });
};
export const alertWarning = (title: string, text?: string) => {
  return Swal.fire({
    icon: "warning",
    ...alertCopy(title, text, "กรุณาตรวจสอบข้อมูล"),
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#d97706", // amber-600
  });
};
export const alertConfirm = async (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "question" | "info";
  confirmColor?: string;
}) => {
  return Swal.fire({
    ...alertCopy(options.title, options.text, "ยืนยันการดำเนินการ"),
    icon: options.icon ?? "question",
    showCancelButton: true,
    confirmButtonColor: options.confirmColor ?? "#059669",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: options.confirmText ?? "ยืนยัน",
    cancelButtonText: options.cancelText ?? "ยกเลิก",
    reverseButtons: true,
  });
};

export { Swal };
