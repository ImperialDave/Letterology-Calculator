import { houseOf } from "@/lib/letterology/archetypes";
import { alliesOf, enemiesOf } from "@/lib/letterology/circle";
import { mixTriad, pigmentOf } from "@/lib/letterology/pigment";
import { ALPHABET, type Letter, type Triad } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export type CircleSeat = "house" | "manner" | "field";

const SIZE = 420;
const CX = 210;
const CY = 210;
const RIBBON_INNER = 194;
const RIBBON_OUTER = 209;
const WEDGE_INNER = 104;
const WEDGE_OUTER = 186;
const LETTER_R = 148;
const WELL_R = 54;
const GAP = 0.012;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function polar(radius: number, angle: number): { x: number; y: number } {
  return {
    x: round(CX + Math.cos(angle) * radius),
    y: round(CY + Math.sin(angle) * radius),
  };
}

function ringPath(index: number, inner: number, outer: number, gap: number): string {
  const step = (Math.PI * 2) / 26;
  const a0 = -Math.PI / 2 + (index - 0.5) * step + gap;
  const a1 = -Math.PI / 2 + (index + 0.5) * step - gap;
  const p0 = polar(outer, a0);
  const p1 = polar(outer, a1);
  const p2 = polar(inner, a1);
  const p3 = polar(inner, a0);
  return `M ${p0.x} ${p0.y} A ${outer} ${outer} 0 0 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${inner} ${inner} 0 0 0 ${p3.x} ${p3.y} Z`;
}

const SEATS = ALPHABET.map((letter, index) => {
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 26);
  const { x, y } = polar(LETTER_R, angle);
  return {
    letter,
    index,
    x,
    y,
    left: `${round((x / SIZE) * 100)}%`,
    top: `${round((y / SIZE) * 100)}%`,
    wedge: ringPath(index, WEDGE_INNER, WEDGE_OUTER, GAP),
    ribbon: ringPath(index, RIBBON_INNER, RIBBON_OUTER, 0),
  };
});

const SEAT_MAP = Object.fromEntries(SEATS.map((seat) => [seat.letter, seat])) as Record<
  Letter,
  (typeof SEATS)[number]
>;

export function HouseCircle({
  selected,
  partner,
  triad,
  picking,
  onSelect,
  asLinks = false,
}: {
  selected: Letter;
  partner?: Letter;
  triad?: Triad;
  picking?: CircleSeat;
  onSelect?: (letter: Letter) => void;
  asLinks?: boolean;
}) {
  const house = houseOf(selected);
  const allies = alliesOf(selected);
  const enemies = enemiesOf(selected);
  const selectedSeat = SEAT_MAP[selected];
  const selectedPigment = pigmentOf(selected);
  const mix = triad ? mixTriad(triad) : null;
  const well = mix ?? selectedPigment;
  const partnerSeat = partner && partner !== selected ? SEAT_MAP[partner] : null;
  const bondKind =
    partner && partner !== selected
      ? allies.includes(partner)
        ? "ally"
        : enemies.includes(partner)
          ? "enemy"
          : "none"
      : null;
  const mixLetters = triad ? new Set(triad) : null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full"
        role="img"
        aria-label={
          mix
            ? `Color wheel. ${triad!.join("")} mixes ${well.css}.`
            : partner
              ? `Circle of Houses. ${house.house} and ${houseOf(partner).house}.`
              : `Circle of Houses. ${house.house} selected. ${selectedPigment.name} on the wheel.`
        }
      >
        <circle cx={CX} cy={CY} r="212" fill="none" stroke="currentColor" className="text-ink/10" strokeWidth="1" />
        {SEATS.map((seat) => (
          <path key={`ribbon-${seat.letter}`} d={seat.ribbon} fill={pigmentOf(seat.letter).css} />
        ))}
        {SEATS.map((seat) => {
          const pigment = pigmentOf(seat.letter);
          const inMix = mixLetters?.has(seat.letter) ?? false;
          const isSelected = seat.letter === selected;
          const isPartner = Boolean(partner && seat.letter === partner);
          return (
            <path
              key={`wedge-${seat.letter}`}
              d={seat.wedge}
              fill={pigment.css}
              opacity={isSelected || isPartner || inMix ? 0.95 : 0.58}
              className="transition-opacity duration-200"
            />
          );
        })}
        <circle cx={CX} cy={CY} r={WEDGE_INNER - 2} fill="var(--color-raised)" />
        <circle cx={CX} cy={CY} r={WELL_R + 6} fill="none" stroke="currentColor" className="text-ink/10" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={WELL_R} fill={well.css} />
        {triad
          ? triad.map((letter, index) => {
              const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 3);
              const pip = polar(WELL_R + 14, angle);
              return (
                <circle
                  key={`pip-${index}-${letter}`}
                  cx={pip.x}
                  cy={pip.y}
                  r="5"
                  fill={pigmentOf(letter).css}
                  stroke="var(--color-raised)"
                  strokeWidth="1.5"
                />
              );
            })
          : null}
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
              stroke={pigmentOf(letter).css}
              strokeWidth="2.25"
            />
          );
        })}
        {partnerSeat && bondKind === "none" ? (
          <line
            x1={selectedSeat.x}
            y1={selectedSeat.y}
            x2={partnerSeat.x}
            y2={partnerSeat.y}
            stroke={pigmentOf(partner!).css}
            strokeWidth="1.5"
            strokeDasharray="2 6"
            opacity="0.7"
          />
        ) : null}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          fill={well.ink}
          fontSize={mix ? 28 : 42}
          fontFamily="Fraunces, Palatino, serif"
        >
          {mix ? triad!.join("") : selected}
        </text>
        <text
          x={CX}
          y={CY + 18}
          textAnchor="middle"
          fill={well.ink}
          fontSize="10"
          fontFamily="Fraunces, Palatino, serif"
          opacity="0.85"
        >
          {mix ? "mix" : house.noun}
        </text>
      </svg>

      {SEATS.map((seat) => {
        const pigment = pigmentOf(seat.letter);
        const isSelected = seat.letter === selected;
        const isPartner = Boolean(partner && seat.letter === partner && !isSelected);
        const isAlly = allies.includes(seat.letter);
        const isEnemy = enemies.includes(seat.letter);
        const isHouse = triad?.[0] === seat.letter;
        const isManner = triad?.[1] === seat.letter;
        const isField = triad?.[2] === seat.letter;
        const isPicking =
          (picking === "house" && isHouse) ||
          (picking === "manner" && isManner) ||
          (picking === "field" && isField);
        const className = cn(
          "absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-sm transition-[transform,box-shadow] duration-150 active:scale-[0.96] sm:size-10 sm:text-base",
          isPicking ? "scale-110" : "",
          isSelected || isPartner || isAlly || isEnemy || isHouse || isManner || isField
            ? "shadow-[var(--shadow-border)]"
            : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        );
        const style = isSelected || isHouse
          ? { left: seat.left, top: seat.top, backgroundColor: pigment.css, color: pigment.ink }
          : isPartner || isManner || isField
            ? {
                left: seat.left,
                top: seat.top,
                backgroundColor: pigment.css,
                color: pigment.ink,
                boxShadow: `0 0 0 2px var(--color-raised), 0 0 0 4px ${pigment.css}`,
              }
            : isAlly
              ? {
                  left: seat.left,
                  top: seat.top,
                  backgroundColor: "var(--color-raised)",
                  color: "var(--color-ink)",
                  boxShadow: `0 0 0 2px ${pigment.css}`,
                }
              : isEnemy
                ? {
                    left: seat.left,
                    top: seat.top,
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-raised)",
                    boxShadow: `0 0 0 2px ${pigment.css}`,
                  }
                : { left: seat.left, top: seat.top, color: pigment.css };
        const label = `${seat.letter}, ${houseOf(seat.letter).house}, ${pigment.name}${isAlly ? ", ally" : ""}${isEnemy ? ", enemy" : ""}${isPartner ? ", other handle" : ""}`;
        if (asLinks) {
          return (
            <Link
              key={seat.letter}
              to="/circle"
              search={{ house: seat.letter }}
              aria-label={label}
              style={style}
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
            aria-pressed={isSelected || isPicking}
            aria-label={label}
            style={style}
            className={className}
          >
            {seat.letter}
          </button>
        );
      })}
    </div>
  );
}
