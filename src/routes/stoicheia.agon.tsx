import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { PageShare } from "@/components/letterology/PageShare";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readAgon } from "@/lib/stoicheia/agon";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { a?: string; b?: string };

export const Route = createFileRoute("/stoicheia/agon")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Contest",
      description: "Two names, six prizes. Not a verdict. Hospitality is the other page.",
      path: "/stoicheia/agon",
      imagePath: "/og.jpg",
    }),
  component: AgonPage,
});

function AgonPage() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/agon" });
  const [left, setLeft] = useState(a ?? "");
  const [right, setRight] = useState(b ?? "");
  const contest = a && b ? readAgon(a, b) : null;

  return (
    <StoicheiaFrame current="Contest">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">two names, six prizes</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The contest</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Guest-friendship is the other door. This one is the stadium. We do not name a fate.
          We name who holds which prize, from the letters.
        </p>
        {contest ? (
          <PageShare
            path={`/stoicheia/agon?a=${encodeURIComponent(contest.a.raw)}&b=${encodeURIComponent(contest.b.raw)}`}
            caption={`${contest.title}\n${contest.prizes[0]?.line ?? ""}`}
            imagePath="/og.jpg"
          />
        ) : null}
      </header>

      <form
        className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          navigate({ search: { a: left.trim() || undefined, b: right.trim() || undefined } });
        }}
      >
        <div>
          <Label htmlFor="agon-a">First name</Label>
          <Input id="agon-a" className="mt-2" value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="agon-b">Second name</Label>
          <Input id="agon-b" className="mt-2" value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
        <Button type="submit" className="h-12 sm:col-span-2 sm:w-fit">
          Open the contest
        </Button>
      </form>

      {contest ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl text-ink">{contest.title}</h2>
          <p className="mt-2 text-sm text-muted">
            {contest.a.epithet} · {contest.b.epithet}
          </p>
          <ul className="mt-6 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)]">
            {contest.prizes.map((prize) => (
              <li key={prize.name} className="py-5">
                <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{prize.name}</p>
                <p className="mt-2 text-lg text-ink">{prize.line}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </StoicheiaFrame>
  );
}
