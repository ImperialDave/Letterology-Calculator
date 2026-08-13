import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ARCHETYPE_COUNT,
  allHouseNames,
  archetypeOf,
  houseOf,
  parseTriadCode,
} from "@/lib/letterology/archetypes";
import { alliesOf, enemiesOf } from "@/lib/letterology/circle";
import { themeOf } from "@/lib/letterology/lexicon";
import { ALPHABET, type Letter, type Triad } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";

type Search = { house?: string; code?: string };

export const Route = createFileRoute("/archetypes")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const houseRaw = typeof search.house === "string" ? search.house.toUpperCase() : undefined;
    const codeRaw = typeof search.code === "string" ? search.code.toUpperCase() : undefined;
    const parsed = parseTriadCode(codeRaw);
    const house =
      houseRaw && ALPHABET.includes(houseRaw) ? houseRaw : parsed ? parsed[0] : "A";
    return { house, code: parsed?.join("") };
  },
  component: HousesPage,
});

function HousesPage() {
  const { house, code } = Route.useSearch();
  const navigate = useNavigate({ from: "/archetypes" });
  const selectedHouse = (house ?? "A") as Letter;
  const selected: Triad = parseTriadCode(code) ?? [selectedHouse, selectedHouse, selectedHouse];
  const manner = selected[1];
  const selectedArchetype = useMemo(() => archetypeOf(selected), [selected]);
  const houses = allHouseNames();
  const selectedMeta = houses.find((item) => item.letter === selectedHouse) ?? houses[0];
  const [query, setQuery] = useState(code ?? "");

  const column = useMemo(
    () => ALPHABET.map((third) => archetypeOf([selectedHouse, manner, third])),
    [selectedHouse, manner],
  );

  function openTriad(next: Triad) {
    const nextCode = next.join("");
    setQuery(nextCode);
    navigate({ search: { house: next[0], code: nextCode } });
  }

  function handleCode(event: FormEvent) {
    event.preventDefault();
    const triad = parseTriadCode(query);
    if (!triad) return;
    openTriad(triad);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="houses" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            {ARCHETYPE_COUNT.toLocaleString()} named combinations
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The Houses</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            Twenty-six houses, one for each letter. They are the old figures —
            Seeker, Caregiver, Rebel, Hermit — said in plain English. A name
            chooses a house by its first letter. The two letters that weigh most
            after that set the manner and the field. Allies and enemies live on the{" "}
            <Link to="/circle" search={{ house: selectedHouse }} className="text-primary">
              Circle of Houses
            </Link>
            .
          </p>
        </header>

        <form onSubmit={handleCode} className="mt-8 max-w-md">
          <Label htmlFor="triad-code">Look up a triad</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="triad-code"
              value={query}
              onChange={(event) => setQuery(event.target.value.toUpperCase())}
              placeholder="ALE"
              maxLength={8}
              aria-describedby="triad-hint"
              spellCheck={false}
              autoCapitalize="characters"
            />
            <Button type="submit" className="h-12 shrink-0">
              Open triad
            </Button>
          </div>
          <p id="triad-hint" className="mt-2 text-sm text-muted">
            Three letters. First is the house; the next two are manner and field.
          </p>
        </form>

        <section className="mt-8">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">House · first letter</p>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
            {houses.map((item) => {
              const active = item.letter === selectedHouse;
              return (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => openTriad([item.letter, manner, selected[2]])}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-md font-display text-lg transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
                    active
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                  )}
                  aria-pressed={active}
                  aria-label={`${item.letter} — ${item.house}`}
                >
                  {item.letter}
                </button>
              );
            })}
          </div>
          {selectedMeta ? (
            <div className="mt-4 max-w-2xl">
              <p className="font-display text-xl text-ink">{selectedMeta.house}</p>
              <p className="mt-1 text-sm italic text-ink/70">{selectedMeta.myth}</p>
              <p className="mt-1 font-display text-xs tracking-[0.14em] text-muted uppercase">
                {selectedMeta.tradition}
              </p>
              <p className="mt-1 text-sm text-ink/65">{selectedMeta.correspondence}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">{selectedMeta.doctrine}</p>
              <p className="mt-3 text-sm text-muted">
                Allies{" "}
                {alliesOf(selectedHouse).map((letter) => (
                  <span key={letter} className="ml-1 font-display text-ink">
                    {letter} {houseOf(letter).noun}
                  </span>
                ))}
              </p>
              <p className="mt-1 text-sm text-muted">
                Enemies{" "}
                {enemiesOf(selectedHouse).map((letter) => (
                  <span key={letter} className="ml-1 font-display text-ink">
                    {letter} {houseOf(letter).noun}
                  </span>
                ))}
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            Manner · most common letter
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
            {ALPHABET.map((letter) => {
              const active = letter === manner;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => openTriad([selectedHouse, letter, selected[2]])}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-md font-display text-lg transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
                    active
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                  )}
                  aria-pressed={active}
                  aria-label={`${letter} — ${themeOf(letter).name}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </section>

        <p className="mt-6 text-sm text-muted">
          {selectedMeta?.noun} with a {themeOf(manner).name.toLowerCase()} manner · 26 of 676 in this house
        </p>

        <div className="mt-6">
          <ArchetypeCard archetype={selectedArchetype} />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            Field · the third letter
          </h2>
          <ul className="mt-3 divide-y divide-ink/10 rounded-xl bg-raised px-4 shadow-[var(--shadow-border)]">
            {column.map((item) => {
              const active = item.code === selectedArchetype.code;
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    onClick={() => openTriad(item.triad)}
                    className={cn(
                      "flex min-h-11 w-full items-baseline justify-between gap-4 py-3 text-left",
                      active ? "text-primary" : "text-ink",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-display">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {themeOf(item.triad[2]).name} · {item.summary.split(" · ").pop()}
                      </span>
                    </span>
                    <span className="shrink-0 font-display tracking-[0.16em]">{item.code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
