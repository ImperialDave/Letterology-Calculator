import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { Explain } from "@/components/letterology/Gloss";
import { PigmentPip } from "@/components/letterology/Pigment";
import { houseOf } from "@/lib/letterology/archetypes";
import {
  DIGITS,
  countMeeting,
  placeLetter,
  speakChain,
  spellDigit,
  type CountColumn,
  type CountReading,
} from "@/lib/letterology/count";
import { pigmentOf } from "@/lib/letterology/pigment";
import type { Letter } from "@/lib/letterology/types";

function LetterMark({ letter, size = "xl" }: { letter: Letter; size?: "xl" | "lg" }) {
  const pigment = pigmentOf(letter);
  return (
    <span
      className={size === "xl" ? "font-display text-6xl leading-none sm:text-7xl" : "font-display text-4xl leading-none"}
      style={{ color: pigment.css }}
    >
      {letter}
    </span>
  );
}

function Column({ col }: { col: CountColumn }) {
  return (
    <div className="min-w-[4.5rem] rounded-lg bg-bg px-3 py-3 text-center shadow-[var(--shadow-border)]">
      <p className="font-display text-[0.65rem] tracking-[0.16em] text-muted uppercase">
        {houseOf(col.place).noun}
      </p>
      <p className="mt-1 font-display text-xs text-subtle">{col.place}</p>
      <p className="mt-2 font-display text-4xl leading-none" style={{ color: pigmentOf(col.occupant).css }}>
        {col.occupant}
      </p>
      <p className="mt-1 text-[0.65rem] text-muted">{houseOf(col.occupant).noun}</p>
    </div>
  );
}

export function CountView({
  reading,
  signature,
}: {
  reading: CountReading;
  signature?: Letter;
}) {
  const seatHouse = houseOf(reading.seat);

  return (
    <div className="space-y-8">
      {reading.columns.length > 0 ? (
      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="How the old digits were written">
          Each old digit becomes a letter so we can undress the figure. The column is how
          large that place was in the old ten-system — ones are the Seeker, tens the
          Caregiver. This is a translation, not the count. After this, speak the walk.
        </Explain>
        <div className="mt-5 flex flex-wrap gap-2">
          {reading.columns.map((col, index) => (
            <Column key={`i-${index}-${col.place}`} col={col} />
          ))}
        </div>
        {reading.fractionColumns.length > 0 ? (
          <>
            <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">
              Below the unit — the far side of the wheel
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reading.fractionColumns.map((col, index) => (
                <Column key={`f-${index}-${col.place}`} col={col} />
              ))}
            </div>
          </>
        ) : null}
      </section>
      ) : null}

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="This amount’s role">
          The whole amount has one role — the same letter a date or a year uses, so a year
          and that year’s amount cannot disagree. We do not fold it into a single digit.
          If the amount walked the twenty-six more than once, those walks are letters too.
          That string is the count you can add with.
        </Explain>
        <div className="mt-4 flex items-end gap-4">
          <LetterMark letter={reading.seat} />
          <div>
            <p className="inline-flex items-center gap-2 font-display text-2xl text-ink">
              <PigmentPip letter={reading.seat} />
              {seatHouse.house}
            </p>
            <p className="mt-1 text-sm italic text-ink/70">{seatHouse.myth}</p>
            {reading.inverted ? (
              <p className="mt-2 text-sm text-muted">This count is inverted. The seat is the same.</p>
            ) : null}
          </div>
        </div>
        {reading.walk.chain.length > 1 ? (
          <div className="mt-5">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The walks</p>
            <p className="mt-2 font-display text-2xl tracking-[0.18em] text-ink">
              {reading.walk.chain.join(" · ")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{speakChain(reading.walk.chain)}</p>
          </div>
        ) : null}
        {signature ? (
          <p className="mt-4 text-sm leading-relaxed text-ink/85">{countMeeting(reading.seat, signature)}</p>
        ) : null}
      </section>

      <section>
        <Explain title="Letter Path of this amount">
          The letter-count, in order, can be read like a username. First letter is the role.
          The next two by weight are how and where. This is a portrait of the amount as
          letters — earned, because the walk is the name now.
        </Explain>
        <p className="mt-3 font-display text-xl tracking-[0.2em] text-ink">
          {(reading.walk.chain.length ? reading.walk.chain : ["F"]).join(" · ")}
        </p>
        <div className="mt-6">
          <ArchetypeCard archetype={reading.horoscope.archetype} />
        </div>
      </section>

      {reading.placeHoroscope ? (
        <section>
          <Explain title="Letter Path of the old columns">
            The columns themselves spell a second path — which old magnitudes this figure used.
          </Explain>
          <p className="mt-3 font-display text-xl tracking-[0.2em] text-ink">{reading.placePath.join(" · ")}</p>
          <div className="mt-6">
            <ArchetypeCard archetype={reading.placeHoroscope.archetype} />
          </div>
        </section>
      ) : null}

      {reading.seatHoroscope ? (
        <section>
          <Explain title="Letter Path of the role">
            The amount, named as a single letter, still has a path — a role working in its
            own way.
          </Explain>
          <div className="mt-6">
            <ArchetypeCard archetype={reading.seatHoroscope.archetype} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function CountTables() {
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The ten glyphs</p>
        <ul className="mt-4 divide-y divide-ink/10">
          {DIGITS.map((digit) => {
            const occupant = spellDigit(digit);
            return (
              <li key={digit} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-display text-2xl" style={{ color: pigmentOf(occupant).css }}>
                  {occupant}
                </span>
                <span className="text-sm text-ink/80">
                  {houseOf(occupant).noun}
                  {digit === "0" ? " — absence" : digit === "6" ? " — sixth house" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The places</p>
        <ul className="mt-4 divide-y divide-ink/10">
          {[3, 2, 1, 0, -1, -2].map((power) => {
            const letter = placeLetter(power);
            return (
              <li key={power} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-display text-2xl" style={{ color: pigmentOf(letter).css }}>
                  {letter}
                </span>
                <span className="text-sm text-ink/80">{houseOf(letter).house}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
