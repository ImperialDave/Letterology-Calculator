/**
 * Ask — handle + question → a polarized answer from Path and today's court.
 *
 * Materials
 *   1. Letterize the username. First letter is the role; next two by weight are how and where.
 *   2. Strip the interrogative scaffold (should I, will, how, when…). Letterize what remains.
 *      That remainder is the matter of the question. Its first letter is the question's house.
 *   3. Today's court: date-letter, allies (warm), enemies (withdrawn). Luck is willingness.
 *
 * Four gates
 *   Role    question house vs their house     (heaviest)
 *   Method  question manner vs their manner
 *   Place   question field vs their field
 *   Court   is the question's house warm, contrary, or quiet today
 *
 * Polarize
 *   Push the score away from 50. Then four verdicts, no mush:
 *     yea  ≥ 64   Yes. Do it.
 *     lean ≥ 50   Yes, one reversible step — only if the court is not contrary
 *                 and the houses are not enemies. Otherwise hold.
 *     hold ≥ 36   Not today.
 *     nay  < 36   No as written. Reframe.
 *
 * Mood
 *   The first words choose the shape of the answer (yes/no, should, will, can,
 *   when, how, who, where, why). "A or B" is a fork: score both, pick the higher.
 *
 * Ethic
 *   Willingness, not fate. The decision is still theirs.
 */
import { houseOf } from "./archetypes";
import { almanacOf, type AlmanacDay, type CivilDate } from "./calendar";
import { buildHoroscope } from "./engine";
import { themeOf } from "./lexicon";
import { actCounselOf, letterCurrent, letterMeet, luckOf, type LuckReading } from "./luck";
import type { Horoscope, Letter } from "./types";

export type AskMood =
  | "yesno"
  | "should"
  | "will"
  | "can"
  | "when"
  | "how"
  | "who"
  | "where"
  | "why"
  | "fork";

export type AskVerdict = "yea" | "lean" | "hold" | "nay";
export type AskMeet = "same" | "ally" | "enemy" | "none";
export type AskCourt = "favorable" | "contrary" | "quiet";

export interface AskGates {
  role: AskMeet;
  method: AskMeet;
  place: AskMeet;
  court: AskCourt;
}

export interface AskSide {
  matter: string;
  letter: Letter;
  noun: string;
  score: number;
}

export interface AskReading {
  handle: string;
  question: string;
  matter: string;
  mood: AskMood;
  path: [Letter, Letter, Letter];
  queryPath: [Letter, Letter, Letter];
  queryLetter: Letter;
  queryHouse: string;
  queryNoun: string;
  luckScore: number;
  luckBand: LuckReading["band"];
  luckVerdict: string;
  dateLetter: Letter;
  gates: AskGates;
  score: number;
  verdict: AskVerdict;
  answer: string;
  why: string;
  charge: string;
  ask: string;
  fork?: { a: AskSide; b: AskSide; pick: "a" | "b" };
}

const PREFIXES = [
  /^should i\s+/i,
  /^should we\s+/i,
  /^should\s+/i,
  /^ought i to\s+/i,
  /^ought i\s+/i,
  /^will i\s+/i,
  /^will we\s+/i,
  /^will\s+/i,
  /^am i going to\s+/i,
  /^am i gonna\s+/i,
  /^are we going to\s+/i,
  /^can i\s+/i,
  /^could i\s+/i,
  /^can we\s+/i,
  /^can\s+/i,
  /^how should i\s+/i,
  /^how do i\s+/i,
  /^how can i\s+/i,
  /^how\s+/i,
  /^when should i\s+/i,
  /^when will i\s+/i,
  /^when do i\s+/i,
  /^when\s+/i,
  /^who should i\s+/i,
  /^who will\s+/i,
  /^who\s+/i,
  /^where should i\s+/i,
  /^where\s+/i,
  /^why did i\s+/i,
  /^why should i\s+/i,
  /^why\s+/i,
  /^what if i\s+/i,
  /^what if\s+/i,
  /^do i\s+/i,
  /^is it\s+/i,
  /^is this\s+/i,
  /^am i able to\s+/i,
];

export function classifyMood(raw: string): AskMood {
  const q = raw.trim().toLowerCase().replace(/[?!.]+$/g, "");
  const parts = q.split(/\s+or\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2) return "fork";
  if (/^(when|how soon)\b/.test(q)) return "when";
  if (/^how\b/.test(q)) return "how";
  if (/^(who|whom|whose)\b/.test(q)) return "who";
  if (/^where\b/.test(q)) return "where";
  if (/^why\b/.test(q)) return "why";
  if (/^(will|am i going|gonna|going to)\b/.test(q)) return "will";
  if (/^(can|could|am i able)\b/.test(q)) return "can";
  if (/^(should|ought|must|do i need)\b/.test(q)) return "should";
  return "yesno";
}

export function stripScaffold(raw: string): string {
  let next = raw.trim().replace(/[?!.]+$/g, "").replace(/^['"]+|['"]+$/g, "");
  for (const prefix of PREFIXES) {
    if (prefix.test(next)) {
      next = next.replace(prefix, "");
      break;
    }
  }
  return next.replace(/\s+/g, " ").trim();
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function polarize(raw: number): number {
  return clamp(50 + (raw - 50) * 1.4);
}

function meetPoints(meet: AskMeet): number {
  if (meet === "same") return 22;
  if (meet === "ally") return 14;
  if (meet === "enemy") return -16;
  return 0;
}

function courtPoints(court: AskCourt): number {
  if (court === "favorable") return 20;
  if (court === "contrary") return -20;
  return 0;
}

function bandPoints(band: LuckReading["band"]): number {
  if (band === "open") return 12;
  if (band === "warm") return 7;
  if (band === "workable") return 2;
  if (band === "mixed") return -2;
  if (band === "contrary") return -10;
  return -16;
}

function verdictOf(score: number, gates: AskGates): AskVerdict {
  if (score >= 64) return "yea";
  if (score >= 50) {
    if (gates.court === "contrary" || gates.role === "enemy") return "hold";
    return "lean";
  }
  if (score >= 36) return "hold";
  return "nay";
}

function fitWord(meet: AskMeet): string {
  if (meet === "same") return "the same house";
  if (meet === "ally") return "an ally";
  if (meet === "enemy") return "a known opponent";
  return "a foreign house";
}

function composeAnswer(input: {
  mood: AskMood;
  verdict: AskVerdict;
  youNoun: string;
  qNoun: string;
  qLetter: Letter;
  youLetter: Letter;
  mannerNoun: string;
  fieldRealm: string;
  gates: AskGates;
  counsel: { lean: string; wait: string };
  favorable: Letter[];
  dateLetter: Letter;
}): string {
  const { mood, verdict, youNoun, qNoun, qLetter, youLetter, mannerNoun, fieldRealm, gates, counsel, favorable } =
    input;

  if (verdict === "nay") {
    const warm = favorable.slice(0, 3).join(" ");
    return `No as written. Rewrite it so it starts from ${youLetter} (${youNoun}) or a warm letter today (${warm}).`;
  }
  if (verdict === "hold") {
    return `Not today. ${qLetter} (${qNoun}) is ${gates.court === "contrary" ? "withdrawn" : "unwilling"} in this court.`;
  }

  const small = verdict === "lean" ? " One reversible step." : "";

  if (mood === "when") {
    return verdict === "yea" ? `Now. Before the court cools.` : `Today, if you keep it small.${small}`;
  }
  if (mood === "how") {
    return `Do it as the ${mannerNoun}: ${counsel.lean}.${small}`;
  }
  if (mood === "who") {
    return `A ${qNoun} (${qLetter}). That house holds the answer.${small}`;
  }
  if (mood === "where") {
    return `In the ${fieldRealm}.${small}`;
  }
  if (mood === "why") {
    return `Because ${qLetter} meets your ${youLetter} as ${fitWord(gates.role)}, and today ${qLetter} runs ${gates.court}.${small}`;
  }
  if (mood === "will") {
    return verdict === "yea" ? `Willing. The court is open to this.` : `Willing, if you keep it small.${small}`;
  }
  if (mood === "can") {
    return gates.role === "none"
      ? `You can, as a guest — not as the ${youNoun}.${small}`
      : `You can. The Path already knows this house.${small}`;
  }
  if (mood === "should") {
    return verdict === "yea"
      ? `Yes. ${qNoun} work is your kind of move today.`
      : `Yes, small. ${qNoun} work, kept reversible.${small}`;
  }
  return verdict === "yea" ? `Yes. The letters of this question run warm.` : `Yes, if you keep it small.${small}`;
}

function scoreQuery(portrait: Horoscope, query: Horoscope, luck: LuckReading): {
  gates: AskGates;
  score: number;
  verdict: AskVerdict;
} {
  const present = new Set(portrait.inventory.map((item) => item.letter));
  const role = letterMeet(query.triad[0], portrait.triad[0]);
  const method = letterMeet(query.triad[1], portrait.triad[1]);
  const place = letterMeet(query.triad[2], portrait.triad[2]);
  const court = letterCurrent(query.signature, luck.favorable, luck.contrary);
  const gates: AskGates = { role, method, place, court };

  let raw = 50;
  raw += meetPoints(role);
  raw += meetPoints(method) * 0.55;
  raw += meetPoints(place) * 0.4;
  raw += courtPoints(court);
  raw += bandPoints(luck.band);
  if (present.has(query.signature)) raw += 6;
  if (query.signature === luck.dateLetter) raw += 10;
  if (court === "favorable" && present.has(query.signature)) raw += 4;
  if (role === "enemy" && court === "contrary") raw -= 8;

  const score = polarize(raw);
  return { gates, score, verdict: verdictOf(score, gates) };
}

function whyLine(
  portrait: Horoscope,
  query: Horoscope,
  luck: LuckReading,
  gates: AskGates,
  matter: string,
): string {
  const you = houseOf(portrait.signature);
  const q = houseOf(query.signature);
  const carried = portrait.inventory.some((item) => item.letter === query.signature)
    ? `${query.signature} is already in the handle.`
    : `${query.signature} is not in the handle, so treat the question as a guest.`;
  return `We read ${portrait.displayName} as ${portrait.triad.join("")} (${you.noun}). The matter is “${matter}”, first letter ${query.signature} (${q.noun}) — ${fitWord(gates.role)} to your role. Today is ${luck.dateLetter}; ${query.signature} runs ${gates.court}. Luck ${luck.score} · ${luck.verdict}. ${carried}`;
}

function chargeLine(verdict: AskVerdict, queryLetter: Letter, youLetter: Letter, luck: LuckReading): string {
  if (verdict === "yea" || verdict === "lean") {
    return `Do this: ${actCounselOf(queryLetter).lean}.`;
  }
  if (verdict === "hold") {
    return `Wait on ${actCounselOf(queryLetter).wait}. Check the court tomorrow.`;
  }
  const warm = luck.favorable[0] ?? youLetter;
  return `Reframe toward ${youLetter} or ${warm}. Do not ${actCounselOf(queryLetter).wait}.`;
}

export function ask(
  handleRaw: string,
  questionRaw: string,
  date: Date | CivilDate | AlmanacDay = new Date(),
): AskReading | null {
  const portrait = buildHoroscope(handleRaw);
  if (!portrait) return null;
  const question = questionRaw.trim();
  if (!question) return null;

  const mood = classifyMood(question);
  const day = "dateLetter" in date && "iso" in date ? date : almanacOf(date);
  const luck = luckOf(portrait, day);

  if (mood === "fork") {
    const parts = question
      .trim()
      .replace(/[?!.]+$/g, "")
      .split(/\s+or\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 2) {
      const left = ask(handleRaw, parts[0]!, day);
      const right = ask(handleRaw, parts[1]!, day);
      if (left && right) {
        const pick: "a" | "b" =
          right.score > left.score
            ? "b"
            : left.score > right.score
              ? "a"
              : right.gates.court === "favorable" && left.gates.court !== "favorable"
                ? "b"
                : "a";
        const win = pick === "a" ? left : right;
        const lose = pick === "a" ? right : left;
        const fork = {
          a: { matter: left.matter, letter: left.queryLetter, noun: left.queryNoun, score: left.score },
          b: { matter: right.matter, letter: right.queryLetter, noun: right.queryNoun, score: right.score },
          pick,
        };
        const answer = `${win.matter}, not ${lose.matter}.`;
        return {
          ...win,
          question,
          mood: "fork",
          answer,
          why: `${win.why} Fork: “${left.matter}” (${left.queryLetter}, ${left.score}) against “${right.matter}” (${right.queryLetter}, ${right.score}).`,
          charge: win.charge,
          fork,
        };
      }
    }
  }

  const matter = stripScaffold(question) || question;
  const query = buildHoroscope(matter) ?? buildHoroscope(question);
  if (!query) return null;

  const { gates, score, verdict } = scoreQuery(portrait, query, luck);
  const you = houseOf(portrait.signature);
  const q = houseOf(query.signature);
  const manner = houseOf(query.triad[1]);
  const field = houseOf(query.triad[2]);
  const counsel = actCounselOf(query.signature);
  const askWho = luck.counsel.ask;

  return {
    handle: portrait.displayName,
    question,
    matter,
    mood: mood === "fork" ? "yesno" : mood,
    path: portrait.triad,
    queryPath: query.triad,
    queryLetter: query.signature,
    queryHouse: q.house,
    queryNoun: q.noun,
    luckScore: luck.score,
    luckBand: luck.band,
    luckVerdict: luck.verdict,
    dateLetter: luck.dateLetter,
    gates,
    score,
    verdict,
    answer: composeAnswer({
      mood: mood === "fork" ? "yesno" : mood,
      verdict,
      youNoun: you.noun,
      qNoun: q.noun,
      qLetter: query.signature,
      youLetter: portrait.signature,
      mannerNoun: manner.noun,
      fieldRealm: field.realm,
      gates,
      counsel,
      favorable: luck.favorable,
      dateLetter: luck.dateLetter,
    }),
    why: whyLine(portrait, query, luck, gates, matter),
    charge: chargeLine(verdict, query.signature, portrait.signature, luck),
    ask: askWho,
  };
}

export function tweetAsk(reading: AskReading): string {
  const mark = reading.verdict === "yea" || reading.verdict === "lean" ? "Yes" : reading.verdict === "hold" ? "Not today" : "No";
  return `${reading.handle}\n${reading.question}\n${mark}. ${reading.answer}`;
}

export function askPath(handle = "", question = ""): string {
  const query = new URLSearchParams();
  if (handle.trim()) query.set("n", handle.trim());
  if (question.trim()) query.set("q", question.trim());
  const next = query.toString();
  return next ? `/ask?${next}` : "/ask";
}
