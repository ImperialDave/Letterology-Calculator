import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readStoicheion } from "@/lib/stoicheia/engine";
import { CHOIR, type Planet } from "@/lib/stoicheia/hymn";
import { PLANET_RANK } from "@/lib/stoicheia/motion";
import { pageCardMeta } from "@/lib/letterology/share";

type Search = { n?: string };

export const Route = createFileRoute("/stoicheia/hymn")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "The vowels",
      description: "Seven vowels. Seven planets. Sung in order, never by weight.",
      path: "/stoicheia/hymn",
      imagePath: "/og.jpg",
    }),
  component: HymnPage,
});

function HymnPage() {
  const { n } = Route.useSearch();
  const navigate = useNavigate({ from: "/stoicheia/hymn" });
  const [value, setValue] = useState(n ?? "");
  const reading = n ? readStoicheion(n) : null;

  return (
    <StoicheiaFrame current="Vowels">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">the vowels, in order</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The seven vowels</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Late antique practice bound the seven Greek vowels to the seven planets. A name’s
          hymn is those vowels in the order they appear. Breath has sequence. We do not weigh
          a song.
        </p>
      </header>

      <form
        className="mt-8 max-w-xl"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          navigate({ search: { n: value.trim() || undefined } });
        }}
      >
        <Label htmlFor="hymn-n">A username</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="hymn-n"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Αθηνά or Athena"
          />
          <Button type="submit" className="h-12 shrink-0">
            Hear the vowels
          </Button>
        </div>
      </form>

      {reading ? (
        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{reading.spelled}</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {reading.hymn.map((item) => item.letter).join(" · ") || "—"}
          </p>
          <p className="mt-3 font-display text-lg text-ink">{reading.motion.line}</p>
          <p className="mt-3 leading-relaxed text-ink/90">{reading.hymnLine}</p>
          <ol className="mt-5 space-y-1 text-sm">
            {(Object.entries(PLANET_RANK) as [Planet, number][])
              .sort((a, b) => a[1] - b[1])
              .map(([planet, rank]) => {
                const hits = reading.hymn.filter((item) => item.planet === planet);
                return (
                  <li key={planet} className={hits.length ? "text-ink" : "text-muted"}>
                    {rank + 1}. {planet}
                    {hits.length ? ` — ${hits.map((item) => item.letter).join(" · ")}` : ""}
                  </li>
                );
              })}
          </ol>
        </section>
      ) : null}

      <ol className="mt-10 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)] sm:px-7">
        {Object.entries(CHOIR).map(([letter, face]) => (
          <li key={letter} className="py-6">
            <p className="font-display text-4xl text-ink">{letter}</p>
            <p className="mt-1 font-display text-xl text-ink">
              {face.face} · {face.god}
            </p>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink/85">{face.line}</p>
          </li>
        ))}
      </ol>
    </StoicheiaFrame>
  );
}
