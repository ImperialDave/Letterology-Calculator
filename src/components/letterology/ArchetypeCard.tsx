import { Link } from "@tanstack/react-router";
import { PigmentMix, PigmentPip } from "@/components/letterology/Pigment";
import { TRIAD_LABELS } from "@/lib/letterology/glossary";
import { themeOf } from "@/lib/letterology/lexicon";
import { pigmentOf } from "@/lib/letterology/pigment";
import type { Archetype } from "@/lib/letterology/types";

export function ArchetypeCard({
  archetype,
  featured = false,
}: {
  archetype: Archetype;
  featured?: boolean;
}) {
  const [first, second, third] = archetype.triad;
  const labels = [TRIAD_LABELS.house, TRIAD_LABELS.manner, TRIAD_LABELS.field];

  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
        {featured ? "Your archetype" : "Archetype"}
      </p>
      <p className="mt-1 text-sm text-muted">
        Three letters: the role, how you work, and where the work happens. Their pigments mix
        into one color.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {[first, second, third].map((letter, index) => (
          <span key={`${letter}-${index}`} className="flex flex-col items-center gap-1">
            <span
              className="font-display leading-none"
              style={{
                color: pigmentOf(letter).css,
                fontSize: index === 0 ? "clamp(3rem, 8vw, 4.5rem)" : "clamp(2.5rem, 7vw, 3.75rem)",
              }}
            >
              {letter}
            </span>
            <span className="inline-flex items-center gap-1 font-display text-xs tracking-[0.14em] text-muted uppercase">
              <PigmentPip letter={letter} size="sm" />
              {labels[index]?.term}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-6">
        <PigmentMix triad={archetype.triad} />
      </div>
      <h3 className="mt-5 font-display text-3xl leading-tight text-ink sm:text-4xl">
        {archetype.title}
      </h3>
      <p className="mt-2 text-sm tracking-wide text-muted">
        {archetype.code} · {archetype.house}
      </p>
      <p className="mt-1 text-sm italic text-ink/70">{archetype.myth}</p>
      <p className="mt-2 text-sm text-ink/70">
        Old tables call this {archetype.tradition} — {archetype.correspondence}. A likeness, not a
        creed.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/80">{archetype.doctrine}</p>
      <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{archetype.portrait}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border-t border-ink/10 pt-4">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it fails</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{archetype.shadow}</p>
        </div>
        <div className="border-t border-ink/10 pt-4">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it works</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{archetype.gold}</p>
        </div>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">{archetype.invitation}</p>
      <p className="mt-5 text-sm text-muted">
        {themeOf(first).name} names the house (the role); {themeOf(second).name.toLowerCase()} is the
        manner (how); {themeOf(third).name.toLowerCase()} is the field (where).
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
