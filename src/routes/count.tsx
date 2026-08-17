import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { CountAbacus } from "@/components/letterology/CountAbacus";
import { PageShare } from "@/components/letterology/PageShare";
import { AppShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  countReadingOf,
  parseWalk,
  walkOf,
  walkSlug,
  type CountWalk,
} from "@/lib/letterology/count";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

export const Route = createFileRoute("/count")({
  loader: ({ location }) => {
    const n = new URL(location.href, "https://www.letterology.club").searchParams.get("n") ?? undefined;
    return { n };
  },
  head: () =>
    pageCardMeta({
      title: "The Count",
      description: VOICE.countLede,
      path: "/count",
      imagePath: "/og.jpg",
    }),
  component: CountPage,
});

function openWalk(slug: string) {
  window.location.assign(`/count/${slug}`);
}

function CountPage() {
  const [value, setValue] = useState("");
  const [walk, setWalk] = useState<CountWalk>(walkOf(0n));
  const { n } = Route.useLoaderData();
  const confessed = n ? countReadingOf(n) : null;

  useEffect(() => {
    if (!confessed) return;
    openWalk(confessed.slug);
  }, [n]);

  function go(next: CountWalk) {
    const slug = walkSlug(next);
    if (slug === "fool") {
      setWalk(next);
      return;
    }
    openWalk(slug);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const asLetters = parseWalk(trimmed);
    if (asLetters && !/\d/.test(trimmed)) {
      go(asLetters);
      return;
    }
    const reading = countReadingOf(trimmed);
    if (!reading) return;
    openWalk(reading.slug);
  }

  return (
    <AppShell current="count" wide>
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl text-ink sm:text-5xl">The Count</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">{VOICE.countLede}</p>
          <PageShare
            path="/count"
            caption={"The Count\nWe write amounts as letters."}
            imagePath="/og.jpg"
          />
        </header>

        <div className="mt-8">
          <CountAbacus walk={walk} onChange={go} />
        </div>

        <form onSubmit={onSubmit} className="mt-8 max-w-xl">
          <Label htmlFor="count-n">{VOICE.countConfessLabel}</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="count-n"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="only so we can translate it"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" className="h-12 shrink-0">
              {VOICE.countConfessButton}
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Type the old number once. Or type letters — Z, AA, BYX. The reading will not say a
            digit back.
          </p>
        </form>

        {n && !countReadingOf(n) ? (
          <p className="mt-8 text-sm text-primary">{VOICE.countEmpty}</p>
        ) : null}

        <p className="mt-10 text-center">
          <Link
            to="/why"
            search={{ tongue: undefined }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Why
          </Link>
        </p>
    </AppShell>
  );
}
