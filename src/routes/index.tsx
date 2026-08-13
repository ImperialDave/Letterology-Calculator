import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HoroscopeView } from "@/components/letterology/HoroscopeView";
import { NameForm } from "@/components/letterology/NameForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { buildHoroscope } from "@/lib/letterology/engine";
import { themeOf } from "@/lib/letterology/lexicon";
import { ALPHABET } from "@/lib/letterology/types";

type Search = { name?: string };

const RECENT_KEY = "letterology:recent";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecent(name: string) {
  if (typeof window === "undefined") return;
  const next = [name, ...loadRecent().filter((item) => item.toLowerCase() !== name.toLowerCase())].slice(0, 8);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function siteDailyLetter() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86400000);
  return ALPHABET[day % 26] ?? "L";
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: Home,
});

function Home() {
  const { name } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [recent, setRecent] = useState<string[]>([]);
  const horoscope = useMemo(() => (name ? buildHoroscope(name) : null), [name]);
  const daily = themeOf(siteDailyLetter());

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
                A living map of the alphabet
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">
                Letterology
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/85">
                Every letter is a condensed field of meaning. A name is a personal
                constellation of those fields — not a prediction, a portrait. The first
                letter names the house; the two most common letters complete an archetype.
              </p>
            </div>
            <div className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <NameForm initial={name ?? ""} onSubmit={readName} />
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
            <aside className="mt-12 border-t border-ink/10 pt-8 text-center">
              <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Letter of the day</p>
              <p className="mt-2 font-display text-3xl text-ink">
                {daily.letter} — {daily.name}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{daily.invitation}</p>
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
