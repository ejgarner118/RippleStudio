import { useId } from "react";

type SegmentedOption<T extends string> = {
  id: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  const baseId = useId();
  const selectedIndex = options.findIndex((opt) => opt.id === value);
  return (
    <div
      className="segmented-control"
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={(e) => {
        if (options.length < 2) return;
        const key = e.key;
        let nextIndex = selectedIndex;
        if (key === "ArrowRight") nextIndex = (selectedIndex + 1) % options.length;
        else if (key === "ArrowLeft") nextIndex = (selectedIndex - 1 + options.length) % options.length;
        else if (key === "Home") nextIndex = 0;
        else if (key === "End") nextIndex = options.length - 1;
        else return;
        e.preventDefault();
        const next = options[nextIndex];
        if (next) onChange(next.id);
      }}
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            id={`${baseId}-${opt.id}-tab`}
            className={`segmented-control__btn ${selected ? "segmented-control__btn--active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

