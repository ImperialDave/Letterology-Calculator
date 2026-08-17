import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { PageShare } from "@/components/letterology/PageShare";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LetterWalkList } from "@/components/stoicheia/LetterBook";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { HOW_TO, stoicheiaCardFile, stoicheiaNamePath, tweetStoicheion } from "@/lib/stoicheia/copy";
import { dayOfStoicheion, weatherLine } from "@/lib/stoicheia/day";
import { consonantWeights, readStoicheion } from "@/lib/stoicheia/engine";
import { FOLD_TABLE } from "@/lib/stoicheia/family";
import { horaOf } from "@/lib/stoicheia/horae";
import { markOf } from "@/lib/stoicheia/letters";
import { VOICE } from "@/lib/letterology/voice";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { n?: string };

export const Route = createFileRoute("/stoicheia/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  loader: ({ location }) => ({
    n: new URL(location.href, "https://www.letterology.club").searchParams.get("n") ?? undefined,
  }),
  head: ({ loaderData }) => {
    const reading = readStoicheion(loaderData?.n ?? "");
    if (!reading) {
      return pageCardMeta({
        title: "Stoicheia",
        description: VOICE.stoicheiaLede,
        path: "/stoicheia",
        imagePath: "/og.jpg",
      });
    }
    return pageCardMeta({
      title: `${reading.raw} · ${reading.road.title}`,
      description: reading.synthesis,
      path: stoicheiaNamePath(reading.raw),
      imagePath: `/og/${stoicheiaCardFile("name", reading.raw)}`,
    });
  },
  component: StoicheiaDoor,
});

function StoicheiaDoor() {
  const { n } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/" });
  const [value, setValue] = useState(n ?? "");
  const reading = n ? readStoicheion(n) : null;
  const today = reading ? dayOfStoicheion(reading) : null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ search: { n: value.trim() || undefined } });
  }

  return (
    <StoicheiaFrame current="Name">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · the Greek reading</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Stoicheia</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">{VOICE.stoicheiaLede}</p>
        {reading ? (
          <PageShare
            path={stoicheiaNamePath(reading.raw)}
            caption={tweetStoicheion(reading)}
            imagePath={`/og/${stoicheiaCardFile("name", reading.raw)}`}
          />
        ) : (
          <PageShare
            path="/stoicheia"
            caption={"Stoicheia\nA second reading, from the Greek alphabet."}
            imagePath="/og.jpg"
          />
        )}
      </header>

      <form onSubmit={onSubmit} className="mt-8 max-w-xl">
        <Label htmlFor="stoich-n">A username</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="stoich-n"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Απόλλων or Apollo"
            autoCapitalize="none"
            spellCheck={false}
          />
          <Button type="submit" className="h-12 shrink-0">
            {VOICE.stoicheiaButton}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">{VOICE.stoicheiaHint}</p>
      </form>

      {n && !reading ? <p className="mt-8 text-sm text-primary">{VOICE.stoicheiaEmpty}</p> : null}

      {reading && today ? (
        <div className="mt-10 space-y-10">
          <div>
            <p className="font-display text-4xl tracking-[0.12em] text-ink">{reading.spelled}</p>
            <p className="mt-2 font-display text-2xl text-ink">{reading.epithet}</p>
            <p className="mt-1 text-lg text-ink/80">{reading.road.title}</p>
            <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{reading.synthesis}</p>
          </div>

          <NightWheel
            first={reading.axis.proodos}
            last={reading.axis.epistrophe}
            daimon={reading.omphalos}
            hour={today.attic.hora.letter}
          />

          <section>
            <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">Lesser</p>
            <p className="mt-1 text-sm text-muted">The road, the crossing, today.</p>
            <div className="mt-4 space-y-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <p className="text-sm leading-relaxed text-ink/85">{reading.crossing.line}</p>
              {reading.crossing.steps.length > 0 ? (
                <p className="text-sm text-muted">{reading.crossing.steps.join(" · ")}</p>
              ) : null}
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Today for this name</p>
              <p className="font-display text-xs tracking-[0.14em] text-primary uppercase">{today.weather}</p>
              <p className="font-display text-2xl text-ink">{today.headline}</p>
              <p className="text-sm text-muted">{today.festivalLine}</p>
              <p className="text-sm text-muted">{weatherLine(today.weather)}</p>
              <p className="leading-relaxed text-ink/90">{today.meeting}</p>
              {today.leftover ? <p className="text-sm text-ink/80">{today.leftover}</p> : null}
            </div>
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Today for this name</p>
            <p className="mt-2 font-display text-xs tracking-[0.14em] text-primary uppercase">{today.weather}</p>
            <p className="mt-2 font-display text-2xl text-ink">{today.headline}</p>
            <p className="mt-2 text-sm text-muted">{weatherLine(today.weather)}</p>
            <p className="mt-3 leading-relaxed text-ink/90">{today.meeting}</p>
            {today.leftover ? <p className="mt-2 text-sm text-ink/80">{today.leftover}</p> : null}
            <p className="mt-3 font-display text-sm text-ink">{today.invitation}</p>
          </section>

          <section>
            <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">Greater</p>
            <p className="mt-1 text-sm text-muted">The ladder, the public work, likeness, tightness.</p>
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
              First letter → last letter
            </p>
            <p className="mt-2 font-display text-3xl text-ink">
              {reading.axis.proodos} → {reading.axis.epistrophe}
            </p>
            <p className="mt-2 text-sm text-muted">
              {reading.road.first.noun} toward {reading.road.last.noun}
              {reading.road.closed ? " — a closed road" : ""}
            </p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.axisCopy}</p>
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
              Vowels, in order · the hymn
            </p>
            <p className="mt-2 font-display text-2xl tracking-[0.14em] text-ink">
              {reading.hymn.map((item) => item.letter).join(" · ") || "—"}
            </p>
            <p className="mt-3 font-display text-lg text-ink">{reading.motion.line}</p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.hymnLine}</p>
            {reading.hymn.length > 0 ? (
              <ol className="mt-5 space-y-3">
                {reading.hymn.map((item, index) => (
                  <li key={`${item.letter}-${index}`}>
                    <p className="font-display text-lg text-ink">
                      {item.letter} · {item.face} · {item.god}
                    </p>
                    <p className="text-sm text-ink/75">{item.line}</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
              Consonants · the public work
            </p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.somaCopy}</p>
            <ul className="mt-4 divide-y divide-ink/10">
              {consonantWeights(reading.letters).map((row) => (
                <li key={row.letter} className="flex items-baseline justify-between gap-3 py-2">
                  <Link
                    to="/stoicheia/horae/$mark"
                    params={{ mark: markOf(row.letter) }}
                    className="font-display text-xl text-ink"
                  >
                    {row.letter} · {horaOf(row.letter).noun}
                  </Link>
                  <span className="text-sm text-muted">
                    {row.count === 1 ? "once" : `${row.count} times`}
                  </span>
                </li>
              ))}
            </ul>
            {reading.kinInName.length > 0 ? (
              <p className="mt-3 text-sm text-ink/80">
                Related letters already in the name: {reading.kinInName.join(" · ")}
              </p>
            ) : null}
            {reading.erisInName.length > 0 ? (
              <p className="mt-1 text-sm text-ink/80">
                Strife-pairs already in the name: {reading.erisInName.join(" · ")}
              </p>
            ) : null}
            <p className="mt-5 leading-relaxed text-ink/90">{reading.likeness.line}</p>
            <p className="mt-2 leading-relaxed text-ink/90">{reading.tightness.line}</p>
          </section>

          <section>
            <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">Each letter</p>
            <p className="mt-1 text-sm text-muted">Sound, element, number, and the job of the seat.</p>
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The mouth of this name</p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.letterLine}</p>
            {reading.diphthongs.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {reading.diphthongs.map((row) => (
                  <li key={`${row.pair}-${row.at}`} className="text-sm leading-relaxed text-ink/80">
                    {row.line}
                  </li>
                ))}
              </ul>
            ) : null}
            <LetterWalkList walk={reading.letterWalk} />
          </section>

          <section>
            <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">Seeing</p>
            <p className="mt-1 text-sm text-muted">The daimon of the total, old friends at this weight.</p>
          </section>

          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
              The daimon of the total
            </p>
            <p className="mt-2 font-display text-3xl text-ink">
              <Link
                to="/stoicheia/horae/$mark"
                params={{ mark: markOf(reading.omphalos) }}
                className="hover:text-primary"
              >
                {reading.omphalos} · {reading.omphalosHora.noun}
              </Link>
            </p>
            <p className="mt-2 text-sm text-muted">
              Written {reading.sumSpell} · {reading.omphalosHora.greek}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">{reading.omphalosHora.myth}</p>
            <p className="mt-4 leading-relaxed text-ink/90">{reading.daimonLine}</p>
            {reading.friends.length > 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-ink/85">
                This total is also {reading.friends.map((item) => `${item.greek} (${item.english})`).join(", ")}.
                The ancients treated a shared sum as a sign, not a soul.
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No famous friend at this weight. The total still sits {reading.omphalosHora.noun}.
              </p>
            )}
            <p className="mt-5 font-display text-sm text-ink">{reading.invitation}</p>
          </section>
        </div>
      ) : (
        <section className="mt-12 max-w-2xl">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">How to read this</p>
          <ul className="mt-4 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)]">
            {HOW_TO.map((item) => (
              <li key={item.term} className="py-4">
                <p className="font-display text-lg text-ink">{item.term}</p>
                <p className="text-sm italic text-muted">{item.greek}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/85">{item.plain}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">How Latin letters fold</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {FOLD_TABLE.map((row) => (
              <li key={row.from} className="rounded-md bg-raised px-3 py-2 shadow-[var(--shadow-border)]">
                {row.from} → {row.to}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10">
        <Link
          to="/stoicheia/doctrine"
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Why this is not Letterology
        </Link>
      </p>
    </StoicheiaFrame>
  );
}
