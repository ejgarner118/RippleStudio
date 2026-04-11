type ErrorBannerProps = {
  message: string | null;
  title?: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, title = "Something went wrong", onDismiss }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="banner banner--error" role="alert">
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
