import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-auto rounded-t-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[28rem] sm:max-h-none sm:rounded-none sm:p-7",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </aside>
    </div>
  );
}
