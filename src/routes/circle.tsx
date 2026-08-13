import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HouseCircle } from "@/components/letterology/HouseCircle";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { houseOf } from "@/lib/letterology/archetypes";
import { bondsOf, isCircleLetter } from "@/lib/letterology/circle";
import { themeOf } from "@/lib/letterology/lexicon";
import type { Letter } from "@/lib/letterology/types";

type Search = { house?: string };

export const Route = createFileRoute("/circle")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.house === "string" ? search.house.toUpperCase() : "A";
    return { house: isCircleLetter(raw) ? raw : "A" };
  },
  component: CirclePage,
});

function CirclePage() {
  const { house } = Route.useSearch();
  const navigate = useNavigate({ from: "/circle" });
  const selected = (house ?? "A") as Letter;
  const meta = houseOf(selected);
  const theme = themeOf(selected);
  const { allies, enemies } = bondsOf(selected);

  return (
    <div className="min-h-dvh">
      <SiteHeader current="circle" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            Twenty-six seats on one wheel
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Circle of Houses</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            The alphabet stands in a wheel, A at the top. Each house has three
            allies — figures that complete its work — and three enemies — figures
            that show its blind spot. An enemy is not a villain. It is the house
            that will not let this one sleep.
          </p>
        </header>

        <section className="mt-10 rounded-xl bg-raised px-2 py-6 shadow-[var(--shadow-border)] sm:px-6 sm:py-8">
          <HouseCircle
            selected={selected}
            onSelect={(letter) => navigate({ search: { house: letter } })}
          />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-6 bg-primary" aria-hidden="true" />
              Ally
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-6 border-t border-dashed border-ink/50" aria-hidden="true" />
              Enemy
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {theme.name} · {meta.correspondence}
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">{meta.house}</h2>
          <p className="mt-2 text-sm italic text-ink/70">{meta.myth}</p>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{meta.doctrine}</p>
          <p className="mt-4">
            <Link
              to="/archetypes"
              search={{ house: selected }}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              Open this house
            </Link>
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BondColumn kind="Allies" items={allies} onSelect={(letter) => navigate({ search: { house: letter } })} />
          <BondColumn kind="Enemies" items={enemies} onSelect={(letter) => navigate({ search: { house: letter } })} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function BondColumn({
  kind,
  items,
  onSelect,
}: {
  kind: "Allies" | "Enemies";
  items: { other: Letter; copy: string }[];
  onSelect: (letter: Letter) => void;
}) {
  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{kind}</p>
      <ul className="mt-4 divide-y divide-ink/10">
        {items.map((item) => {
          const other = houseOf(item.other);
          return (
            <li key={item.other} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => onSelect(item.other)}
                className="flex min-h-11 w-full items-baseline gap-3 text-left"
              >
                <span className="font-display text-2xl text-primary">{item.other}</span>
                <span className="font-display text-lg text-ink">{other.house.replace("House of the ", "")}</span>
              </button>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{item.copy}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
