import { Link } from "@tanstack/react-router";
import { Explain } from "@/components/letterology/Gloss";
import { houseOf } from "@/lib/letterology/archetypes";
import { bondsOf } from "@/lib/letterology/circle";
import { themeOf } from "@/lib/letterology/lexicon";
import { pigmentOf } from "@/lib/letterology/pigment";
import type { Letter } from "@/lib/letterology/types";
import { VOWEL_LETTERS } from "@/lib/letterology/types";

export function LetterDetail({ letter }: { letter: Letter }) {
  const theme = themeOf(letter);
  const house = houseOf(letter);
  const { allies, enemies } = bondsOf(letter);
  const isInner = VOWEL_LETTERS.has(letter) || letter === "Y";
  const kind = isInner ? "Inner orientation" : "Outer expression";

  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-6xl leading-none" style={{ color: pigmentOf(letter).css }}>
          {letter}
        </p>
        <div className="text-right">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{kind}</p>
          <p className="mt-1 text-sm text-muted">
            {isInner
              ? "A vowel: the private life — how this letter feels from the inside."
              : "A consonant: how this letter shows up in a room."}
          </p>
          <h3 className="mt-1 font-display text-2xl text-ink">{theme.name}</h3>
          <p className="mt-1 text-sm text-muted">{pigmentOf(letter).name} on the wheel</p>
        </div>
      </div>
      <div className="mt-4 border-t border-ink/10 pt-4">
        <p className="font-display text-lg text-ink">{house.house}</p>
        <p className="mt-1 text-sm italic text-ink/70">{house.myth}</p>
        <p className="mt-2 text-sm text-ink/70">
          Old tables call this {house.tradition} — {house.correspondence}. A likeness, not a creed.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/90">{house.doctrine}</p>
      </div>
      <p className="mt-4 text-sm tracking-wide text-muted">{theme.keywords.join(" · ")}</p>
      <p className="mt-4 text-[1.05rem] leading-relaxed text-ink">{theme.essence}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <p className="text-sm leading-relaxed text-ink/85">{theme.inner}</p>
        <p className="text-sm leading-relaxed text-ink/85">{theme.outer}</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border-t border-ink/10 pt-4">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it fails</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{house.shadow}</p>
        </div>
        <div className="border-t border-ink/10 pt-4">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it works</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{house.gold}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border-t border-ink/10 pt-4">
          <Explain title="Allies">
            The three houses that complete this one’s work. If the letter is already in a
            username, that help is in the name. If not, it comes from other people.
          </Explain>
          <p className="mt-2 font-display text-lg tracking-[0.12em] text-ink">
            {allies.map((item) => item.other).join(" · ")}
          </p>
        </div>
        <div className="border-t border-ink/10 pt-4">
          <Explain title="Enemies">
            The three houses that work against it — a blind spot, not a villain. Look here
            for the job this role keeps refusing.
          </Explain>
          <p className="mt-2 font-display text-lg tracking-[0.12em] text-ink">
            {enemies.map((item) => item.other).join(" · ")}
          </p>
        </div>
      </div>
      <p className="mt-5 border-t border-ink/10 pt-4 text-sm leading-relaxed text-muted">
        {house.invitation}
      </p>
      <Link
        to="/circle"
        search={{ house: letter }}
        className="mt-4 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
      >
        See on the circle
      </Link>
    </article>
  );
}
