import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTIC_MONTHS, atticOf } from "@/lib/stoicheia/calendar";
import { festivalOf } from "@/lib/stoicheia/festival";
import { stoichAt } from "@/lib/stoicheia/letters";
import { horaOf } from "@/lib/stoicheia/horae";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { at?: string };

export const Route = createFileRoute("/stoicheia/calendar")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    at: typeof search.at === "string" ? search.at : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "The Attic day",
      description: "Sunset first. Lunar months. New-moon and last-day leftovers sit with Hekate.",
      path: "/stoicheia/calendar",
      imagePath: "/og.jpg",
    }),
  component: CalendarPage,
});

function parseWhen(at?: string): Date {
  if (!at) return new Date();
  const parsed = new Date(at);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function CalendarPage() {
  const { at } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/calendar" });
  const when = parseWhen(at);
  const day = atticOf(when);
  const [value, setValue] = useState(at ?? "");

  return (
    <StoicheiaFrame current="Day">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">Attic time</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The day</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          The civic day begins at sunset. The year begins at the first new moon after
          midsummer. Leftovers are the new-moon day and the last day of the month — Hekate’s
          hours, not the Latin leftover. The moon math is a mean month: good enough to sit a
          reading, not to launch a ship.
        </p>
      </header>

      <form
        className="mt-8 max-w-xl"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          navigate({ search: { at: value.trim() || undefined } });
        }}
      >
        <Label htmlFor="attic-at">A civil date and time</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="attic-at"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit" className="h-12 shrink-0">
            Read this hour
          </Button>
        </div>
      </form>

      <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">This hour</p>
        <p className="mt-2 font-display text-4xl text-ink">
          {day.hora.letter} · {day.hora.noun}
        </p>
        <p className="mt-1 text-sm text-muted">
          {day.hora.watch === "night" ? "night" : "day"} watch · {day.hora.greek}
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/90">{day.hora.myth}</p>
        <p className="mt-2 text-sm text-ink/75">{day.hora.invitation}</p>
        <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">This month</p>
        <p className="mt-2 font-display text-2xl text-ink">
          {day.monthName} · {day.monthLetter}
        </p>
        <p className="mt-2 text-sm text-ink/85">
          {festivalOf(day.monthName).name} — {festivalOf(day.monthName).line}.
        </p>
        <p className="mt-2 text-sm text-ink/80">
          {day.noumenia
            ? "New-moon day. Hekate keeps the leftovers."
            : day.heneKaiNea
              ? "Last day of the month — the old and the new. Hekate again."
              : `Day ${day.dateSpell} of the month sits ${day.dateSeat}.`}
        </p>
        <p className="mt-4 text-sm text-ink/80">
          Year mark {day.yearMark} · {horaOf(day.yearMark).noun}. Background only — it does not
          rename the hour.
        </p>
      </section>

      <section className="mt-8">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The twelve months</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ATTIC_MONTHS.map((name, index) => {
            const letter = stoichAt(index);
            const active = index === day.monthIndex;
            return (
              <li
                key={name}
                className={
                  active
                    ? "rounded-xl bg-primary px-4 py-3 text-primary-fg"
                    : "rounded-xl bg-raised px-4 py-3 shadow-[var(--shadow-border)]"
                }
              >
                <p className="font-display text-lg">
                  {letter} · {name}
                </p>
                <p className={`text-sm ${active ? "opacity-80" : "text-muted"}`}>
                  {festivalOf(name).name}
                  {active ? " · this month" : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </StoicheiaFrame>
  );
}
