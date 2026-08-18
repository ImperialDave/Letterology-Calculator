import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { CourtLines } from "@/components/letterology/CourtLines";
import { LuckPanel } from "@/components/letterology/LuckPanel";
import { Explain } from "@/components/letterology/Gloss";
import { Button } from "@/components/ui/button";
import { houseOf } from "@/lib/letterology/archetypes";
import { dayReadingOf } from "@/lib/letterology/day-reading";
import { luckOf } from "@/lib/letterology/luck";
import { copyToClipboard } from "@/lib/letterology/clipboard";
import { WEATHER_COPY } from "@/lib/letterology/glossary";
import { themeOf } from "@/lib/letterology/lexicon";
import { composeXPost, portraitUrl, publicSiteOrigin, tweetDay } from "@/lib/letterology/share";
import type { CivilDate } from "@/lib/letterology/calendar";
import type { Horoscope } from "@/lib/letterology/types";

export function DayCard({
  horoscope,
  date,
}: {
  horoscope: Horoscope;
  date?: Date | CivilDate;
}) {
  const [copied, setCopied] = useState(false);
  const reading = dayReadingOf(horoscope, date);
  const luck = luckOf(horoscope, date);
  if (!reading) return null;
  const todayHouse = houseOf(reading.day.date);
  const weather = WEATHER_COPY[reading.weather] ?? {
    label: reading.weather,
    gloss: "",
  };
  const post = composeXPost(
    tweetDay(reading.headline, reading.invitation),
    portraitUrl(horoscope.displayName, publicSiteOrigin()),
  );

  async function copyDay() {
    if (await copyToClipboard(post.text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            Today for {horoscope.displayName}
          </p>
          <p className="mt-2 font-display text-xs tracking-[0.16em] text-primary uppercase">
            {weather.label}
          </p>
          {weather.gloss ? <p className="mt-1 text-sm text-muted">{weather.gloss}</p> : null}
          <h3 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{reading.headline}</h3>
        </div>
        <p className="font-display text-5xl leading-none text-primary">{reading.day.date}</p>
      </div>

      <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{reading.dayJob}</p>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{reading.meeting}</p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80">{reading.manner}</p>

      <div className="mt-6 border-t border-ink/10 pt-6">
        <LuckPanel luck={luck} />
      </div>

      <p className="mt-5 font-display text-sm text-ink">{reading.invitation}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <DaySeat
          label="Date"
          letter={reading.day.date}
          note={todayHouse.noun}
          hint="Today’s date names a role."
        />
        <DaySeat
          label={reading.day.hinge ? "Hinge" : "Fortnight"}
          letter={reading.day.fortnight}
          note={houseOf(reading.day.fortnight).adj}
          hint={
            reading.day.hinge
              ? "Leftover days between years. No numbered role."
              : "The two-week stretch the year is in right now."
          }
        />
        <DaySeat
          label="Weekday"
          letter={reading.day.weekday}
          note={`${reading.day.weekdayRole} · ${houseOf(reading.day.weekday).noun}`}
          hint="What today’s work is about — house, ally, or enemy of your first letter."
        />
      </div>

      <div className="mt-5">
        <Explain title="Background">
          Year and month only color the background. They do not rename the day. Do the
          date’s job. Do not let the year steal the headline.
        </Explain>
        <p className="mt-2 text-sm text-muted">{reading.climateNote}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={copyDay}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied for X" : "Copy day for X"}
        </Button>
        <Link
          to="/almanac"
          search={{ date: reading.iso, name: horoscope.displayName }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Open this day in the almanac
        </Link>
      </div>
    </section>
  );
}

function DaySeat({
  label,
  letter,
  note,
  hint,
}: {
  label: string;
  letter: string;
  note: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      {hint ? <p className="mt-1 text-sm leading-snug text-muted">{hint}</p> : null}
      <p className="mt-1 font-display text-xl text-ink">
        {letter} — {themeOf(letter).name}
      </p>
      <p className="text-sm text-muted">{note}</p>
      <CourtLines letter={letter} />
    </div>
  );
}
