import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HouseCircle, type CircleSeat } from "@/components/letterology/HouseCircle";
import { Explain } from "@/components/letterology/Gloss";
import {
  MixPot,
  PigmentLegend,
  PigmentRibbon,
  PigmentSwatch,
  SeatMixer,
} from "@/components/letterology/Pigment";
import { PageShare } from "@/components/letterology/PageShare";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { archetypeOf, houseOf } from "@/lib/letterology/archetypes";
import { alliesOf, bondsOf, isCircleLetter } from "@/lib/letterology/circle";
import { themeOf } from "@/lib/letterology/lexicon";
import { mixLabel, pigmentOf } from "@/lib/letterology/pigment";
import { pageCardMeta } from "@/lib/letterology/share";
import type { Letter, Triad } from "@/lib/letterology/types";

type Search = { house?: string };

export const Route = createFileRoute("/circle")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.house === "string" ? search.house.toUpperCase() : "A";
    return { house: isCircleLetter(raw) ? raw : "A" };
  },
  loader: ({ location }) => {
    const raw = new URL(location.href, "https://www.letterology.club").searchParams.get("house") ?? "A";
    const house = raw.toUpperCase();
    return { house: isCircleLetter(house) ? house : "A" };
  },
  head: ({ loaderData }) => {
    const letter = (loaderData?.house ?? "A") as Letter;
    const house = houseOf(letter);
    return pageCardMeta({
      title: `Circle · ${house.noun}`,
      description: house.myth,
      path: `/circle?house=${letter}`,
      imagePath: `/og/circle-${letter.toLowerCase()}.jpg`,
    });
  },
  component: CirclePage,
});

function CirclePage() {
  const { house } = Route.useSearch();
  const navigate = useNavigate({ from: "/circle" });
  const selected = (house ?? "A") as Letter;
  const meta = houseOf(selected);
  const theme = themeOf(selected);
  const pigment = pigmentOf(selected);
  const { allies, enemies } = bondsOf(selected);
  const [manner, setManner] = useState<Letter>(selected);
  const [field, setField] = useState<Letter>(alliesOf(selected)[0]);
  const [picking, setPicking] = useState<CircleSeat>("house");
  const triad: Triad = [selected, manner, field];
  const arch = archetypeOf(triad);

  function assign(letter: Letter) {
    if (picking === "house") {
      navigate({ search: { house: letter } });
      return;
    }
    if (picking === "manner") {
      setManner(letter);
      return;
    }
    setField(letter);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="circle" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            Twenty-six seats, twenty-six pigments
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Circle of Houses</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            The alphabet stands in a wheel, A at the top. Around it sits a color wheel — each
            letter a mineral, amber at dawn walking the spectrum back to ochre. An archetype is
            three letters. Its color is those three pigments in one pot: house half, manner
            three-tenths, field two-tenths.
          </p>
          <PageShare
            path={`/circle?house=${selected}`}
            caption={`${meta.house}\n${pigment.name} on the wheel`}
            imagePath={`/og/circle-${selected.toLowerCase()}.jpg`}
          />
        </header>

        <section className="mt-10 rounded-xl bg-raised px-2 py-6 shadow-[var(--shadow-border)] sm:px-6 sm:py-8">
          <Explain title="Mix a color">
            Choose which seat you are setting — house, manner, or field — then tap a letter.
            The well in the middle is the mix. That mix is the archetype’s color.
          </Explain>
          <div className="mt-5">
            <SeatMixer triad={triad} picking={picking} onPick={setPicking} />
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Setting the {picking}. Tap a letter on the wheel.
          </p>
          <div className="mt-6">
            <HouseCircle
              selected={selected}
              triad={triad}
              picking={picking}
              onSelect={assign}
            />
          </div>
          <PigmentRibbon className="mx-auto mt-6 max-w-md" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-6 bg-primary" aria-hidden="true" />
              Ally — a pigment line
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-6 border-t border-dashed border-ink/50" aria-hidden="true" />
              Enemy — dark seat, pigment edge
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <MixPot triad={triad} />
          <p className="mt-5 font-display text-2xl text-ink">{arch.title}</p>
          <p className="mt-1 text-sm text-muted">
            {arch.code} · {mixLabel(triad)}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/85">{arch.myth}</p>
          <Link
            to="/archetypes"
            search={{ house: triad[0], code: arch.code }}
            className="mt-4 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Open this mix
          </Link>
        </section>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
                {theme.name}
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink">{meta.house}</h2>
              <p className="mt-2 text-sm italic text-ink/70">{meta.myth}</p>
            </div>
            <PigmentSwatch letter={selected} />
          </div>
          <p className="mt-4 text-sm text-ink/70">
            Old tables call this {meta.tradition} — {meta.correspondence}. A likeness, not a
            creed. On the wheel this house sits {pigment.name}.
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{meta.doctrine}</p>
          <p className="mt-4 flex flex-wrap gap-x-4">
            <Link
              to="/archetypes"
              search={{ house: selected }}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              Open this house
            </Link>
            <Link
              to="/bond"
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              Bond two names
            </Link>
          </p>
        </section>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <Explain title="The mineral scale">
            Every letter keeps one pigment. Vowels sit a little lighter. Tap any chip to set
            the house and keep mixing.
          </Explain>
          <div className="mt-5">
            <PigmentLegend selected={selected} onSelect={(letter) => navigate({ search: { house: letter } })} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BondColumn kind="Allies" hint="These three complete this house’s work." items={allies} onSelect={(letter) => navigate({ search: { house: letter } })} />
          <BondColumn kind="Enemies" hint="These three work against it — a blind spot, not a villain." items={enemies} onSelect={(letter) => navigate({ search: { house: letter } })} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function BondColumn({
  kind,
  hint,
  items,
  onSelect,
}: {
  kind: "Allies" | "Enemies";
  hint: string;
  items: { other: Letter; copy: string }[];
  onSelect: (letter: Letter) => void;
}) {
  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      <Explain title={kind}>{hint}</Explain>
      <ul className="mt-4 divide-y divide-ink/10">
        {items.map((item) => {
          const other = houseOf(item.other);
          const pigment = pigmentOf(item.other);
          return (
            <li key={item.other} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => onSelect(item.other)}
                className="flex min-h-11 w-full items-baseline gap-3 text-left"
              >
                <span className="font-display text-2xl" style={{ color: pigment.css }}>
                  {item.other}
                </span>
                <span className="font-display text-lg text-ink">
                  {other.house.replace("House of the ", "")}
                </span>
                <span className="ml-auto text-sm text-muted">{pigment.name}</span>
              </button>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{item.copy}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
