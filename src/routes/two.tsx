import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { BondView } from "@/components/letterology/BondView";
import { PageShare } from "@/components/letterology/PageShare";
import { TongueStage } from "@/components/letterology/TongueStage";
import { AppShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compareNames } from "@/lib/letterology/compatibility";
import {
  bondCardFile,
  bondDescription,
  bondPath,
  bondTitle,
  pageCardMeta,
} from "@/lib/letterology/share";
import { notePair, parseTongue } from "@/lib/letterology/tongue";
import { readAgon } from "@/lib/stoicheia/agon";
import { stoicheiaCardFile, stoicheiaXeniaPath, tweetXenia } from "@/lib/stoicheia/copy";
import { readXenia } from "@/lib/stoicheia/xenia";

type Search = { a?: string; b?: string; tongue?: "el"; mode?: "agon" };

export const Route = createFileRoute("/two")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
    tongue: search.tongue === "el" ? "el" : undefined,
    mode: search.mode === "agon" ? "agon" : undefined,
  }),
  loader: ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    return {
      a: params.get("a") ?? undefined,
      b: params.get("b") ?? undefined,
      tongue: params.get("tongue") === "el" ? ("el" as const) : undefined,
      mode: params.get("mode") === "agon" ? ("agon" as const) : undefined,
    };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.a;
    const b = loaderData?.b;
    if (a && b && loaderData?.tongue !== "el") {
      const bond = compareNames(a, b);
      if (bond) {
        return pageCardMeta({
          title: bondTitle(bond.a.displayName, bond.b.displayName, bond.title),
          description: bondDescription(bond.title, bond.plainly),
          path: bondPath(bond.a.displayName, bond.b.displayName),
          imagePath: `/og/${bondCardFile(bond.a.displayName, bond.b.displayName)}`,
        });
      }
    }
    return pageCardMeta({
      title: loaderData?.mode === "agon" ? "Contest" : "Two usernames",
      description: "Two usernames. A certificate, a table, or a contest.",
      path: "/two",
      imagePath: "/og.jpg",
    });
  },
  component: TwoPage,
});

function TwoPage() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/two" });
  const a = loaded.a ?? search.a;
  const b = loaded.b ?? search.b;
  const tongue = parseTongue(loaded.tongue ?? search.tongue);
  const mode = loaded.mode ?? search.mode;
  const [left, setLeft] = useState(a ?? "");
  const [right, setRight] = useState(b ?? "");

  const latin = a && b ? compareNames(a, b) : null;
  const table = a && b ? readXenia(a, b) : null;
  const stadium = a && b ? readAgon(a, b) : null;

  useEffect(() => {
    notePair(left, right);
  }, [left, right]);

  useEffect(() => {
    if (a) setLeft(a);
    if (b) setRight(b);
  }, [a, b]);

  function go(nextA: string, nextB: string, nextMode?: "agon") {
    navigate({
      search: {
        a: nextA.trim() || undefined,
        b: nextB.trim() || undefined,
        tongue: tongue === "el" ? "el" : undefined,
        mode: tongue === "el" ? nextMode ?? mode : undefined,
      },
    });
  }

  return (
    <AppShell current="two">
      <header className="text-center">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">
          {tongue === "el" ? (mode === "agon" ? "Contest" : "Two names") : "Two usernames"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {tongue === "el"
            ? mode === "agon"
              ? "The stadium. Six prizes from the letters."
              : "Guest and host. A duty, not a score."
            : "One certificate for this pair."}
        </p>
        {tongue === "el" ? (
          <div className="mt-4 inline-flex rounded-full bg-raised p-1 shadow-[var(--shadow-border)]">
            <button
              type="button"
              className={`h-9 rounded-full px-4 font-display text-xs tracking-[0.14em] uppercase ${mode === "agon" ? "text-muted" : "bg-primary text-primary-fg"}`}
              onClick={() => go(left, right)}
            >
              Table
            </button>
            <button
              type="button"
              className={`h-9 rounded-full px-4 font-display text-xs tracking-[0.14em] uppercase ${mode === "agon" ? "bg-primary text-primary-fg" : "text-muted"}`}
              onClick={() => go(left, right, "agon")}
            >
              Stadium
            </button>
          </div>
        ) : null}
      </header>

      <form
        className="mt-8 grid gap-4 sm:grid-cols-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          go(left, right, mode);
        }}
      >
        <div>
          <Label htmlFor="two-a">{tongue === "el" && mode === "agon" ? "First" : tongue === "el" ? "Guest" : "First username"}</Label>
          <Input id="two-a" className="mt-2" value={left} onChange={(event) => setLeft(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="two-b">{tongue === "el" && mode === "agon" ? "Second" : tongue === "el" ? "Host" : "Second username"}</Label>
          <Input id="two-b" className="mt-2" value={right} onChange={(event) => setRight(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" className="h-12">
            Read these two
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12"
            onClick={() => {
              setLeft(right);
              setRight(left);
            }}
          >
            Swap
          </Button>
        </div>
      </form>

      {latin || table || stadium ? (
        <div className="mt-10">
          <TongueStage
            tongue={tongue}
            latin={latin ? <BondView bond={latin} /> : <p className="text-sm text-muted">Those two names have no Latin letters to compare.</p>}
            greek={
              stadium && mode === "agon" ? (
                <section>
                  <h2 className="font-display text-3xl text-ink">{stadium.title}</h2>
                  <ul className="mt-6 divide-y divide-ink/10">
                    {stadium.prizes.map((prize) => (
                      <li key={prize.name} className="py-4">
                        <p className="font-display text-lg text-ink">{prize.name}</p>
                        <p className="text-sm text-ink/80">{prize.line}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : table ? (
                <section>
                  <PageShare
                    path={stoicheiaXeniaPath(table.a.raw, table.b.raw)}
                    caption={tweetXenia(table)}
                    imagePath={`/og/${stoicheiaCardFile("xenia", `${table.a.raw}-${table.b.raw}`)}`}
                  />
                  <p className="mt-4 font-display text-xs tracking-[0.16em] text-primary uppercase">{table.weather}</p>
                  <h2 className="mt-2 font-display text-3xl text-ink">{table.title}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-ink/90">{table.owe}</p>
                  <p className="mt-6 text-sm text-muted">
                    {table.a.spelled} · {table.b.spelled}
                  </p>
                </section>
              ) : (
                <p className="text-sm text-muted">Those two names have no Greek letters to fold.</p>
              )
            }
          />
        </div>
      ) : null}
    </AppShell>
  );
}
