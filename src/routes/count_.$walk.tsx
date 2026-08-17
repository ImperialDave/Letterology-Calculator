import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CountAbacus } from "@/components/letterology/CountAbacus";
import { CountView } from "@/components/letterology/CountView";
import { PageShare } from "@/components/letterology/PageShare";
import { AppShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHouseHoroscope } from "@/lib/firebase/house-provider";
import { houseOf } from "@/lib/letterology/archetypes";
import {
  countFileOf,
  formatWalk,
  joinWalks,
  parseWalk,
  partWalks,
  readingFromSlug,
  walkSlug,
} from "@/lib/letterology/count";
import { useTongue } from "@/components/letterology/TongueProvider";
import { countPath, pageCardMeta, tweetCount } from "@/lib/letterology/share";

export const Route = createFileRoute("/count_/$walk")({
  validateSearch: (search: Record<string, unknown>) => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  loader: ({ params }) => ({
    reading: readingFromSlug(params.walk),
  }),
  head: ({ loaderData }) => {
    const reading = loaderData?.reading;
    if (!reading) {
      return pageCardMeta({
        title: "The Count",
        description: "We write amounts as letters.",
        path: "/count",
        imagePath: "/og.jpg",
      });
    }
    const house = houseOf(reading.seat);
    const walk = formatWalk(reading.walk) || "the blank";
    return pageCardMeta({
      title: `${reading.seat} · ${walk}`,
      description: `${house.house}. Written ${walk}.`,
      path: countPath(reading.slug),
      imagePath: `/og/${countFileOf(reading)}`,
    });
  },
  component: CountWalkPage,
});

function CountWalkPage() {
  const { reading } = Route.useLoaderData();
  const { tongue: urlTongue } = Route.useSearch();
  const tongue = useTongue(urlTongue);
  const sitting = useHouseHoroscope();
  const [other, setOther] = useState("");

  function go(slug: string) {
    const query = tongue === "el" ? "?tongue=el" : "";
    window.location.assign(`/count/${slug}${query}`);
  }

  function onJoin() {
    if (!reading) return;
    const parsed = parseWalk(other);
    if (!parsed) return;
    go(walkSlug(joinWalks(reading.walk, parsed)));
    setOther("");
  }

  function onPart() {
    if (!reading) return;
    const parsed = parseWalk(other);
    if (!parsed) return;
    const result = partWalks(reading.walk, parsed);
    go(walkSlug(result.walk, result.inverted));
    setOther("");
  }

  return (
    <AppShell current="count" wide>
        {!reading ? (
          <header className="max-w-xl">
            <h1 className="font-display text-4xl text-ink">That is not a letter-count</h1>
            <p className="mt-3 text-ink/85">Use A–Z only. The blank is written fool.</p>
            <p className="mt-6">
              <Link
                to="/count"
                search={{ n: undefined, tongue }}
                className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
              >
                Back to the Count
              </Link>
            </p>
          </header>
        ) : (
          <>
            <header className="max-w-2xl">
              <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · Letter-count</p>
              <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                {formatWalk(reading.walk) || "the blank"}
              </h1>
              <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
                {reading.inverted
                  ? "This amount is inverted — same role, the other direction."
                  : `This amount’s role is ${reading.seat}, the ${houseOf(reading.seat).noun}.`}
              </p>
              <PageShare
                path={countPath(reading.slug)}
                caption={tweetCount(
                  reading.seat,
                  houseOf(reading.seat).house,
                  formatWalk(reading.walk),
                )}
                imagePath={`/og/${countFileOf(reading)}`}
              />
            </header>

            <div className="mt-8">
              <CountAbacus walk={reading.walk} onChange={(next) => go(walkSlug(next, reading.inverted))} />
            </div>

            <form className="mt-8 max-w-xl rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
              <Label htmlFor="count-other">Add or subtract another letter-count</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="count-other"
                  value={other}
                  onChange={(event) => setOther(event.target.value)}
                  placeholder="Z or AA or B·Y·X"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="button" className="h-12 shrink-0" onClick={onJoin}>
                  Add
                </Button>
                <Button type="button" variant="outline" className="h-12 shrink-0" onClick={onPart}>
                  Subtract
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted">Letters only. Z + A becomes AA.</p>
            </form>

            <div className="mt-10">
              <CountView reading={reading} signature={sitting?.signature} />
            </div>
          </>
        )}
    </AppShell>
  );
}
