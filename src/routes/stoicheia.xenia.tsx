import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { PageShare } from "@/components/letterology/PageShare";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stoicheiaCardFile, stoicheiaXeniaPath, tweetXenia } from "@/lib/stoicheia/copy";
import { readXenia } from "@/lib/stoicheia/xenia";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { a?: string; b?: string };

export const Route = createFileRoute("/stoicheia/xenia")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Two names",
      description: "Guest and host. Shared planets, the same total, one entrance as the other’s return.",
      path: "/stoicheia/xenia",
      imagePath: "/og.jpg",
    }),
  component: XeniaPage,
});

function XeniaPage() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/xenia" });
  const [left, setLeft] = useState(a ?? "");
  const [right, setRight] = useState(b ?? "");
  const pair = a && b ? readXenia(a, b) : null;

  return (
    <StoicheiaFrame current="Two names">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">guest and host</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Two names</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Not a score. Two names under the god of guests. We ask if their vowels share a
          planet, if they weigh the same, if one first letter is the other’s last.
        </p>
        {pair ? (
          <PageShare
            path={stoicheiaXeniaPath(pair.a.raw, pair.b.raw)}
            caption={tweetXenia(pair)}
            imagePath={`/og/${stoicheiaCardFile("xenia", `${pair.a.raw}-${pair.b.raw}`)}`}
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
          <Label htmlFor="xen-a">Guest</Label>
          <Input id="xen-a" className="mt-2" value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="xen-b">Host</Label>
          <Input id="xen-b" className="mt-2" value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" className="h-12">
            Read these two names
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12"
            onClick={() => {
              setLeft(right);
              setRight(left);
              navigate({ search: { a: right.trim() || undefined, b: left.trim() || undefined } });
            }}
          >
            Swap guest and host
          </Button>
        </div>
      </form>
      {pair ? (
        <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.16em] text-primary uppercase">{pair.weather}</p>
          <h2 className="mt-2 font-display text-3xl text-ink">{pair.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink/90">{pair.copy}</p>
          <p className="mt-4 leading-relaxed text-ink/85">{pair.owe}</p>
          <p className="mt-2 leading-relaxed text-ink/80">{pair.hard}</p>
          <ul className="mt-5 space-y-2 text-sm text-ink/80">
            <li>{pair.sharedPlanet ? "Shared planet in the vowels." : "No shared planet."}</li>
            <li>{pair.isopsephic ? "The same total." : "Different totals."}</li>
            <li>{pair.crossedAxis ? "One first letter is the other’s last." : "The roads do not cross."}</li>
            <li>{pair.kinHit ? "Related letters meet." : "No official kin."}</li>
            <li>{pair.erisHit ? "A strife-pair is present." : "No official strife."}</li>
            <li>{pair.sharedOffice ? "They share public work." : "Different public work."}</li>
            <li>
              {pair.nightMeetsDay
                ? "One road starts in the night watch, the other in the day."
                : "Both roads start in the same watch."}
            </li>
          </ul>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Arrival</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{pair.arrival}</p>
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The table</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{pair.table}</p>
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Leaving</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{pair.leave}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-ink/80">
            Shared {pair.shared.join(" · ") || "none"}. Guest only {pair.onlyGuest.join(" · ") || "none"}.
            Host only {pair.onlyHost.join(" · ") || "none"}.
          </p>
          <p className="mt-6 font-display text-xl text-ink">
            {pair.a.spelled} · {pair.b.spelled}
          </p>
          <p className="mt-1 text-sm text-muted">
            {pair.a.road.title} · {pair.b.road.title}
          </p>
        </section>
      ) : null}
    </StoicheiaFrame>
  );
}
