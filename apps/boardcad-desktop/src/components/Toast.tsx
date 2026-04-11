import { useEffect } from "react";

export type ToastTone = "info" | "success" | "error";

type ToastProps = {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({
  message,
  tone = "info",
  onDismiss,
  durationMs = 4200,
}: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      className={`toast toast--${tone}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast__text">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
