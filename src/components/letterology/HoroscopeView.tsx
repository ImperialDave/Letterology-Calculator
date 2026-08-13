import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { ArchetypeList } from "@/components/letterology/ArchetypeList";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { LetterMap } from "@/components/letterology/LetterMap";
import { Button } from "@/components/ui/button";
import { houseOf } from "@/lib/letterology/archetypes";
import { bondCopy } from "@/lib/letterology/circle";
import { readingAsText } from "@/lib/letterology/engine";
import { themeOf } from "@/lib/letterology/lexicon";
import type { Horoscope, Letter } from "@/lib/letterology/types";

function Pill({
  letter,
  label,
  active,
  onClick,
}: {
  letter: Letter;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex h-9 items-center gap-2 rounded-full bg-primary px-3 text-primary-fg"
          : "inline-flex h-9 items-center gap-2 rounded-full bg-raised px-3 text-ink shadow-[var(--shadow-border)]"
      }
    >
      <span className="font-display text-sm">{letter}</span>
      <span className="font-display text-xs tracking-[0.14em] uppercase opacity-80">{label}</span>
    </button>
  );
}

export function HoroscopeView({ horoscope }: { horoscope: Horoscope }) {
  const [selected, setSelected] = useState<Letter>(horoscope.signature);
  const [copied, setCopied] = useState(false);
  const theme = themeOf(selected);
  const text = useMemo(() => readingAsText(horoscope), [horoscope]);

  async function copyReading() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="stagger-in space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <span
            aria-hidden="true"
            className="font-display text-7xl leading-none text-primary sm:text-8xl"
          >
            {horoscope.signature}
          </span>
          <div>
            <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">
              Letterological Horoscope
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">
              {horoscope.displayName}
            </h2>
            <p className="mt-1 text-sm tracking-wide text-muted">{horoscope.normalized}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {horoscope.statements.method}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={copyReading} className="self-start sm:self-auto">
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy reading"}
        </Button>
      </header>

      <ArchetypeCard archetype={horoscope.archetype} featured />

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">On the wheel</p>
            <h3 className="mt-2 font-display text-2xl text-ink">{horoscope.archetype.house}</h3>
          </div>
          <Link
            to="/circle"
            search={{ house: horoscope.signature }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Open the circle
          </Link>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{horoscope.statements.wheel}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <WheelColumn
            title="Allies"
            house={horoscope.signature}
            letters={horoscope.allies}
            present={horoscope.kinPresent}
            kind="ally"
            onSelect={setSelected}
          />
          <WheelColumn
            title="Enemies"
            house={horoscope.signature}
            letters={horoscope.enemies}
            present={horoscope.crossPresent}
            kind="enemy"
            onSelect={setSelected}
          />
        </div>
      </section>

      <ArchetypeList
        items={horoscope.kindred}
        caption="Same manner and field, seated in an allied house"
      />

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Primary theme</p>
        <h3 className="mt-2 font-display text-3xl text-ink">
          {horoscope.primary.letter} — {themeOf(horoscope.primary.letter).name}
        </h3>
        <p className="mt-3 max-w-3xl text-base leading-relaxed">{horoscope.statements.primary}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Pill
            letter={horoscope.primary.letter}
            label="Primary"
            active={selected === horoscope.primary.letter}
            onClick={() => setSelected(horoscope.primary.letter)}
          />
          {horoscope.secondaries.map((item) => (
            <Pill
              key={item.letter}
              letter={item.letter}
              label={themeOf(item.letter).name}
              active={selected === item.letter}
              onClick={() => setSelected(item.letter)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Gifts</p>
          <p className="mt-3 leading-relaxed text-ink/90">{horoscope.statements.gifts}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {horoscope.tension ? "Living cross" : "Growth edge"}
          </p>
          {horoscope.tension ? (
            <h3 className="mt-2 font-display text-xl text-ink">{horoscope.tension.title}</h3>
          ) : null}
          <p className="mt-3 leading-relaxed text-ink/90">{horoscope.statements.challenge}</p>
        </article>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">The climate</p>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed">{horoscope.statements.synthesis}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Vowels · inner</p>
          <p className="mt-3 text-sm leading-relaxed">{horoscope.statements.vowelNote}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Consonants · outer</p>
          <p className="mt-3 text-sm leading-relaxed">{horoscope.statements.consonantNote}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Today's date letter</p>
          <button
            type="button"
            onClick={() => setSelected(horoscope.daily)}
            className="mt-2 text-left"
          >
            <h3 className="font-display text-2xl text-ink">
              {horoscope.daily} — {themeOf(horoscope.daily).name}
            </h3>
          </button>
          <p className="mt-2 text-sm leading-relaxed">{horoscope.statements.daily}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">This fortnight</p>
          <button
            type="button"
            onClick={() => setSelected(horoscope.period)}
            className="mt-2 text-left"
          >
            <h3 className="font-display text-2xl text-ink">
              {horoscope.period} — {themeOf(horoscope.period).name}
            </h3>
          </button>
          <p className="mt-2 text-sm leading-relaxed">{horoscope.statements.period}</p>
        </article>
      </section>
      <p className="text-center">
        <Link
          to="/almanac"
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Open the almanac
        </Link>
      </p>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Living map</p>
            <p className="mt-1 text-sm text-muted">
              The path traces the name. Darker cells carry more weight. Gold rings are allies; ink rings are enemies.
            </p>
          </div>
          <p className="text-sm text-muted">
            Unlived seats{" "}
            {horoscope.shadows.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelected(letter)}
                className="ml-1 font-display text-ink underline-offset-4 hover:underline"
              >
                {letter}
              </button>
            ))}
          </p>
        </div>
        <LetterMap horoscope={horoscope} selected={selected} onSelect={setSelected} />
      </section>

      <LetterDetail letter={selected} />

      <p className="text-center text-sm italic text-muted">
        The letters we carry are already speaking. This is a mirror, not a sentence.
        {theme ? ` ${theme.name} is one climate among many.` : ""}
      </p>
    </div>
  );
}

function WheelColumn({
  title,
  house,
  letters,
  present,
  kind,
  onSelect,
}: {
  title: string;
  house: Letter;
  letters: Letter[];
  present: Letter[];
  kind: "ally" | "enemy";
  onSelect: (letter: Letter) => void;
}) {
  return (
    <div>
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
      <ul className="mt-3 divide-y divide-ink/10">
        {letters.map((letter) => {
          const inName = present.includes(letter);
          return (
            <li key={letter} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => onSelect(letter)}
                className="flex min-h-11 w-full items-baseline gap-3 text-left"
              >
                <span className="font-display text-2xl text-primary">{letter}</span>
                <span>
                  <span className="font-display text-ink">{houseOf(letter).noun}</span>
                  <span className="ml-2 text-xs tracking-wide text-muted uppercase">
                    {inName ? "in the name" : "unlived"}
                  </span>
                </span>
              </button>
              <p className="mt-1 text-sm leading-relaxed text-ink/80">{bondCopy(house, letter, kind)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
