import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { PageShare } from "@/components/letterology/PageShare";
import { Sheet } from "@/components/ui/sheet";
import { VOICE } from "@/lib/letterology/voice";
import { stoicheiaCardFile, stoicheiaNamePath, tweetStoicheion } from "@/lib/stoicheia/copy";
import { dayOfStoicheion, weatherLine } from "@/lib/stoicheia/day";
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

      <section className="space-y-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">The analysis</p>
        <AnalysisBlock kicker="Axis · proodos / epistrophe" body={reading.axisCopy} />
        <AnalysisBlock kicker="Hymn · motion of the vowels" body={reading.hymnLine} />
        <AnalysisBlock kicker="Motion" body={reading.motion.line} />
        <AnalysisBlock kicker="Civic body · consonants" body={reading.somaCopy} />
        <AnalysisBlock kicker="Letter walk · mouth and elements" body={reading.letterLine} />
        <AnalysisBlock kicker="Likeness · Cratylus made small" body={reading.likeness.line} />
        <AnalysisBlock kicker="Tightness" body={reading.tightness.line} />
        <AnalysisBlock kicker="Daimon of the total" body={reading.daimonLine} />
        {reading.friends.length > 0 ? (
          <AnalysisBlock
            kicker="Same weight in the canon"
            body={`This total is also ${reading.friends.map((item) => `${item.greek} (${item.english})`).join(", ")}. A sign in the commons of letters, not a claim that two lives are one.`}
          />
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
          Today · Attic hour · {today.weather}
        </p>
        <p className="font-display text-2xl text-ink">{today.headline}</p>
        <p className="leading-relaxed text-ink/90">{weatherLine(today.weather)}</p>
        <p className="leading-relaxed text-ink/90">{today.meeting}</p>
        <p className="text-sm text-muted">{today.festivalLine}</p>
        <p className="font-display text-sm text-ink">{today.invitation}</p>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Synthesis</p>
        <p className="mt-2 leading-relaxed text-ink/90">{reading.synthesis}</p>
        <p className="mt-4 font-display text-ink">{reading.invitation}</p>
      </section>

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
        {reading.kinInName.length > 0 ? (
          <p className="mt-4 text-sm text-ink/80">
            Kin living in this name: {reading.kinInName.join(" · ")}.
          </p>
        ) : null}
        {reading.erisInName.length > 0 ? (
          <p className="mt-2 text-sm text-ink/80">
            Strife living in this name: {reading.erisInName.join(" · ")}.
          </p>
        ) : null}
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

function AnalysisBlock({ kicker, body }: { kicker: string; body: string }) {
  return (
    <div>
      <p className="font-display text-xs tracking-[0.14em] text-primary uppercase">{kicker}</p>
      <p className="mt-1 leading-relaxed text-ink/90">{body}</p>
    </div>
  );
}
