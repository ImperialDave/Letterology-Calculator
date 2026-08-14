import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { CountTables, CountView } from "@/components/letterology/CountView";
import { PageShare } from "@/components/letterology/PageShare";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHouseHoroscope } from "@/lib/firebase/house-provider";
import { houseOf } from "@/lib/letterology/archetypes";
import { countFileOf, countReadingOf } from "@/lib/letterology/count";
import { countPath, pageCardMeta, tweetCount } from "@/lib/letterology/share";

type Search = { n?: string };

export const Route = createFileRoute("/count")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  loader: ({ location }) => {
    const n = new URL(location.href, "https://www.letterology.club").searchParams.get("n") ?? undefined;
    return { n };
  },
  head: ({ loaderData }) => {
    const reading = countReadingOf(loaderData?.n ?? "");
    if (!reading) {
      return pageCardMeta({
        title: "The Count",
        description: "Numbers are unacceptable. A count sits letters — a seat, a court, a Letter Path.",
        path: "/count",
        imagePath: "/og.jpg",
      });
    }
    const house = houseOf(reading.seat);
    return pageCardMeta({
      title: `${reading.seat} · ${reading.display}`,
      description: `${house.house}. Spelled ${reading.spelling.join(" · ")}. Places ${reading.placePath.join(" · ")}.`,
      path: countPath(reading.digits),
      imagePath: `/og/${countFileOf(reading)}`,
    });
  },
  component: CountPage,
});

function CountPage() {
  const { n } = Route.useSearch();
  const navigate = useNavigate({ from: "/count" });
  const [value, setValue] = useState(n ?? "");
  const reading = countReadingOf(n ?? "");
  const sitting = useHouseHoroscope();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ search: { n: value.trim() || undefined } });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="count" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · The inverse</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The Count</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            Numbers are unacceptable. They must sit as letters. A count has a court of
            occupants and places, a seat on the wheel, the walks that got it there, and
            two Letter Paths — one from the spelling, one from the places. Zero is the
            Fool. We do not fold.
          </p>
          <PageShare
            path={reading ? countPath(n ?? reading.digits) : "/count"}
            caption={
              reading
                ? tweetCount(reading.seat, houseOf(reading.seat).house, reading.display)
                : "The Count\nA number sits letters."
            }
            imagePath={reading ? `/og/${countFileOf(reading)}` : "/og.jpg"}
          />
        </header>

        <form onSubmit={onSubmit} className="mt-8 max-w-xl">
          <Label htmlFor="count-n">Bring a count</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="count-n"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="the untranslated figure"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" className="h-12 shrink-0">
              Render as letters
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Type the figure only so we can translate it. The reading will not speak it back.
          </p>
        </form>

        {n && !reading ? <p className="mt-8 text-sm text-primary">That has no digits to sit.</p> : null}

        {reading ? (
          <div className="mt-10">
            <CountView reading={reading} signature={sitting?.signature} />
          </div>
        ) : (
          <CountTables />
        )}

        <p className="mt-10 text-center">
          <Link
            to="/key"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Open the Key
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
