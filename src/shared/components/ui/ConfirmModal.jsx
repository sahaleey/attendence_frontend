import React, { useEffect, useRef } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const iconBg = isDanger
    ? "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400"
    : isWarning
    ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400"
    : "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400";

  const confirmBtnBg = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const Icon = isDanger ? AlertTriangle : isWarning ? AlertTriangle : Info;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-950 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
            <Icon size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p id="confirm-modal-desc" className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs transition disabled:opacity-60 ${confirmBtnBg}`}
          >
            {busy ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
