import { houseOf } from "@/lib/letterology/archetypes";
import { alliesOf, enemiesOf } from "@/lib/letterology/circle";
import { ALPHABET, type Letter } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const SIZE = 400;
const CX = 200;
const CY = 200;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const SEATS = ALPHABET.map((letter, index) => {
  const radius = index % 2 === 0 ? 158 : 124;
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 26);
  const x = round(CX + Math.cos(angle) * radius);
  const y = round(CY + Math.sin(angle) * radius);
  return {
    letter,
    x,
    y,
    tickX: round(CX + Math.cos(angle) * (radius + 18)),
    tickY: round(CY + Math.sin(angle) * (radius + 18)),
    left: `${round((x / SIZE) * 100)}%`,
    top: `${round((y / SIZE) * 100)}%`,
  };
});

const SEAT_MAP = Object.fromEntries(SEATS.map((seat) => [seat.letter, seat])) as Record<
  Letter,
  (typeof SEATS)[number]
>;

export function HouseCircle({
  selected,
  partner,
  onSelect,
  asLinks = false,
}: {
  selected: Letter;
  partner?: Letter;
  onSelect?: (letter: Letter) => void;
  asLinks?: boolean;
}) {
  const house = houseOf(selected);
  const allies = alliesOf(selected);
  const enemies = enemiesOf(selected);
  const selectedSeat = SEAT_MAP[selected];
  const partnerSeat = partner && partner !== selected ? SEAT_MAP[partner] : null;
  const bondKind = partner && partner !== selected ? (allies.includes(partner) ? "ally" : enemies.includes(partner) ? "enemy" : "none") : null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full"
        role="img"
        aria-label={
          partner
            ? `Circle of Houses. ${house.house} and ${houseOf(partner).house}.`
            : `Circle of Houses. ${house.house} selected.`
        }
      >
        <circle cx={CX} cy={CY} r="176" fill="none" stroke="currentColor" className="text-ink/10" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="158" fill="none" stroke="currentColor" className="text-ink/15" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="124" fill="none" stroke="currentColor" className="text-ink/15" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="72" fill="none" stroke="currentColor" className="text-ink/10" strokeWidth="1" />
        {SEATS.map((seat) => (
          <line
            key={`tick-${seat.letter}`}
            x1={seat.x}
            y1={seat.y}
            x2={seat.tickX}
            y2={seat.tickY}
            stroke="currentColor"
            className="text-ink/20"
            strokeWidth="1"
          />
        ))}
        {enemies.map((letter) => {
          const end = SEAT_MAP[letter];
          return (
            <line
              key={`enemy-${letter}`}
              x1={selectedSeat.x}
              y1={selectedSeat.y}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              className="text-ink/40"
              strokeWidth="1.25"
              strokeDasharray="4 5"
            />
          );
        })}
        {allies.map((letter) => {
          const end = SEAT_MAP[letter];
          return (
            <line
              key={`ally-${letter}`}
              x1={selectedSeat.x}
              y1={selectedSeat.y}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              className="text-primary"
              strokeWidth="1.75"
            />
          );
        })}
        {partnerSeat && bondKind === "none" ? (
          <line
            x1={selectedSeat.x}
            y1={selectedSeat.y}
            x2={partnerSeat.x}
            y2={partnerSeat.y}
            stroke="currentColor"
            className="text-ink/35"
            strokeWidth="1.5"
            strokeDasharray="2 6"
          />
        ) : null}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className="fill-primary font-display"
          fontSize="44"
          fontFamily="Fraunces, Palatino, serif"
        >
          {selected}
        </text>
        <text
          x={CX}
          y={CY + 20}
          textAnchor="middle"
          className="fill-ink font-display"
          fontSize="12"
          fontFamily="Fraunces, Palatino, serif"
        >
          {house.noun}
        </text>
      </svg>

      {SEATS.map((seat) => {
        const isSelected = seat.letter === selected;
        const isPartner = Boolean(partner && seat.letter === partner && !isSelected);
        const isAlly = allies.includes(seat.letter);
        const isEnemy = enemies.includes(seat.letter);
        const className = cn(
          "absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.96] sm:size-10 sm:text-base",
          isSelected
            ? "bg-primary text-primary-fg"
            : isPartner
              ? "bg-primary/15 text-primary outline outline-2 outline-primary"
              : isAlly
                ? "bg-raised text-primary shadow-[var(--shadow-border)]"
                : isEnemy
                  ? "bg-ink text-raised shadow-[var(--shadow-border)]"
                  : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        );
        const label = `${seat.letter}, ${houseOf(seat.letter).house}${isAlly ? ", ally" : ""}${isEnemy ? ", enemy" : ""}${isPartner ? ", other handle" : ""}`;
        if (asLinks) {
          return (
            <Link
              key={seat.letter}
              to="/circle"
              search={{ house: seat.letter }}
              aria-label={label}
              style={{ left: seat.left, top: seat.top }}
              className={className}
            >
              {seat.letter}
            </Link>
          );
        }
        return (
          <button
            key={seat.letter}
            type="button"
            onClick={() => onSelect?.(seat.letter)}
            aria-pressed={isSelected}
            aria-label={label}
            style={{ left: seat.left, top: seat.top }}
            className={className}
          >
            {seat.letter}
          </button>
        );
      })}
    </div>
  );
}
