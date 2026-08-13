import { Link } from "@tanstack/react-router";
import type { Archetype } from "@/lib/letterology/types";

export function ArchetypeList({
  items,
  caption,
  note,
}: {
  items: Archetype[];
  caption?: string;
  note?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      {caption ? (
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{caption}</p>
      ) : null}
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
      <ul className="mt-4 divide-y divide-ink/10">
        {items.map((item) => (
          <li key={item.code}>
            <Link
              to="/archetypes"
              search={{ house: item.houseLetter, code: item.code }}
              className="flex min-h-11 items-baseline justify-between gap-4 py-3"
            >
              <span className="min-w-0">
                <span className="font-display text-ink">{item.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{item.house}</span>
              </span>
              <span className="shrink-0 font-display tracking-[0.16em] text-primary">{item.code}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
