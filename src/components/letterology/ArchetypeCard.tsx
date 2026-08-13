import { Link } from "@tanstack/react-router";
import type { Archetype } from "@/lib/letterology/types";
import { themeOf } from "@/lib/letterology/lexicon";

export function ArchetypeCard({
  archetype,
  featured = false,
}: {
  archetype: Archetype;
  featured?: boolean;
}) {
  const [first, second, third] = archetype.triad;

  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
        {featured ? "Your archetype" : "Archetype"}
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {[first, second, third].map((letter, index) => (
          <span key={`${letter}-${index}`} className="flex flex-col items-center gap-1">
            <span
              className={
                index === 0
                  ? "font-display text-6xl leading-none text-primary sm:text-7xl"
                  : "font-display text-5xl leading-none text-ink sm:text-6xl"
              }
            >
              {letter}
            </span>
            <span className="font-display text-xs tracking-[0.14em] text-muted uppercase">
              {index === 0 ? "Primary" : index === 1 ? "Most common" : "Next common"}
            </span>
          </span>
        ))}
      </div>
      <h3 className="mt-5 font-display text-3xl leading-tight text-ink sm:text-4xl">
        {archetype.title}
      </h3>
      <p className="mt-2 text-sm tracking-wide text-muted">
        {archetype.code} · {archetype.house}
      </p>
      <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{archetype.portrait}</p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{archetype.invitation}</p>
      <p className="mt-5 text-sm text-muted">
        {themeOf(first).name} first; then the most common letters {themeOf(second).name.toLowerCase()} and{" "}
        {themeOf(third).name.toLowerCase()}.
      </p>
      <Link
        to="/archetypes"
        search={{ house: first, code: archetype.code }}
        className="mt-5 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
      >
        Open this house
      </Link>
    </article>
  );
}
