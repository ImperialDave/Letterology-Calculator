import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canonWithSums, friendsOfSum } from "@/lib/stoicheia/canon";
import { readStoicheion } from "@/lib/stoicheia/engine";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { n?: string };

export const Route = createFileRoute("/stoicheia/canon")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "The canon",
      description: "Old words that weigh the same. Famous Milesian totals, cited, never invented.",
      path: "/stoicheia/canon",
      imagePath: "/og.jpg",
    }),
  component: CanonPage,
});

function CanonPage() {
  const { n } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/canon" });
  const [value, setValue] = useState(n ?? "");
  const reading = n ? readStoicheion(n) : null;
  const rows = useMemo(() => canonWithSums().sort((a, b) => a.sum - b.sum), []);
  const hits = reading ? friendsOfSum(reading.sum) : [];

  return (
    <StoicheiaFrame current="Canon">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">old words that weigh the same</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The canon</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Greeks treated equal sums as a sign. This table is curated and cited. If we cannot
          point at a source, it is not here. Totals are computed with our Milesian letters —
          the same engine that reads your username.
        </p>
      </header>

      <form
        className="mt-8 max-w-xl"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          navigate({ search: { n: value.trim() || undefined } });
        }}
      >
        <Label htmlFor="canon-n">A username</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input id="canon-n" value={value} onChange={(event) => setValue(event.target.value)} />
          <Button type="submit" className="h-12 shrink-0">
            Who weighs this?
          </Button>
        </div>
      </form>

      {reading ? (
        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-2xl text-ink">
            {reading.spelled} · {reading.sumSpell}
          </p>
          {hits.length > 0 ? (
            <p className="mt-3 leading-relaxed text-ink/90">
              This total is also {hits.map((item) => `${item.greek} (${item.english})`).join(", ")}.
              The ancients treated a shared sum as a sign, not a soul.
            </p>
          ) : (
            <p className="mt-3 text-ink/80">
              No famous friend at this weight. The total still sits {reading.omphalosHora.noun}.
            </p>
          )}
        </section>
      ) : null}

      <ul className="mt-10 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)]">
        {rows.map((row) => (
          <li key={row.greek} className="py-4">
            <p className="font-display text-xl text-ink">
              {row.sum} · {row.greek}
            </p>
            <p className="text-sm text-ink/80">{row.english}</p>
            <p className="mt-1 text-xs text-muted">{row.source}</p>
          </li>
        ))}
      </ul>
    </StoicheiaFrame>
  );
}
