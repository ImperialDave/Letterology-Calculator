import { allHouseNames } from "@/lib/letterology/archetypes";
import { themeOf } from "@/lib/letterology/lexicon";
import type { Letter } from "@/lib/letterology/types";
import { VOWEL_LETTERS } from "@/lib/letterology/types";

export function LetterDetail({ letter }: { letter: Letter }) {
  const theme = themeOf(letter);
  const house = allHouseNames().find((item) => item.letter === letter);
  const kind = VOWEL_LETTERS.has(letter) || letter === "Y" ? "Inner orientation" : "Outer expression";

  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-6xl leading-none text-primary">{letter}</p>
        <div className="text-right">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{kind}</p>
          <h3 className="mt-1 font-display text-2xl text-ink">{theme.name}</h3>
        </div>
      </div>
      {house ? (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <p className="font-display text-lg text-ink">{house.house}</p>
          <p className="mt-1 text-sm italic text-ink/70">{house.myth}</p>
          <p className="mt-1 font-display text-xs tracking-[0.14em] text-muted uppercase">
            {house.tradition}
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-sm tracking-wide text-muted">{theme.keywords.join(" · ")}</p>
      <p className="mt-4 text-[1.05rem] leading-relaxed text-ink">{theme.essence}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <p className="text-sm leading-relaxed text-ink/85">{theme.inner}</p>
        <p className="text-sm leading-relaxed text-ink/85">{theme.outer}</p>
      </div>
      <p className="mt-5 border-t border-ink/10 pt-4 text-sm leading-relaxed text-muted">
        {theme.invitation}
      </p>
    </article>
  );
}
