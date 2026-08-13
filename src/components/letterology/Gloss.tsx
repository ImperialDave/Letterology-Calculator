import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { gloss, termOf } from "@/lib/letterology/glossary";
import { cn } from "@/lib/utils";

export function GlossLine({ id, className }: { id: string; className?: string }) {
  return <p className={cn("text-sm leading-relaxed text-muted", className)}>{gloss(id)}</p>;
}

export function TermStack({
  id,
  term,
  className,
}: {
  id: string;
  term?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{term ?? termOf(id)}</p>
      <p className="mt-1 text-sm leading-snug text-muted">{gloss(id)}</p>
    </div>
  );
}

export function Plainly({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 border-t border-ink/10 pt-4", className)}>
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">In other words</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/80">{children}</p>
    </div>
  );
}

export function KeyLink({ className }: { className?: string }) {
  return (
    <Link
      to="/key"
      className={cn(
        "inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase",
        className,
      )}
    >
      How to read this
    </Link>
  );
}
