import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { BondForm } from "@/components/letterology/BondForm";
import { CourtLines } from "@/components/letterology/CourtLines";
import { DayCard } from "@/components/letterology/DayCard";
import { Explain } from "@/components/letterology/Gloss";
import { HoroscopeView } from "@/components/letterology/HoroscopeView";
import { NameForm } from "@/components/letterology/NameForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PageShare } from "@/components/letterology/PageShare";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useHouseHoroscope } from "@/lib/firebase/house-provider";
import { houseOf } from "@/lib/letterology/archetypes";
import { almanacOf, monthName } from "@/lib/letterology/calendar";
import { buildHoroscope } from "@/lib/letterology/engine";
import { themeOf } from "@/lib/letterology/lexicon";
import { loadRecent, saveRecent } from "@/lib/letterology/recent";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { name?: string };

const HOME_TITLE = "CC33 · Letterology";
const HOME_DESCRIPTION =
  "CC33. Read a username through twenty-six houses — or compare two and get a certificate you can post.";

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
  const sittingUser = useCurrentUser();
  const sitting = useHouseHoroscope();
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

  function readBond(a: string, b: string) {
    navigate({ to: "/bond", search: { a, b } });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="read" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!horoscope && sitting && sittingUser?.handle ? (
          <div className="space-y-8">
            <header>
              <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · Your house</p>
              <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                {sittingUser.displayHandle}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Today first. Then the Letter Path. Compare when you want another username in the room.
              </p>
            </header>
            <DayCard horoscope={sitting} />
            <ArchetypeCard archetype={sitting.archetype} featured />
            <section className="rounded-xl bg-primary p-5 text-primary-fg shadow-[var(--shadow-border)] sm:p-7">
              <p className="font-display text-xs tracking-[0.2em] uppercase opacity-80">Compare me</p>
              <h2 className="mt-2 font-display text-3xl">Certificate of Bond</h2>
              <div className="mt-6 rounded-lg bg-raised p-4 text-ink sm:p-5">
                <BondForm initialA={sittingUser.displayHandle ?? ""} onSubmit={readBond} />
              </div>
            </section>
            <p>
              <Link
                to="/house"
                className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
              >
                Open the rest of the house
              </Link>
            </p>
          </div>
        ) : !horoscope ? (
          <div>
            <section className="mx-auto max-w-2xl text-center">
              <img
                src="/seal.jpg"
                alt="Letterology wax seal"
                width={112}
                height={112}
                className="mx-auto size-24 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10 sm:size-28"
              />
              <p className="mt-6 font-display text-xs tracking-[0.28em] text-muted uppercase">
                CC33 · The alphabet as twenty-six houses
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">
                Letterology
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink/85">
                {VOICE.homeHero}
              </p>
              <PageShare
                path="/"
                caption={"CC33 · Letterology\nRead a username — or compare two."}
                imagePath="/og.jpg"
              />
            </section>

            <section className="mt-10 grid gap-4 lg:grid-cols-2 lg:items-stretch">
              <article className="rounded-xl bg-primary p-5 text-primary-fg shadow-[var(--shadow-border)] sm:p-7">
                <p className="font-display text-xs tracking-[0.2em] uppercase opacity-80">
                  Two usernames
                </p>
                <h2 className="mt-2 font-display text-3xl">Are you compatible?</h2>
                <p className="mt-2 text-sm leading-relaxed text-primary-fg/85">{VOICE.homeBondLede}</p>
                <div className="mt-6 rounded-lg bg-raised p-4 text-ink sm:p-5">
                  <BondForm onSubmit={readBond} />
                </div>
              </article>

              <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
                <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">
                  One username
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">{VOICE.homeReadTitle}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{VOICE.homeReadLede}</p>
                <div className="mt-6">
                  <NameForm initial={name ?? ""} onSubmit={readName} />
                </div>
                {recent.length > 0 ? (
                  <div className="mt-6">
                    <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
                      Recent readings
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recent.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => readName(item)}
                          className="h-9 rounded-full bg-bg px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </section>

            <article className="mt-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">The inverse</p>
              <h2 className="mt-2 font-display text-3xl text-ink">The Count</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {VOICE.homeCountLede}
              </p>
              <p className="mt-4">
                <Link
                  to="/count"
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  {VOICE.homeCountCta}
                </Link>
              </p>
            </article>

            <article className="mt-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">The other tongue</p>
              <h2 className="mt-2 font-display text-3xl text-ink">Stoicheia</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                A second reading, from the Greek alphabet. Twenty-four letters. First and last,
                the vowels in order, the consonants as public work, and the ancient number-as-letter.
              </p>
              <p className="mt-4">
                <Link
                  to="/stoicheia"
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  Open the Greek reading
                </Link>
              </p>
            </article>

            <aside className="mt-12 border-t border-ink/10 pt-8">
              <div className="text-center">
                <Explain title="Today on the wheel" className="mx-auto max-w-md">
                  The year walks twenty-six two-week seats, one letter at a time. Today’s
                  date names a role. The current fortnight says how the season is working.
                </Explain>
                <p className="mt-3 font-display text-3xl text-ink">
                  {almanac.dateLetter} — {daily.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {almanac.civil.day} {monthName(almanac.civil.month)} · the year is{" "}
                  {almanac.yearLetter}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {almanac.fortnight.hinge
                    ? "These leftover days fall between one year and the next. There is no numbered role."
                    : `The two-week stretch is the ${fortnightHouse.house} (day ${almanac.fortnight.dayInSeat} of 14).`}{" "}
                  {daily.invitation}
                </p>
              </div>
              <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
                <HomeCourt
                  label="Today"
                  note="The date’s letter — the role today names."
                  letter={almanac.dateLetter}
                />
                <HomeCourt
                  label={almanac.fortnight.hinge ? "Hinge" : "Fortnight"}
                  note={
                    almanac.fortnight.hinge
                      ? "Leftover days between year-walks. No numbered house."
                      : "The current two-week seat of the year."
                  }
                  letter={almanac.fortnight.letter}
                />
                <div className="rounded-xl bg-raised p-4 text-left shadow-[var(--shadow-border)]">
                  <Explain title="Climate">
                    Year and month only color the background. They do not rename the day.
                  </Explain>
                  <p className="mt-2 text-sm leading-relaxed text-ink/85">
                    Year {almanac.yearLetter} {houseOf(almanac.yearLetter).noun} · month{" "}
                    {almanac.monthLetter} {houseOf(almanac.monthLetter).noun}.
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
          </div>
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
