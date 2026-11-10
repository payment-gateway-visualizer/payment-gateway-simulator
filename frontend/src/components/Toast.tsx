

"use client";

import { useEffect } from "react";

export interface ToastMessage {
  type: "error" | "success";
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(onClose, 6000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const styles =
    toast.type === "error"
      ? "border-[#F0B7BE] bg-[#FFF0F2] text-[#7F1224]"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`fixed left-1/2 top-5 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <span>{toast.text}</span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close message"
        className="shrink-0 text-lg font-bold"
      >
        ×
      </button>
    </div>
  );
}
