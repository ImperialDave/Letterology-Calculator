import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      title: "Xenia",
      description: "Two handles under Zeus Xenios. Guest-friendship is a duty, not a scoreboard.",
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
    <StoicheiaFrame current="Xenia">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">Ζεὺς Ξένιος</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Xenia</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Not a certificate. Not an affinity piled in the middle of the page. Two names
          sit under the god of guests. We ask if their hymns share a planet, if they
          weigh the same, if one entrance is the other’s return.
        </p>
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
        <Button type="submit" className="h-12 sm:col-span-2 sm:w-fit">
          Set the table
        </Button>
      </form>
      {pair ? (
        <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.16em] text-primary uppercase">{pair.weather}</p>
          <p className="mt-3 text-lg leading-relaxed text-ink/90">{pair.copy}</p>
          <ul className="mt-5 space-y-2 text-sm text-ink/80">
            <li>{pair.sharedPlanet ? "Shared planet in the hymn." : "No shared planet."}</li>
            <li>{pair.isopsephic ? "Isopsephic — the same weight." : "Different weights."}</li>
            <li>{pair.crossedAxis ? "A crossed axis: entrance meets return." : "Axes do not cross."}</li>
            <li>{pair.kinHit ? "Kin in the stoicheia." : "No official kin."}</li>
            <li>{pair.erisHit ? "Eris is present." : "No official strife."}</li>
          </ul>
          <p className="mt-6 font-display text-xl text-ink">
            {pair.a.spelled} · {pair.b.spelled}
          </p>
        </section>
      ) : null}
    </StoicheiaFrame>
  );
}
