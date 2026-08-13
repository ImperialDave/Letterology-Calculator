import { Link } from "@tanstack/react-router";
import { houseOf } from "@/lib/letterology/archetypes";
import { alliesOf, enemiesOf } from "@/lib/letterology/circle";
import type { Letter } from "@/lib/letterology/types";

function BondRow({
  label,
  letters,
}: {
  label: string;
  letters: Letter[];
}) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="mr-2 font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase">
        {label}
      </span>
      {letters.map((letter, index) => (
        <span key={letter}>
          {index > 0 ? <span className="text-muted"> · </span> : null}
          <Link
            to="/circle"
            search={{ house: letter }}
            className="font-display text-ink underline-offset-4 hover:underline"
          >
            {letter} {houseOf(letter).noun}
          </Link>
        </span>
      ))}
    </p>
  );
}

export function CourtLines({ letter }: { letter: Letter }) {
  return (
    <div className="mt-3 space-y-1">
      <BondRow label="Allies" letters={alliesOf(letter)} />
      <BondRow label="Enemies" letters={enemiesOf(letter)} />
    </div>
  );
}
