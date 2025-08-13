"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms
}

interface ToastInternal extends Required<Omit<ToastOptions, "id">> {
  id: string;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
};

function ToastContainer({ toasts, onClose }: { toasts: ToastInternal[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-20 z-[9999] flex w-[360px] max-w-[90vw] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border p-3 shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 ${
            t.type === "success"
              ? "border-green-200 dark:border-green-800"
              : t.type === "error"
                ? "border-red-200 dark:border-red-800"
                : t.type === "warning"
                  ? "border-yellow-200 dark:border-yellow-800"
                  : "border-gray-200 dark:border-gray-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              t.type === "success"
                ? "bg-green-500"
                : t.type === "error"
                  ? "bg-red-500"
                  : t.type === "warning"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
            }`} />
            <div className="flex-1">
              {t.title && <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{t.title}</div>}
              <div className="text-sm text-gray-700 dark:text-gray-300">{t.message}</div>
            </div>
            <button
              onClick={() => onClose(t.id)}
              className="ml-2 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Record<string, any>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback((opts: ToastOptions) => {
    const id = opts.id || Math.random().toString(36).slice(2);
    const toast: ToastInternal = {
      id,
      title: opts.title ?? "",
      message: opts.message,
      type: opts.type ?? "info",
      duration: opts.duration ?? 3000,
    };
    setToasts((prev) => [...prev, toast]);
    timers.current[id] = setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { showToast } = useToastContext();
  return {
    success: (message: string, title = "Thành công") => showToast({ message, title, type: "success" }),
    error: (message: string, title = "Lỗi") => showToast({ message, title, type: "error", duration: 5000 }),
    info: (message: string, title = "Thông báo") => showToast({ message, title, type: "info" }),
    warning: (message: string, title = "Cảnh báo") => showToast({ message, title, type: "warning" }),
  };
}
