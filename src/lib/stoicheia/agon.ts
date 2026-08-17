import { readStoicheion, type Stoicheion } from "./engine";

export type Prize = {
  name: string;
  holder: "a" | "b" | "tie";
  line: string;
};

export type AgonReading = {
  a: Stoicheion;
  b: Stoicheion;
  title: string;
  prizes: Prize[];
};

function hold(aVal: number, bVal: number): "a" | "b" | "tie" {
  if (aVal === bVal) return "tie";
  return aVal > bVal ? "a" : "b";
}

export function readAgon(rawA: string, rawB: string): AgonReading | null {
  const a = readStoicheion(rawA);
  const b = readStoicheion(rawB);
  if (!a || !b) return null;
  const name = (who: "a" | "b" | "tie") => (who === "tie" ? "neither — they share it" : who === "a" ? a.raw : b.raw);

  const prizes: Prize[] = [
    {
      name: "Heavier total",
      holder: hold(a.sum, b.sum),
      line: `${name(hold(a.sum, b.sum))} holds the heavier total.`,
    },
    {
      name: "Longer hymn",
      holder: hold(a.hymn.length, b.hymn.length),
      line: `${name(hold(a.hymn.length, b.hymn.length))} sings the longer vowel sequence.`,
    },
    {
      name: "Closed road",
      holder: a.road.closed === b.road.closed ? "tie" : a.road.closed ? "a" : "b",
      line:
        a.road.closed === b.road.closed
          ? a.road.closed
            ? "Both roads return."
            : "Neither road is closed."
          : `${a.road.closed ? a.raw : b.raw} returns to the first hour.`,
    },
    {
      name: "Night entrance",
      holder:
        a.road.first.watch === b.road.first.watch ? "tie" : a.road.first.watch === "night" ? "a" : "b",
      line:
        a.road.first.watch === b.road.first.watch
          ? `Both enter in the ${a.road.first.watch} watch.`
          : `${a.road.first.watch === "night" ? a.raw : b.raw} enters in the night watch.`,
    },
    {
      name: "Likeness",
      holder: hold(a.likeness.score, b.likeness.score),
      line: `${name(hold(a.likeness.score, b.likeness.score))} is more like itself.`,
    },
    {
      name: "Bound",
      holder:
        a.tightness.state === b.tightness.state
          ? "tie"
          : a.tightness.state === "bound"
            ? "a"
            : b.tightness.state === "bound"
              ? "b"
              : a.tightness.state === "held"
                ? "a"
                : "b",
      line:
        a.tightness.state === b.tightness.state
          ? `Both are ${a.tightness.state}.`
          : `${a.tightness.state === "bound" ? a.raw : b.tightness.state === "bound" ? b.raw : a.tightness.state === "held" ? a.raw : b.raw} is the tighter name.`,
    },
  ];

  return {
    a,
    b,
    title: `The contest of ${a.raw} and ${b.raw}`,
    prizes,
  };
}
