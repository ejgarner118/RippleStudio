type EmptyGuidedBannerProps = {
  step: number;
  onNext: () => void;
  onDismiss: () => void;
};

const STEPS = [
  {
    title: "Step 1 — Plan outline",
    body: "Starting from the Standard template, shape length and width on the plan view. Use control points to refine the half-outline; the opposite rail mirrors automatically.",
  },
  {
    title: "Step 2 — Deck & bottom",
    body: "Keep deck and bottom overlays on in the sidebar. Edit rocker and thickness along the stringer in profile view.",
  },
  {
    title: "Step 3 — Cross-sections",
    body: "Switch to section mode, place stations along the board, and tune rails. Use soft/hard templates or duplicate sections as needed.",
  },
] as const;

export function EmptyGuidedBanner({ step, onNext, onDismiss }: EmptyGuidedBannerProps) {
  const i = Math.min(Math.max(0, step), STEPS.length - 1);
  const s = STEPS[i]!;
  const isLast = i >= STEPS.length - 1;

  return (
    <div className="empty-guided-banner" role="region" aria-label="Guided setup">
      <div className="empty-guided-banner__text">
        <strong>{s.title}</strong>
        <span className="empty-guided-banner__body">{s.body}</span>
      </div>
      <div className="empty-guided-banner__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
          Skip guided setup
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={isLast ? onDismiss : onNext}>
          {isLast ? "Done" : "Next step"}
        </button>
      </div>
    </div>
  );
}
