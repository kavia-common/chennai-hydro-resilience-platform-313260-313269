import { useToasts } from "../contexts/ToastContext";

/**
 * PUBLIC_INTERFACE
 */
export function ToastStack() {
  /** Renders toast notifications. */
  const { toasts, dismissToast } = useToasts();

  return (
    <div className="toastStack" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.variant || "info"}`}>
          <div className="toastTitle">{t.title}</div>
          {t.message && <div className="toastMsg">{t.message}</div>}
          <button className="toastClose" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
