import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { ArchetypeList } from "@/components/letterology/ArchetypeList";
import { DayCard } from "@/components/letterology/DayCard";
import { KeyLink, TermStack } from "@/components/letterology/Gloss";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { LetterMap } from "@/components/letterology/LetterMap";
import { ShareBar } from "@/components/letterology/ShareBar";
import { Button } from "@/components/ui/button";
import { houseOf } from "@/lib/letterology/archetypes";
import type { CivilDate } from "@/lib/letterology/calendar";
import { bondCopy } from "@/lib/letterology/circle";
import { copyToClipboard } from "@/lib/letterology/clipboard";
import { gloss } from "@/lib/letterology/glossary";
import { composeXPost, portraitUrl, publicSiteOrigin, tweetReading } from "@/lib/letterology/share";
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

export function HoroscopeView({
  horoscope,
  date,
}: {
  horoscope: Horoscope;
  date?: Date | CivilDate;
}) {
  const [selected, setSelected] = useState<Letter>(horoscope.signature);
  const [copied, setCopied] = useState(false);
  const theme = themeOf(selected);
  const text = useMemo(
    () =>
      composeXPost(
        tweetReading(horoscope),
        portraitUrl(horoscope.displayName, publicSiteOrigin()),
      ).text,
    [horoscope],
  );

  async function copyReading() {
    if (await copyToClipboard(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
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
            <p className="mt-1 text-sm text-muted">{gloss("horoscope")}</p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">
              {horoscope.displayName}
            </h2>
            <p className="mt-1 text-sm tracking-wide text-muted">{horoscope.normalized}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {horoscope.statements.method}
            </p>
            <div className="mt-1">
              <KeyLink />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 self-start sm:self-auto">
          <Button variant="outline" onClick={copyReading}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy reading"}
          </Button>
          <Link
            to="/bond"
            search={{ a: horoscope.displayName }}
            className="inline-flex h-11 items-center justify-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Compare this handle
          </Link>
        </div>
      </header>

      <DayCard horoscope={horoscope} date={date} />

      <ShareBar horoscope={horoscope} />

      <ArchetypeCard archetype={horoscope.archetype} featured />

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <TermStack id="wheel" term="On the wheel" />
          <Link
            to="/circle"
            search={{ house: horoscope.signature }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Open the circle
          </Link>
        </div>
        <h3 className="mt-3 font-display text-2xl text-ink">{horoscope.archetype.house}</h3>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{horoscope.statements.wheel}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <WheelColumn
            title="Allies"
            glossId="allies"
            house={horoscope.signature}
            letters={horoscope.allies}
            present={horoscope.kinPresent}
            kind="ally"
            onSelect={setSelected}
          />
          <WheelColumn
            title="Enemies"
            glossId="enemies"
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
        caption="Same manner and field, sitting in an allied house"
        note={gloss("kindred")}
      />

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Primary theme</p>
        <p className="mt-1 text-sm text-muted">
          The letter that weighs most in this name — often the first letter, sometimes another if
          it repeats.
        </p>
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
            {horoscope.tension ? "Main tension" : "Growth edge"}
          </p>
          {horoscope.tension ? (
            <h3 className="mt-2 font-display text-xl text-ink">{horoscope.tension.title}</h3>
          ) : null}
          <p className="mt-3 leading-relaxed text-ink/90">{horoscope.statements.challenge}</p>
        </article>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">In short</p>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed">{horoscope.statements.synthesis}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <TermStack id="vowels" />
          <p className="mt-3 text-sm leading-relaxed">{horoscope.statements.vowelNote}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <TermStack id="consonants" />
          <p className="mt-3 text-sm leading-relaxed">{horoscope.statements.consonantNote}</p>
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
            <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Letter map</p>
            <p className="mt-1 text-sm text-muted">
              The path follows the name. Darker cells carry more weight — they appear more, or sit
              first or last. Gold rings are allies. Dark rings are enemies.
            </p>
          </div>
          <p className="text-sm text-muted">
            Letters not in the name{" "}
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
        This is a portrait, not a prediction.
        {theme ? ` ${theme.name} is one letter among twenty-six.` : ""}
      </p>
    </div>
  );
}

function WheelColumn({
  title,
  glossId,
  house,
  letters,
  present,
  kind,
  onSelect,
}: {
  title: string;
  glossId: string;
  house: Letter;
  letters: Letter[];
  present: Letter[];
  kind: "ally" | "enemy";
  onSelect: (letter: Letter) => void;
}) {
  return (
    <div>
      <TermStack id={glossId} term={title} />
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
                    {inName ? "in the name" : "not in the name"}
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
