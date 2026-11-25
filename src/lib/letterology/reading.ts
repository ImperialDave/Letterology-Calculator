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

/** What the manner adjective means in ordinary words. */
const WAY_MEANS: Record<Letter, string> = {
  A: "you take the first real step",
  B: "you stay with one person, habit, or promise",
  C: "you make the change where people can see it",
  D: "you wait until a private decision is actually true",
  E: "you widen the job past the argument in front of you",
  F: "you start before the excuses are ready",
  G: "you stay through the boring middle",
  H: "you say the long view in words a person can use",
  I: "you make the thought true before you share it",
  J: "you take the next step before the prize is visible",
  K: "you do the work beside one specific person",
  L: "you put your attention where you said it belongs",
  M: "you move, and then you stop",
  N: "you notice before you try to fix",
  O: "you let a guest in without losing the room",
  P: "you turn a wish into days you actually keep",
  Q: "you refuse the cheap version of the truth",
  R: "you say the real feeling, not the charming one",
  S: "you connect people and let the connection settle",
  T: "you stop living inside a story that is finished",
  U: "you keep both honest sides in the room",
  V: "you describe a direction someone can walk toward",
  W: "you look again, and then you act",
  X: "you bring the missing piece, then help clean up",
  Y: "you bend, and you keep one promise",
  Z: "you finish the push and come back to a normal day",
};

/** What the place name means in ordinary words. */
const PLACE_MEANS: Record<Letter, string> = {
  A: "the gap between the life you have and the life you want",
  B: "a place where a person can rest",
  C: "the first clean break with a bad rule",
  D: "a quiet place where you see what is true",
  E: "the next real place, not an excuse to never arrive",
  F: "the opening you choose before you feel ready",
  G: "the work you keep alive after the excitement fades",
  H: "the long view that should shape today's tasks",
  I: "a small clear light you then share",
  J: "the hard miles, including the trip home",
  K: "the table where one more person can belong",
  L: "the one person or thing that gets your real attention",
  M: "the work you show up for again tomorrow",
  N: "the slow care that helps things grow",
  O: "the calm room where people can tell the truth",
  P: "the responsibility, not the costume",
  Q: "the quiet place where you stay with one question",
  R: "the true feeling people can actually live with",
  S: "the join between people who need each other",
  T: "the change that ends what is over and keeps what helps",
  U: "a bowl big enough for a real disagreement",
  V: "the clear picture, before you announce it",
  W: "a fresh look that you then act on",
  X: "the honest spot outside the old rules",
  Y: "a real choice you still have to make",
  Z: "one high goal you visit and then leave",
};

function splitBeat(line: string): { advice: string; risk: string } {
  const mark = " If you don't, ";
  const cut = line.indexOf(mark);
  if (cut < 0) return { advice: line, risk: line };
  const advice = line.slice(0, cut).trim();
  let risk = line.slice(cut + mark.length).trim();
  risk = `${risk.charAt(0).toUpperCase()}${risk.slice(1)}`;
  return {
    advice: advice.endsWith(".") ? advice : `${advice}.`,
    risk,
  };
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
    unique.push(
      `All three seats are the ${role.noun}. There is no second way of working and no second place. Follow the warning once, and finish one thing.`,
    );
  } else if (x === y) {
    unique.push(
      `Your role and your way of working are both the ${role.noun}. The new part is the place, the ${houseOf(z).realm}. Give that place one job the other two do not do.`,
    );
  } else if (x === z) {
    unique.push(
      `You are the ${role.noun}, and the place is that same house. The new part is the ${manner.adj.toLowerCase()} way you work. Use that way on purpose this week.`,
    );
  } else if (y === z) {
    unique.push(
      `The way you work and the place are both the ${manner.noun}. The new part is your role, the ${role.noun}. Let that role do one thing the other two do not.`,
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
  const abSplit = splitBeat(ab);
  const acSplit = splitBeat(ac);
  const bcSplit = splitBeat(bc);
  const shadow =
    ab === bc
      ? `The mistake looks like this. ${abSplit.risk} It shows up twice. That is the whole problem.`
      : `The mistake looks like this. ${abSplit.risk} You will see that at the ${field.realm}. ${bcSplit.risk}`;
  const gold =
    acSplit.advice === acSplit.risk
      ? `Use the warning as the assignment. ${acSplit.advice} Do this in ${way(manner.adj)} this week.`
      : `The part you can trust is this. ${acSplit.advice} Do this in ${way(manner.adj)} this week.`;
  const invitation = `${role.invitation} Do this in ${way(manner.adj)}: ${WAY_MEANS[y]}. Keep the work at the ${field.realm}, ${PLACE_MEANS[z]}.`;
  const portrait = `You are the ${role.noun}. You work in ${way(manner.adj)}: ${WAY_MEANS[y]}. The place is the ${field.realm}, ${PLACE_MEANS[z]}. Here is what to do. ${together}`;
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
