"use client";

import Swal from "sweetalert2";

export const alertSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#059669", // emerald-600
    timer: 2500,
    timerProgressBar: true,
  });
};

export const alertError = (title: string, text?: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#e11d48", // rose-600
  });
};
export const alertWarning = (title: string, text?: string) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
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
    title: options.title,
    text: options.text,
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
