import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { PageShare } from "@/components/letterology/PageShare";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readStoicheion } from "@/lib/stoicheia/engine";
import { horaOf } from "@/lib/stoicheia/horae";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { n?: string };

export const Route = createFileRoute("/stoicheia/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  loader: ({ location }) => ({
    n: new URL(location.href, "https://www.letterology.club").searchParams.get("n") ?? undefined,
  }),
  head: ({ loaderData }) => {
    const reading = readStoicheion(loaderData?.n ?? "");
    if (!reading) {
      return pageCardMeta({
        title: "Stoicheia",
        description: "The Greek tongue of CC33. Twenty-four elements. A hymn, an axis, a soma, an omphalos.",
        path: "/stoicheia",
        imagePath: "/og.jpg",
      });
    }
    return pageCardMeta({
      title: `${reading.spelled} · ${reading.axis.proodos}–${reading.axis.epistrophe}`,
      description: reading.axisCopy,
      path: `/stoicheia?n=${encodeURIComponent(reading.raw)}`,
      imagePath: "/og.jpg",
    });
  },
  component: StoicheiaDoor,
});

function StoicheiaDoor() {
  const { n } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/" });
  const [value, setValue] = useState(n ?? "");
  const reading = n ? readStoicheion(n) : null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ search: { n: value.trim() || undefined } });
  }

  return (
    <StoicheiaFrame current="Name">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · στοιχεῖα</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Stoicheia</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Not Letterology in a chiton. The Greeks called letters elements — the same word as
          fire. A name is read as procession and return, as a hymn of seven planets, as a
          civic body, and as a number that was always a letter. Twenty-four seats. Night
          first. We do not steal the Latin machine.
        </p>
        <PageShare
          path="/stoicheia"
          caption={"Stoicheia\nThe Greek tongue of CC33. Twenty-four elements."}
          imagePath="/og.jpg"
        />
      </header>

      <form onSubmit={onSubmit} className="mt-8 max-w-xl">
        <Label htmlFor="stoich-n">A handle</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="stoich-n"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Απόλλων or Apollo"
            autoCapitalize="none"
            spellCheck={false}
          />
          <Button type="submit" className="h-12 shrink-0">
            Read the elements
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Greek or Latin. The fold is published: C becomes Κ, TH becomes Θ, ς becomes Σ.
        </p>
      </form>

      {n && !reading ? <p className="mt-8 text-sm text-primary">That handle has no stoicheion in it.</p> : null}

      {reading ? (
        <div className="mt-10 space-y-6">
          <p className="font-display text-4xl tracking-[0.12em] text-ink">{reading.spelled}</p>
          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
              Proodos · Epistrophe
            </p>
            <p className="mt-2 font-display text-3xl text-ink">
              {reading.axis.proodos} → {reading.axis.epistrophe}
            </p>
            <p className="mt-2 text-sm text-muted">
              {horaOf(reading.axis.proodos).noun} toward {horaOf(reading.axis.epistrophe).noun}
            </p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.axisCopy}</p>
          </section>
          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The hymn</p>
            <p className="mt-2 font-display text-2xl tracking-[0.14em] text-ink">
              {reading.hymn.map((item) => item.letter).join(" · ") || "—"}
            </p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.hymnLine}</p>
          </section>
          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The soma</p>
            <p className="mt-3 leading-relaxed text-ink/90">{reading.somaCopy}</p>
          </section>
          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Omphalos</p>
            <p className="mt-2 font-display text-3xl text-ink">
              {reading.omphalos} · {reading.omphalosHora.noun}
            </p>
            <p className="mt-2 text-sm text-muted">
              Isopsephy {reading.sumSpell} · sits {reading.omphalosHora.greek}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">{reading.omphalosHora.myth}</p>
          </section>
        </div>
      ) : null}
    </StoicheiaFrame>
  );
}
