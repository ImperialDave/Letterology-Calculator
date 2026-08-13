import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A heading plus the one sentence that belongs right here — not a trip to a dictionary. */
export function Explain({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{title}</p>
      <p className="mt-1 text-sm leading-snug text-muted">{children}</p>
    </div>
  );
}

export function TermStack({
  id: _id,
  term,
  className,
  children,
}: {
  id?: string;
  term?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Explain title={term ?? ""} className={className}>
      {children}
    </Explain>
  );
}
