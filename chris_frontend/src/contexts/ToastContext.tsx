import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  variant?: "info" | "success" | "error";
};

type ToastState = {
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastState | null>(null);

function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * PUBLIC_INTERFACE
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  /** Provides app-wide toasts (notifications). */
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid();
      const toast: Toast = { id, variant: "info", ...t };
      setToasts((all) => [toast, ...all].slice(0, 4));

      window.setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, pushToast, dismissToast }), [toasts, pushToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 */
export function useToasts(): ToastState {
  /** Hook to access toasts. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}
