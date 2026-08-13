import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CourtLines } from "@/components/letterology/CourtLines";
import { HoroscopeView } from "@/components/letterology/HoroscopeView";
import { NameForm } from "@/components/letterology/NameForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { buildHoroscope } from "@/lib/letterology/engine";
import { almanacOf, monthName } from "@/lib/letterology/calendar";
import { houseOf } from "@/lib/letterology/archetypes";
import { themeOf } from "@/lib/letterology/lexicon";
import { PageShare } from "@/components/letterology/PageShare";
import { KeyLink, Plainly, TermStack } from "@/components/letterology/Gloss";
import { METHOD_PLAIN, gloss } from "@/lib/letterology/glossary";
import { loadRecent, saveRecent } from "@/lib/letterology/recent";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { name?: string };

const HOME_TITLE = "Letterology";
const HOME_DESCRIPTION =
  "Read a username through twenty-six houses. First letter sits the house. The next two set how and where you work.";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: "/",
      imagePath: "/og.jpg",
    }),
  component: Home,
});

function Home() {
  const { name } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [recent, setRecent] = useState<string[]>([]);
  const horoscope = useMemo(() => (name ? buildHoroscope(name) : null), [name]);
  const almanac = almanacOf();
  const daily = themeOf(almanac.dateLetter);
  const fortnightHouse = houseOf(almanac.fortnight.letter);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (!horoscope) return;
    saveRecent(horoscope.displayName);
    setRecent(loadRecent());
  }, [horoscope]);

  function readName(next: string) {
    navigate({ search: { name: next } });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="read" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!horoscope ? (
          <section className="mx-auto max-w-2xl">
            <div className="flex flex-col items-center text-center">
              <img
                src="/seal.jpg"
                alt="Letterology wax seal"
                width={112}
                height={112}
                className="size-24 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10 sm:size-28"
              />
              <p className="mt-6 font-display text-xs tracking-[0.28em] text-muted uppercase">
                The alphabet as twenty-six houses
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">
                Letterology
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/85">
                Type a username. The letters you chose sit a house — Seeker, Caregiver,
                Rebel, Hermit, and the rest. The two letters that weigh most after that
                set how you work and where you work. Allies complete the job. Enemies
                keep it honest. The handle is the destiny. This is a portrait, not a
                prediction.
              </p>
              <Plainly className="w-full max-w-xl text-left sm:text-center">{METHOD_PLAIN}</Plainly>
              <div className="mt-2">
                <KeyLink />
              </div>
              <PageShare
                path="/"
                caption={"Letterology\nRead a username through twenty-six houses."}
                imagePath="/og.jpg"
              />
            </div>
            <div className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <NameForm initial={name ?? ""} onSubmit={readName} />
              <p className="mt-5 text-center">
                <Link
                  to="/bond"
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  Or compare two handles
                </Link>
              </p>
            </div>
            {recent.length > 0 ? (
              <div className="mt-6">
                <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Recent readings</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recent.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => readName(item)}
                      className="h-9 rounded-full bg-raised px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <aside className="mt-12 border-t border-ink/10 pt-8">
              <div className="text-center">
                <TermStack id="wheel" term="Today on the wheel" className="mx-auto max-w-md" />
                <p className="mt-3 font-display text-3xl text-ink">
                  {almanac.dateLetter} — {daily.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Date {almanac.civil.day} {monthName(almanac.civil.month)} · year {almanac.yearLetter} ·{" "}
                  {almanac.fortnight.hinge ? "hinge" : `fortnight ${almanac.fortnight.letter}`}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {almanac.fortnight.hinge
                    ? `The Fool holds the leftover days between one walk and the next. ${gloss("hinge")}`
                    : `The sun is in the ${fortnightHouse.house}, day ${almanac.fortnight.dayInSeat} of 14 — ${gloss("fortnight")}`}{" "}
                  {daily.invitation}
                </p>
              </div>
              <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
                <HomeCourt label="Today" letter={almanac.dateLetter} />
                <HomeCourt
                  label={almanac.fortnight.hinge ? "Hinge" : "Fortnight"}
                  letter={almanac.fortnight.letter}
                  note={almanac.fortnight.hinge ? gloss("hinge") : gloss("fortnight")}
                />
                <div className="rounded-xl bg-raised p-4 text-left shadow-[var(--shadow-border)]">
                  <TermStack id="climate" term="Climate" />
                  <p className="mt-2 text-sm leading-relaxed text-ink/85">
                    Year {almanac.yearLetter} {houseOf(almanac.yearLetter).noun} · month {almanac.monthLetter}{" "}
                    {houseOf(almanac.monthLetter).noun}. Background only.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-center">
                <Link
                  to="/almanac"
                  search={{ date: almanac.iso }}
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  Open the almanac
                </Link>
              </p>
            </aside>
          </section>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
              <NameForm initial={horoscope.displayName} onSubmit={readName} compact />
            </div>
            <HoroscopeView key={horoscope.normalized} horoscope={horoscope} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function HomeCourt({ label, letter, note }: { label: string; letter: string; note?: string }) {
  return (
    <div className="rounded-xl bg-raised p-4 text-left shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      {note ? <p className="mt-1 text-sm leading-snug text-muted">{note}</p> : null}
      <p className="mt-1 font-display text-xl text-ink">
        {letter} · {houseOf(letter).noun}
      </p>
      <CourtLines letter={letter} />
    </div>
  );
}
