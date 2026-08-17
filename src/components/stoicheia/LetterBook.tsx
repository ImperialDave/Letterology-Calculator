import { Link } from "@tanstack/react-router";
import { Explain } from "@/components/letterology/Gloss";
import type { LetterPortrait } from "@/lib/stoicheia/portrait";
import { markOf } from "@/lib/stoicheia/letters";

export function LetterBookView({
  portrait,
  compact = false,
}: {
  portrait: LetterPortrait;
  compact?: boolean;
}) {
  const { book, hora, milesian, milesianSpell, seriesLine, diphthongPartners, choir } = portrait;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="The mouth">
          How this mark is made. Sound first, then the hour, then the number.
        </Explain>
        <p className="mt-3 font-display text-lg text-ink">
          {book.greekName} · {book.does}
        </p>
        <p className="mt-3 leading-relaxed text-ink/90">{book.mouth}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">{book.placeLine}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{book.grammarLine}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{book.breathLine}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Explain title="Element">Empedocles’ four roots, read from the mouth, not from a house.</Explain>
          <p className="mt-3 font-display text-2xl capitalize text-ink">{book.element}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{book.elementLine}</p>
        </section>
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Explain title="Milesian weight">The same mark used as a number. We do not fold it.</Explain>
          <p className="mt-3 font-display text-2xl text-ink">
            {milesianSpell} · {milesian}
          </p>
          <p className="mt-2 font-display text-xs tracking-[0.14em] text-muted uppercase">{book.valueBand}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{book.valueLine}</p>
        </section>
      </div>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="What the mouth does">From the Cratylus and the old grammar. A charge, not a personality.</Explain>
        <p className="mt-3 font-display text-2xl text-ink">{book.charge} · {book.does}</p>
        <p className="mt-3 leading-relaxed text-ink/90">{book.cratylus}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">{seriesLine}</p>
      </section>

      {!compact ? (
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <Explain title="Where it sits in a name">
            First, last, middle, or alone. Sung if it is a vowel. Civic if it is a consonant.
          </Explain>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="font-display text-xs tracking-[0.16em] text-muted uppercase">As the first letter</dt>
              <dd className="mt-1 leading-relaxed text-ink/90">{book.asFirst}</dd>
            </div>
            <div>
              <dt className="font-display text-xs tracking-[0.16em] text-muted uppercase">In the middle</dt>
              <dd className="mt-1 leading-relaxed text-ink/90">{book.asMedial}</dd>
            </div>
            <div>
              <dt className="font-display text-xs tracking-[0.16em] text-muted uppercase">As the last letter</dt>
              <dd className="mt-1 leading-relaxed text-ink/90">{book.asLast}</dd>
            </div>
            <div>
              <dt className="font-display text-xs tracking-[0.16em] text-muted uppercase">If it is the whole name</dt>
              <dd className="mt-1 leading-relaxed text-ink/90">{book.asOnly}</dd>
            </div>
            <div>
              <dt className="font-display text-xs tracking-[0.16em] text-muted uppercase">
                {choir ? "In the hymn" : "As public work"}
              </dt>
              <dd className="mt-1 leading-relaxed text-ink/90">{choir ? book.inHymn : book.inSoma}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it works</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{book.works}</p>
        </section>
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">When it fails</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{book.fails}</p>
        </section>
      </div>

      {choir ? (
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <Explain title="In the hymn">Seven vowels, seven planets. Sung, never weighed.</Explain>
          <p className="mt-3 font-display text-2xl text-ink">
            {choir.face} · {choir.god}
          </p>
          <p className="mt-2 text-sm text-muted capitalize">{choir.planet}</p>
          <p className="mt-3 leading-relaxed text-ink/90">{choir.line}</p>
        </section>
      ) : null}

      {diphthongPartners.length > 0 ? (
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <Explain title="Sung pairs">
            Two vowels in a row are one mouth-motion. Not a new letter.
          </Explain>
          <ul className="mt-4 space-y-3">
            {diphthongPartners.map((row) => (
              <li key={row.pair}>
                <p className="font-display text-lg text-ink">{row.pair}</p>
                <p className="text-sm leading-relaxed text-ink/80">{row.line}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm leading-relaxed text-muted">{book.orderLine}</p>
      <p className="text-sm text-muted">
        Hour-face {hora.noun} · {hora.watch} watch · {hora.realm}
      </p>
    </div>
  );
}

export function LetterWalkList({
  walk,
}: {
  walk: {
    letter: string;
    index: number;
    place: string;
    roleLine: string;
    milesian: number;
    book: { spoken: string; does: string; element: string; breath: string };
  }[];
}) {
  return (
    <ol className="divide-y divide-ink/10">
      {walk.map((step) => (
        <li key={`${step.letter}-${step.index}`} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link
              to="/stoicheia/horae/$mark"
              params={{ mark: markOf(step.letter) }}
              className="font-display text-2xl text-ink hover:text-primary"
            >
              {step.letter} · {step.book.spoken}
            </Link>
            <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">
              {step.place} · {step.book.element} · {step.book.breath} · {step.milesian}
            </p>
          </div>
          <p className="mt-1 text-sm text-ink/70">{step.book.does}</p>
          <p className="mt-2 leading-relaxed text-ink/90">{step.roleLine}</p>
        </li>
      ))}
    </ol>
  );
}
