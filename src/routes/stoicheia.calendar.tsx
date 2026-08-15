import { createFileRoute } from "@tanstack/react-router";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { atticOf } from "@/lib/stoicheia/calendar";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/stoicheia/calendar")({
  head: () =>
    pageCardMeta({
      title: "The Attic day",
      description: "Sunset first. Lunar months. Noumenia and the old-and-new sit Hekate.",
      path: "/stoicheia/calendar",
      imagePath: "/og.jpg",
    }),
  component: CalendarPage,
});

function CalendarPage() {
  const day = atticOf();
  return (
    <StoicheiaFrame current="Calendar">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">Attic time</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The year we did not steal</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Letterology walks twenty-six fortnights from the twenty-first of March. Greece
          does not owe that date. The civic day begins at sunset. The year begins at the
          first new moon after midsummer. The leftovers are Noumenia and the old-and-new
          — Hekate’s hours, not the Latin Fool’s hinge.
        </p>
      </header>
      <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">This hour</p>
        <p className="mt-2 font-display text-4xl text-ink">
          {day.hora.letter} · {day.hora.noun}
        </p>
        <p className="mt-1 text-sm text-muted">
          {day.hora.watch} watch · {day.hora.greek}
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/90">{day.hora.myth}</p>
        <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">This month</p>
        <p className="mt-2 font-display text-2xl text-ink">
          {day.monthName} · {day.monthLetter}
        </p>
        <p className="mt-2 text-sm text-ink/80">
          {day.noumenia
            ? "Noumenia — the new moon. Hekate keeps the leftovers."
            : day.heneKaiNea
              ? "Hene kai Nea — the old and the new. Hekate again."
              : `Day ${day.dateSpell} of the month sits ${day.dateSeat}.`}
        </p>
      </section>
    </StoicheiaFrame>
  );
}
