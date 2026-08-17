import { HORAE } from "@/lib/stoicheia/horae";
import { type Stoich } from "@/lib/stoicheia/letters";

export function NightWheel({
  first,
  last,
  daimon,
  hour,
  onSelect,
}: {
  first?: Stoich;
  last?: Stoich;
  daimon?: Stoich;
  hour?: Stoich;
  onSelect?: (letter: Stoich) => void;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 108;

  return (
    <div className="mx-auto w-full max-w-xs">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label="Twenty-four hours, sunset at the top">
        {HORAE.map((hora, index) => {
          const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const pin =
            hora.letter === first
              ? "first"
              : hora.letter === last
                ? "last"
                : hora.letter === daimon
                  ? "daimon"
                  : hora.letter === hour
                    ? "hour"
                    : null;
          const fill = hora.watch === "night" ? "#1c1712" : "#efe6d6";
          const stroke = pin ? "#7a3328" : "#c4b496";
          const text = hora.watch === "night" ? "#f6f0e4" : "#1c1712";
          return (
            <g
              key={hora.letter}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={onSelect ? () => onSelect(hora.letter) : undefined}
            >
              <circle cx={x} cy={y} r={pin ? 12 : 8} fill={fill} stroke={stroke} strokeWidth={pin ? 2 : 1} />
              <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill={text} fontFamily="Fraunces, serif">
                {hora.letter}
              </text>
            </g>
          );
        })}
        <text x={cx} y={24} textAnchor="middle" fontSize="9" fill="currentColor" className="text-muted" fontFamily="Fraunces, serif">
          sunset
        </text>
      </svg>
      <p className="mt-2 text-center text-xs text-muted">
        Night is dark. Day is light. Sunset at the top.
        {first ? ` First ${first}` : ""}
        {last ? ` · last ${last}` : ""}
        {daimon ? ` · daimon ${daimon}` : ""}
        {hour ? ` · this hour ${hour}` : ""}
      </p>
    </div>
  );
}
