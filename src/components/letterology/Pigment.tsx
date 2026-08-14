import { LETTER_PATH } from "@/lib/letterology/brand";
import {
  mixLabel,
  mixStyle,
  mixTriad,
  pigmentOf,
  pigmentStyle,
  ribbonStops,
  TRIAD_WEIGHTS,
} from "@/lib/letterology/pigment";
import type { Letter, Triad } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";
import type { CircleSeat } from "@/components/letterology/HouseCircle";

export function PigmentPip({
  letter,
  size = "md",
  className,
}: {
  letter: Letter;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pigment = pigmentOf(letter);
  const dim = size === "sm" ? "size-2.5" : size === "lg" ? "size-4" : "size-3";
  return (
    <span
      aria-hidden="true"
      title={`${letter} — ${pigment.name}`}
      className={cn("inline-block shrink-0 rounded-full", dim, className)}
      style={{ backgroundColor: pigment.css }}
    />
  );
}

export function PigmentSwatch({
  letter,
  showName = true,
  className,
}: {
  letter: Letter;
  showName?: boolean;
  className?: string;
}) {
  const pigment = pigmentOf(letter);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="grid size-11 place-items-center rounded-full font-display text-sm shadow-[var(--shadow-border)]"
        style={pigmentStyle(letter)}
      >
        {letter}
      </span>
      {showName ? (
        <span>
          <span className="font-display text-ink">{pigment.name}</span>
          <span className="mt-0.5 block text-sm text-muted">{letter} on the wheel</span>
        </span>
      ) : null}
    </div>
  );
}

export function PigmentRibbon({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-2 w-full rounded-full", className)}
      style={{ backgroundImage: `linear-gradient(90deg, ${ribbonStops()})` }}
    />
  );
}

export function PigmentMix({
  triad,
  title,
}: {
  triad: Triad;
  title?: string;
}) {
  const mix = mixTriad(triad);
  const weights = ["half", "three-tenths", "two-tenths"];
  return (
    <div className="flex items-center gap-4">
      <span
        className="grid size-16 shrink-0 place-items-center rounded-full font-display text-lg shadow-[var(--shadow-border)] sm:size-[4.5rem] sm:text-xl"
        style={mixStyle(mix)}
      >
        {triad.join("")}
      </span>
      <div className="min-w-0">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
          {title ?? `${LETTER_PATH} color`}
        </p>
        <p className="mt-1 font-display text-ink">{mixLabel(triad)}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {mix.sources.map((pigment, index) => (
            <span key={`${pigment.letter}-${index}`} className="inline-flex items-center gap-1.5 text-sm text-muted">
              <PigmentPip letter={pigment.letter} />
              {pigment.letter} {pigment.name}
              <span className="text-subtle">· {weights[index]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MixPot({ triad }: { triad: Triad }) {
  const mix = mixTriad(triad);
  const sources = mix.sources;
  const sizes = ["size-16 sm:size-20", "size-12 sm:size-14", "size-10 sm:size-11"];
  const offsets = [
    "left-1/2 top-2 -translate-x-1/2",
    "bottom-3 left-2 sm:bottom-4 sm:left-3",
    "right-2 bottom-3 sm:right-3 sm:bottom-4",
  ];
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative size-40 shrink-0 sm:size-44">
        {sources.map((pigment, index) => (
          <span
            key={`${pigment.letter}-${index}`}
            className={cn(
              "absolute grid place-items-center rounded-full font-display text-sm shadow-[var(--shadow-border)]",
              sizes[index],
              offsets[index],
            )}
            style={pigmentStyle(pigment.letter)}
          >
            {pigment.letter}
          </span>
        ))}
        <span
          className="absolute top-1/2 left-1/2 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-base shadow-[var(--shadow-border)] sm:size-20 sm:text-lg"
          style={mixStyle(mix)}
        >
          {triad.join("")}
        </span>
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The pot</p>
        <p className="mt-1 font-display text-xl text-ink">{mixLabel(triad)}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink/80">
          House {Math.round(TRIAD_WEIGHTS[0] * 100)} · manner {Math.round(TRIAD_WEIGHTS[1] * 100)} ·
          field {Math.round(TRIAD_WEIGHTS[2] * 100)}. Mixed in OKLab, the way pigments combine —
          not the way screens add light.
        </p>
      </div>
    </div>
  );
}

const SEAT_COPY: Record<CircleSeat, { label: string; hint: string }> = {
  house: { label: "House", hint: "the role — first letter" },
  manner: { label: "Manner", hint: "how the role works" },
  field: { label: "Field", hint: "where the work happens" },
};

export function SeatMixer({
  triad,
  picking,
  onPick,
}: {
  triad: Triad;
  picking: CircleSeat;
  onPick: (seat: CircleSeat) => void;
}) {
  const seats: CircleSeat[] = ["house", "manner", "field"];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {seats.map((seat, index) => {
        const letter = triad[index];
        const pigment = pigmentOf(letter);
        const active = picking === seat;
        return (
          <button
            key={seat}
            type="button"
            onClick={() => onPick(seat)}
            aria-pressed={active}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center rounded-lg px-2 py-3 transition-[transform,box-shadow] duration-150 active:scale-[0.98] sm:min-h-[4.5rem]",
              active ? "shadow-[var(--shadow-border-hover)]" : "shadow-[var(--shadow-border)]",
            )}
            style={active ? pigmentStyle(letter) : { backgroundColor: "var(--color-raised)", color: "var(--color-ink)" }}
          >
            <span className="font-display text-xs tracking-[0.14em] uppercase opacity-80">
              {SEAT_COPY[seat].label}
            </span>
            <span className="mt-1 font-display text-2xl leading-none">{letter}</span>
            <span className={cn("mt-1 text-[0.7rem]", active ? "opacity-80" : "text-muted")}>
              {pigment.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PigmentLegend({
  selected,
  onSelect,
}: {
  selected?: Letter;
  onSelect?: (letter: Letter) => void;
}) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") as Letter[];
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {letters.map((letter) => {
        const pigment = pigmentOf(letter);
        const active = letter === selected;
        return (
          <button
            key={letter}
            type="button"
            onClick={() => onSelect?.(letter)}
            aria-pressed={active}
            aria-label={`${letter}, ${pigment.name}`}
            className={cn(
              "grid size-8 place-items-center rounded-full font-display text-[0.7rem] transition-[transform,box-shadow] duration-150 active:scale-[0.96] sm:size-9 sm:text-xs",
              active ? "ring-2 ring-ink ring-offset-2 ring-offset-raised" : "",
            )}
            style={pigmentStyle(letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
