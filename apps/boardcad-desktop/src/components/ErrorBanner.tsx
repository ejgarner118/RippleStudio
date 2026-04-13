type ErrorBannerProps = {
  message: string | null;
  title?: string;
  tone?: "error" | "warning";
  onDismiss: () => void;
};

export function ErrorBanner({
  message,
  title = "Something went wrong",
  tone = "error",
  onDismiss,
}: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className={`banner banner--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <div className="banner__content">
        <strong className="banner__title">{title}</strong>
        <p className="banner__text">{message}</p>
      </div>
      <button type="button" className="btn btn--ghost banner__dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
