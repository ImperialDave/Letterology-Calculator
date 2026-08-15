import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { horaOf } from "@/lib/stoicheia/horae";
import { foldToStoicheia } from "@/lib/stoicheia/letters";
import { isopsephy, sitSum, spellQuantity } from "@/lib/stoicheia/milesian";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { n?: string; q?: string };

export const Route = createFileRoute("/stoicheia/isopsephy")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Isopsephy",
      description: "Greeks already wrote numbers as letters. We recover that. We do not invent a cipher.",
      path: "/stoicheia/isopsephy",
      imagePath: "/og.jpg",
    }),
  component: IsopsephyPage,
});

function IsopsephyPage() {
  const { n, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/isopsephy" });
  const [name, setName] = useState(n ?? "");
  const [qty, setQty] = useState(q ?? "");
  const letters = n ? foldToStoicheia(n) : [];
  const sum = letters.length ? isopsephy(letters) : 0;
  const seat = letters.length ? sitSum(sum) : null;
  const quantity = q && /^\d+$/.test(q) ? Number(q) : null;

  return (
    <StoicheiaFrame current="Isopsephy">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">ἰσοψηφία</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The Milesian count</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          A Greek number was already a spelling. Α is one, Ι is ten, Ρ is a hundred, Ω is
          eight hundred. Ἰησοῦς is eight hundred eighty-eight. We do not fold that to a
          single digit. The sum sits the twenty-four. The Latin Count is another honest
          system. This is the older one.
        </p>
      </header>

      <form
        className="mt-8 grid gap-6 sm:grid-cols-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          navigate({ search: { n: name.trim() || undefined, q: qty.trim() || undefined } });
        }}
      >
        <div>
          <Label htmlFor="iso-n">A handle</Label>
          <Input id="iso-n" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ἰησοῦς" />
        </div>
        <div>
          <Label htmlFor="iso-q">A quantity</Label>
          <Input id="iso-q" className="mt-2" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="2026" inputMode="numeric" />
        </div>
        <Button type="submit" className="h-12 sm:col-span-2 sm:w-fit">
          Spell it
        </Button>
      </form>

      {seat ? (
        <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The name’s number</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {letters.join("")} · {spellQuantity(sum)}
          </p>
          <p className="mt-3 text-lg text-ink/90">
            Omphalos {seat} · {horaOf(seat).noun}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{horaOf(seat).myth}</p>
        </section>
      ) : null}

      {quantity && quantity > 0 ? (
        <section className="mt-6 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">How a Greek wrote it</p>
          <p className="mt-3 font-display text-5xl text-ink">{spellQuantity(quantity)}</p>
          <p className="mt-3 text-sm text-muted">
            Sits {sitSum(quantity)} · {horaOf(sitSum(quantity)).noun}. Not the Latin spelling.
          </p>
        </section>
      ) : null}
    </StoicheiaFrame>
  );
}
