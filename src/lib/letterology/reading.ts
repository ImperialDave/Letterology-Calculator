import { houseOf } from "./archetypes";
import { pairLine } from "./pairs";
import type { Letter, Triad } from "./types";

export interface PathReading {
  triad: Triad;
  code: string;
  role: string;
  manner: string;
  field: string;
  together: string;
  shadow: string;
  gold: string;
  invitation: string;
  portrait: string;
  full: string;
}

export function pairBeat(from: Letter, to: Letter): string {
  if (from === to) return houseOf(from).doubled;
  const line = pairLine(from, to);
  if (!line) throw new Error(`Missing pair ${from}${to}`);
  return line;
}

function way(adjective: string): string {
  const word = adjective.toLowerCase();
  const article = /^[aeiou]/.test(word) ? "an" : "a";
  return `${article} ${word} way`;
}

function togetherLines(triad: Triad): string[] {
  const [x, y, z] = triad;
  const raw = [pairBeat(x, y), pairBeat(x, z), pairBeat(y, z)];
  const unique: string[] = [];
  for (const line of raw) {
    if (!unique.includes(line)) unique.push(line);
  }
  const role = houseOf(x);
  const manner = houseOf(y);
  if (x === y && y === z) {
    unique.push(`All three seats are the ${role.noun}, so there is no second method and no second room.`);
  } else if (x === y) {
    unique.push(
      `Role and manner are both the ${role.noun}. The ${houseOf(z).realm} is the other room, and it has to carry the difference.`,
    );
  } else if (x === z) {
    unique.push(
      `The role and the realm are the same house, ${role.house}. The ${manner.adj.toLowerCase()} method is the only other seat.`,
    );
  } else if (y === z) {
    unique.push(
      `Manner and realm both belong to the ${manner.noun}. The ${role.noun} is the only other will in the path.`,
    );
  }
  return unique;
}

export function readingOf(triad: Triad): PathReading {
  const [x, y, z] = triad;
  const role = houseOf(x);
  const manner = houseOf(y);
  const field = houseOf(z);
  const ab = pairBeat(x, y);
  const ac = pairBeat(x, z);
  const bc = pairBeat(y, z);
  const lines = togetherLines(triad);
  const together = lines.join(" ");
  const shadow =
    ab === bc
      ? `${ab} Repeated, that is the whole risk.`
      : `${ab} That mistake lands in the ${field.realm}. ${bc}`;
  const gold = `${ac} Done in ${way(manner.adj)}, the path can be used.`;
  const invitation = `${role.invitation} Work in ${way(manner.adj)}, and keep it in the ${field.realm}.`;
  const portrait = `${role.noun} work, done in ${way(manner.adj)}, in the ${field.realm}. ${together}`;
  const full = [
    `Role: ${role.noun}.`,
    role.calling,
    `How: ${manner.noun}.`,
    manner.method,
    `Where: the ${field.realm}.`,
    field.field,
    together,
    shadow,
    gold,
    invitation,
  ].join(" ");
  return {
    triad,
    code: triad.join(""),
    role: role.calling,
    manner: manner.method,
    field: field.field,
    together,
    shadow,
    gold,
    invitation,
    portrait,
    full,
  };
}
