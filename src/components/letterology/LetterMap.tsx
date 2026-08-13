import { themeOf } from "@/lib/letterology/lexicon";
import type { Horoscope, Letter } from "@/lib/letterology/types";
import { ALPHABET } from "@/lib/letterology/types";
import { letterPath } from "@/lib/letterology/engine";
import { cn } from "@/lib/utils";

const COLS = 7;
const CELL = 36;
const GAP = 8;
const PAD = 12;

function cellCenter(letter: Letter) {
  const i = ALPHABET.indexOf(letter);
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    x: PAD + col * (CELL + GAP) + CELL / 2,
    y: PAD + row * (CELL + GAP) + CELL / 2,
  };
}

export function LetterMap({
  horoscope,
  onSelect,
  selected,
}: {
  horoscope: Horoscope;
  onSelect?: (letter: Letter) => void;
  selected?: Letter | null;
}) {
  const byLetter = new Map(horoscope.inventory.map((item) => [item.letter, item]));
  const maxWeight = horoscope.inventory[0]?.weight || 1;
  const path = letterPath(horoscope.parts);
  const uniquePath = path.filter((letter, i) => i === 0 || path[i - 1] !== letter);
  const points = uniquePath
    .map((letter) => cellCenter(letter))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const rows = Math.ceil(ALPHABET.length / COLS);
  const width = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
  const height = PAD * 2 + rows * CELL + (rows - 1) * GAP;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto h-auto w-full max-w-lg"
        role="img"
        aria-label={`Letter map of ${horoscope.displayName}`}
      >
        {points.length > 0 ? (
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="text-primary/35"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {ALPHABET.map((letter) => {
          const { x, y } = cellCenter(letter);
          const item = byLetter.get(letter);
          const intensity = item ? Math.max(0.14, item.weight / maxWeight) : 0;
          const isPrimary = horoscope.primary.letter === letter;
          const isSelected = selected === letter;
          return (
            <g key={letter}>
              <rect
                x={x - CELL / 2}
                y={y - CELL / 2}
                width={CELL}
                height={CELL}
                rx="6"
                className={cn(
                  isPrimary ? "fill-primary" : item ? "fill-ink" : "fill-ink/8",
                  onSelect ? "cursor-pointer" : "",
                )}
                opacity={isPrimary ? 1 : item ? 0.18 + intensity * 0.72 : 1}
                onClick={() => onSelect?.(letter)}
                aria-label={`${letter} — ${themeOf(letter).name}${item ? `, ${item.count} times` : ", silent in this name"}`}
              />
              {isSelected ? (
                <rect
                  x={x - CELL / 2 - 1.5}
                  y={y - CELL / 2 - 1.5}
                  width={CELL + 3}
                  height={CELL + 3}
                  rx="8"
                  fill="none"
                  className="stroke-primary pointer-events-none"
                  strokeWidth="1.5"
                />
              ) : null}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  "font-display pointer-events-none",
                  isPrimary || intensity > 0.55 ? "fill-primary-fg" : item ? "fill-ink" : "fill-muted",
                )}
                fontSize="13"
                fontWeight={isPrimary ? 600 : 500}
              >
                {letter}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
