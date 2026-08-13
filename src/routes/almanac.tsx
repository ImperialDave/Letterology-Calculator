import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { houseOf } from "@/lib/letterology/archetypes";
import {
  addDays,
  almanacOf,
  calendarMethod,
  daysInMonth,
  fortnightDoctrine,
  isoOf,
  monthLetter,
  monthLetters,
  monthName,
  parseIso,
  toCivil,
  walkFortnights,
  weekSeats,
  yearDoctrine,
  yearLetter,
  type AlmanacDay,
  type CivilDate,
} from "@/lib/letterology/calendar";
import { themeOf } from "@/lib/letterology/lexicon";
import { cn } from "@/lib/utils";

type Search = { date?: string };

export const Route = createFileRoute("/almanac")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  component: AlmanacPage,
});

function AlmanacPage() {
  const { date: dateParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/almanac" });
  const today = toCivil(new Date());
  const selectedCivil = parseIso(dateParam) ?? today;
  const selected = almanacOf(selectedCivil);
  const todayIso = isoOf(today);
  const monthDays = daysInMonth(selectedCivil.year, selectedCivil.month);
  const leadingBlanks = monthDays[0]?.weekday ?? 0;
  const walkYear =
    selectedCivil.month > 2 || (selectedCivil.month === 2 && selectedCivil.day >= 21)
      ? selectedCivil.year
      : selectedCivil.year - 1;
  const fortnights = walkFortnights(walkYear);
  const yearSeat = yearLetter(selectedCivil.year);
  const monthSeat = monthLetter(selectedCivil.year, selectedCivil.month);
  const monthSeats = monthLetters(selectedCivil.year, selectedCivil.month);

  function openDay(civil: CivilDate) {
    navigate({ search: { date: isoOf(civil) } });
  }

  function shiftMonth(delta: number) {
    const nextMonth = selectedCivil.month + delta;
    const year = selectedCivil.year + Math.floor(nextMonth / 12);
    const month = ((nextMonth % 12) + 12) % 12;
    openDay({ year, month, day: 1 });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="almanac" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            The year on the wheel
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Almanac</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">{calendarMethod()}</p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <ClimateCard
            label="Civil year"
            letter={yearSeat}
            detail={String(selectedCivil.year)}
            copy={yearDoctrine(yearSeat)}
          />
          <ClimateCard
            label="This month"
            letter={monthSeat}
            detail={`${monthName(selectedCivil.month)} · ${monthSeats.join(" · ")}`}
            copy={`The mid-month sits in ${houseOf(monthSeat).house}. A Gregorian month usually spans two fortnights.`}
          />
          <ClimateCard
            label={selected.fortnight.hinge ? "Hinge" : "This fortnight"}
            letter={selected.fortnight.letter}
            detail={
              selected.fortnight.hinge
                ? "Fool's gate"
                : `Day ${selected.fortnight.dayInSeat} of 14`
            }
            copy={fortnightDoctrine(selected.fortnight)}
          />
        </section>

        <section className="mt-8 rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
            >
              Previous
            </button>
            <div className="text-center">
              <h2 className="font-display text-2xl text-ink">
                {monthName(selectedCivil.month)} {selectedCivil.year}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {houseOf(monthSeat).house}
              </p>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
            >
              Next
            </button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 text-center font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase sm:text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => (
              <div key={name} className="py-2">
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, index) => (
              <div key={`blank-${index}`} className="min-h-16 sm:min-h-20" />
            ))}
            {monthDays.map((day) => (
              <DayCell
                key={day.iso}
                day={day}
                selected={day.iso === selected.iso}
                today={day.iso === todayIso}
                onSelect={() => openDay(day.civil)}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            The large letter is the date. The small letter is the fortnight the sun is walking.
          </p>
        </section>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {selected.weekdayName} {selected.civil.day} {monthName(selected.civil.month)} {selected.civil.year}
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">{selected.archetype.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {selected.triad.join("")} · year {selected.yearLetter} · fortnight {selected.fortnight.letter} · date{" "}
            {selected.dateLetter}
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">
            The year sits as {houseOf(selected.yearLetter).noun}. The sun walks as{" "}
            {houseOf(selected.fortnight.letter).noun}
            {selected.fortnight.hinge ? " on the hinge" : ` (day ${selected.fortnight.dayInSeat} of the fortnight)`}.
            The date wears {houseOf(selected.dateLetter).noun}. {selected.weekdayName} is the{" "}
            {selected.weekdayRole} aspect of this fortnight — {houseOf(selected.weekdayLetter).noun} (
            {selected.weekdayLetter}).
          </p>
          <WeekAspects day={selected} />
        </section>

        <div className="mt-6">
          <ArchetypeCard archetype={selected.archetype} />
        </div>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            The walk of {walkYear}–{walkYear + 1}
          </p>
          <p className="mt-2 text-sm text-muted">
            Twenty-six fortnights from 21 March {walkYear}. N, the Healer, falls opposite the Seeker at mid-walk.
          </p>
          <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {fortnights.map((seat) => {
              const active = !selected.fortnight.hinge && seat.letter === selected.fortnight.letter;
              return (
                <li key={seat.letter}>
                  <button
                    type="button"
                    onClick={() => openDay(seat.start)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left",
                      active ? "bg-primary text-primary-fg" : "bg-bg text-ink",
                    )}
                  >
                    <span className="font-display text-xl">{seat.letter}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm">{houseOf(seat.letter).noun}</span>
                      <span className={cn("block text-xs", active ? "text-primary-fg/80" : "text-muted")}>
                        {seat.start.day} {monthName(seat.start.month).slice(0, 3)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="mt-8 text-center">
          <Link
            to="/circle"
            search={{ house: selected.fortnight.letter }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            See today's seat on the circle
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function ClimateCard({
  label,
  letter,
  detail,
  copy,
}: {
  label: string;
  letter: string;
  detail: string;
  copy: string;
}) {
  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{label}</p>
      <p className="mt-3 font-display text-5xl leading-none text-primary">{letter}</p>
      <h3 className="mt-2 font-display text-xl text-ink">{houseOf(letter).house}</h3>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{copy}</p>
      <p className="mt-2 text-xs tracking-wide text-muted">{themeOf(letter).name}</p>
    </article>
  );
}

function DayCell({
  day,
  selected,
  today,
  onSelect,
}: {
  day: AlmanacDay;
  selected: boolean;
  today: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${day.civil.day}, date ${day.dateLetter}, fortnight ${day.fortnight.letter}`}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center rounded-md px-1 py-2 sm:min-h-20",
        selected
          ? "bg-primary text-primary-fg"
          : today
            ? "bg-ink text-raised"
            : "bg-bg text-ink hover:shadow-[var(--shadow-border)]",
      )}
    >
      <span className={cn("text-[0.65rem] tabular-nums", selected || today ? "opacity-80" : "text-muted")}>
        {day.civil.day}
      </span>
      <span className="font-display text-lg leading-none sm:text-xl">{day.dateLetter}</span>
      <span className={cn("mt-1 font-display text-[0.65rem]", selected || today ? "opacity-80" : "text-primary")}>
        {day.fortnight.hinge ? "F" : day.fortnight.letter}
      </span>
    </button>
  );
}

function WeekAspects({ day }: { day: AlmanacDay }) {
  const seats = weekSeats(day.fortnight.letter);
  const roles = ["House", "Ally", "Ally", "Ally", "Enemy", "Enemy", "Enemy"];
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="mt-5 grid grid-cols-7 gap-1">
      {seats.map((letter, index) => {
        const active = index === day.weekday;
        return (
          <div
            key={`${letter}-${index}`}
            className={cn(
              "rounded-md px-1 py-2 text-center",
              active ? "bg-primary text-primary-fg" : "bg-bg",
            )}
          >
            <p className={cn("font-display text-[0.6rem] tracking-[0.12em] uppercase", active ? "opacity-80" : "text-muted")}>
              {names[index]}
            </p>
            <p className="font-display text-lg leading-none">{letter}</p>
            <p className={cn("mt-1 text-[0.6rem] uppercase", active ? "opacity-80" : "text-muted")}>
              {roles[index]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
