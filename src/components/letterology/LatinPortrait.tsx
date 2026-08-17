import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HouseCircle } from "@/components/letterology/HouseCircle";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { PageShare } from "@/components/letterology/PageShare";
import { Sheet } from "@/components/ui/sheet";
import { houseOf } from "@/lib/letterology/archetypes";
import { dayReadingOf } from "@/lib/letterology/day-reading";
import { themeOf } from "@/lib/letterology/lexicon";
import { pigmentOf } from "@/lib/letterology/pigment";
import { nameToSlug, portraitPath, tweetReading } from "@/lib/letterology/share";
import type { Horoscope, Letter } from "@/lib/letterology/types";
import { VOICE } from "@/lib/letterology/voice";

export function LatinPortrait({ horoscope }: { horoscope: Horoscope }) {
  const [letter, setLetter] = useState<Letter>(horoscope.signature);
  const [open, setOpen] = useState<"letter" | "day" | null>(null);
  const day = dayReadingOf(horoscope);
  const pigment = pigmentOf(horoscope.signature);
  const todayLine = day?.headline ?? "";

  return (
    <div className="space-y-10">
      <header
        className="rounded-xl px-5 py-10 text-center sm:px-8"
        style={{
          background: `color-mix(in oklab, ${pigment.css} 22%, var(--color-raised))`,
        }}
      >
        <p className="font-display text-8xl leading-none sm:text-9xl" style={{ color: pigment.css }}>
          {horoscope.signature}
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">{horoscope.displayName}</h1>
        <p className="mt-2 font-display text-xl text-ink/85">{horoscope.archetype.title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/75">
          {houseOf(horoscope.triad[0]).noun} · how: {themeOf(horoscope.triad[1]).name.toLowerCase()} ·
          where: {themeOf(horoscope.triad[2]).name.toLowerCase()}. {VOICE.pathCaption}
        </p>
        <button
          type="button"
          onClick={() => setOpen("day")}
          className="mt-4 text-sm text-muted hover:text-ink"
        >
          {todayLine}
        </button>
        <div className="mt-6 flex justify-center">
          <PageShare
            path={portraitPath(horoscope.displayName)}
            caption={tweetReading(horoscope)}
            imagePath={`/og/${nameToSlug(horoscope.displayName)}.jpg`}
          />
        </div>
      </header>

      <HouseCircle
        selected={letter}
        triad={horoscope.archetype.triad}
        onSelect={(next) => {
          setLetter(next);
          setOpen("letter");
        }}
      />

      <p className="text-center">
        <Link
          to="/two"
          search={{ a: horoscope.displayName, b: undefined, tongue: undefined, mode: undefined }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          {VOICE.anotherUsername}
        </Link>
      </p>

      <Sheet open={open === "letter"} onClose={() => setOpen(null)} title={letter}>
        <LetterDetail letter={letter} />
      </Sheet>
      <Sheet open={open === "day"} onClose={() => setOpen(null)} title="Today">
        <p className="font-display text-2xl text-ink">{day?.headline}</p>
        <p className="mt-3 leading-relaxed text-ink/90">{day?.meeting}</p>
        <p className="mt-4 font-display text-ink">{day?.invitation}</p>
      </Sheet>
    </div>
  );
}
