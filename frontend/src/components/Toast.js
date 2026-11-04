"use client";
import { useEffect } from "react";

// A small pop-up message. type is "error" or "success".
// It closes itself after 6 seconds, or when you click ×.
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
      <span>{toast.text}</span>
      <button type="button" onClick={onClose} aria-label="Close message">×</button>
    </div>
  );
}
