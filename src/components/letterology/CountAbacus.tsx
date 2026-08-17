import { houseOf } from "@/lib/letterology/archetypes";
import {
  addLetter,
  addPlace,
  formatWalk,
  nextWalk,
  prevWalk,
  speakChain,
  type CountWalk,
} from "@/lib/letterology/count";
import { pigmentOf } from "@/lib/letterology/pigment";
import { ALPHABET, type Letter } from "@/lib/letterology/types";

const PLACES = [
  { power: 0, label: "Add one" },
  { power: 1, label: "Add a set of 26" },
  { power: 2, label: "Add 26 × 26" },
] as const;

export function CountAbacus({
  walk,
  onChange,
}: {
  walk: CountWalk;
  onChange: (next: CountWalk) => void;
}) {
  const shown = formatWalk(walk);
  const closed = walk.chain.join("") === "Z";

  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Count forward</p>
      <p className="mt-1 text-sm text-muted">
        Click next. After Z the wheel closes and the next house stands up — AA.
      </p>
      <p
        className="mt-5 font-display text-5xl leading-none tracking-[0.12em] text-ink sm:text-6xl"
        style={walk.chain[0] ? { color: pigmentOf(walk.chain[0]).css } : undefined}
      >
        {shown || "—"}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">
        {walk.chain.length === 0 ? "Nothing. The Fool is the blank." : speakChain(walk.chain)}
      </p>
      {closed ? (
        <p className="mt-2 text-sm text-primary">The wheel is about to close.</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center rounded-md bg-primary px-4 font-display text-xs tracking-[0.14em] text-primary-fg uppercase"
          onClick={() => onChange(nextWalk(walk))}
        >
          Next
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center rounded-md bg-bg px-4 font-display text-xs tracking-[0.14em] text-ink uppercase shadow-[var(--shadow-border)]"
          onClick={() => onChange(prevWalk(walk))}
        >
          Back
        </button>
        {PLACES.map((place) => (
          <button
            key={place.power}
            type="button"
            className="inline-flex h-11 items-center rounded-md bg-bg px-4 font-display text-xs tracking-[0.14em] text-ink uppercase shadow-[var(--shadow-border)]"
            onClick={() => onChange(addPlace(walk, place.power))}
          >
            {place.label}
          </button>
        ))}
      </div>
      <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">
        Add a house’s worth
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            type="button"
            title={`${letter} — ${houseOf(letter).noun}`}
            className="inline-flex size-10 items-center justify-center rounded-md bg-bg font-display text-sm shadow-[var(--shadow-border)]"
            style={{ color: pigmentOf(letter).css }}
            onClick={() => onChange(addLetter(walk, letter as Letter))}
          >
            {letter}
          </button>
        ))}
      </div>
    </section>
  );
}
