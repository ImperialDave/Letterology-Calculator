/** Campaign voice. Glyphbound letters. Never Nintendo names. */

export type CrewId = "c" | "s" | "e" | "b" | "!";

export const CREW: Record<
  string,
  { mark: string; title: string; job: string; color: string; portrait: string }
> = {
  c: {
    mark: "c",
    title: "c",
    job: "The letter that would not stand in line.",
    color: "#e8d48a",
    portrait: "/glyphbound/sortie/crew/c.jpg",
  },
  s: {
    mark: "s",
    title: "Gale",
    job: "Reads the hole. Will not fly the wall.",
    color: "#7fd0ff",
    portrait: "/glyphbound/sortie/crew/s.jpg",
  },
  e: {
    mark: "e",
    title: "Well",
    job: "Reads the hull. The most written, the least far.",
    color: "#6ec8e8",
    portrait: "/glyphbound/sortie/crew/e.jpg",
  },
  b: {
    mark: "b",
    title: "Brace",
    job: "Reads the ground. The door that learned to fly.",
    color: "#c4b49a",
    portrait: "/glyphbound/sortie/crew/b.jpg",
  },
  "!": {
    mark: "!",
    title: "Dualis",
    job: "The count that files the sky.",
    color: "#d45a4a",
    portrait: "/glyphbound/sortie/crew/dualis.jpg",
  },
};

export const CAMPAIGN =
  "Dualis is filing the sky into a count. Six ledgers make a sentence. Write them before the Press closes.";

export const CREW_LINE: CrewId[] = ["c", "s", "e", "b"];

export function crewOf(who: string) {
  if (who === "dualis") return CREW["!"];
  return CREW[who] ?? CREW.s;
}
