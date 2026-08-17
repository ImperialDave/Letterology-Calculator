import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { PageShare } from "@/components/letterology/PageShare";
import { Sheet } from "@/components/ui/sheet";
import { VOICE } from "@/lib/letterology/voice";
import { stoicheiaCardFile, stoicheiaNamePath, tweetStoicheion } from "@/lib/stoicheia/copy";
import { dayOfStoicheion } from "@/lib/stoicheia/day";
import type { Stoicheion } from "@/lib/stoicheia/engine";
import { markOf } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import type { Stoich } from "@/lib/stoicheia/letters";

export function GreekPortrait({ reading }: { reading: Stoicheion }) {
  const [mark, setMark] = useState<Stoich | null>(null);
  const [rest, setRest] = useState(false);
  const today = dayOfStoicheion(reading);
  const selected = mark ? portraitOf(mark) : null;

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">Greek reading</p>
        <p className="mt-3 font-display text-4xl tracking-[0.12em] text-ink sm:text-6xl">{reading.spelled}</p>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">{reading.epithet}</h1>
        <p className="mt-2 text-lg text-ink/80">{reading.road.title}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Starts as {reading.road.first.noun}, ends as {reading.road.last.noun}. {reading.motion.line} The
          total lands on {reading.omphalosHora.noun} — an hour, not a lucky number.
        </p>
        <p className="mt-3 text-sm text-muted">{today.headline}</p>
        <div className="mt-6 flex justify-center">
          <PageShare
            path={stoicheiaNamePath(reading.raw)}
            caption={tweetStoicheion(reading)}
            imagePath={`/og/${stoicheiaCardFile("name", reading.raw)}`}
          />
        </div>
      </header>

      <NightWheel
        first={reading.axis.proodos}
        last={reading.axis.epistrophe}
        daimon={reading.omphalos}
        hour={today.attic.hora.letter}
        onSelect={(letter) => setMark(letter)}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {reading.letterWalk.map((step) => (
          <button
            key={`${step.letter}-${step.index}`}
            type="button"
            onClick={() => setMark(step.letter)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-raised px-3 font-display text-lg text-ink shadow-[var(--shadow-border)]"
          >
            {step.letter}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setRest(true)}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
        >
          {VOICE.moreLetters}
        </button>
        <Link
          to="/two"
          search={{ a: reading.raw, b: undefined, tongue: "el", mode: undefined }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          {VOICE.anotherUsername}
        </Link>
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setMark(null)} title={selected?.book.spoken}>
        {selected ? <LetterBookView portrait={selected} /> : null}
      </Sheet>
      <Sheet open={rest} onClose={() => setRest(false)} title="The rest">
        <p className="leading-relaxed text-ink/90">{reading.letterLine}</p>
        <p className="mt-4 leading-relaxed text-ink/90">{reading.somaCopy}</p>
        <p className="mt-4 leading-relaxed text-ink/90">{reading.likeness.line}</p>
        <p className="mt-4 leading-relaxed text-ink/90">{reading.tightness.line}</p>
        <p className="mt-4 leading-relaxed text-ink/90">{reading.daimonLine}</p>
        {reading.friends.length > 0 ? (
          <p className="mt-4 text-sm text-ink/80">
            This total is also {reading.friends.map((item) => `${item.greek} (${item.english})`).join(", ")}.
          </p>
        ) : null}
        <p className="mt-4 text-sm text-muted">{today.festivalLine}</p>
      </Sheet>
    </div>
  );
}
