import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext({
  pushToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message, type = "success", duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        className="fixed inset-x-0 top-4 z-[9999] mx-auto flex w-full max-w-sm flex-col gap-2.5 px-4 pointer-events-none sm:left-auto sm:right-4 sm:mx-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isInfo = toast.type === "info";
          const isSuccess = toast.type === "success" || !toast.type;

          const borderBg = isError
            ? "border-red-500/30 bg-red-900/95 text-red-100 dark:bg-red-950/95 shadow-red-950/20"
            : isInfo
            ? "border-blue-500/30 bg-blue-900/95 text-blue-100 dark:bg-blue-950/95 shadow-blue-950/20"
            : "border-emerald-500/30 bg-emerald-900/95 text-emerald-100 dark:bg-emerald-950/95 shadow-emerald-950/20";

          const Icon = isError ? AlertCircle : isInfo ? Info : CheckCircle2;

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${borderBg}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-xs sm:text-sm font-medium leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-0.5 text-current opacity-70 transition hover:opacity-100 hover:scale-110"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
