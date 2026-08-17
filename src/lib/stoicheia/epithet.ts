import type { Axis } from "./axis";
import type { Hora } from "./horae";
import type { HymnMotion } from "./motion";

function realmWord(realm: string): string {
  const last = realm.replace(/^the\s+/, "").split(" ")[0] ?? "end";
  return last;
}

function hymnShape(
  faces: { face: string }[],
  motion: HymnMotion,
): string {
  if (faces.length === 0) return "silent of vowels";
  if (faces.length === 1) return `once-${faces[0]?.face}`;
  const last = faces[faces.length - 1]?.face ?? "the choir";
  const prev = faces[faces.length - 2]?.face;
  if (prev && prev === last) return `twice-${last}`;
  if (motion === "ascent") return `climbing-to-${last}`;
  if (motion === "descent") return `falling-to-${last}`;
  if (motion === "periodos") return "circling";
  return `sung-${last}`;
}

export function epithetOf(input: {
  first: Hora;
  last: Hora;
  axis: Axis;
  hymn: { face: string }[];
  motion: HymnMotion;
}): string {
  const start = input.axis.closed
    ? `${input.first.noun}-returning`
    : input.first.watch === "night"
      ? `${input.first.noun}-starting`
      : `${input.first.noun}-rising`;
  const middle = hymnShape(input.hymn, input.motion);
  const end = `${realmWord(input.last.realm)}-finishing`;
  return `${start}, ${middle}, ${end}`;
}
