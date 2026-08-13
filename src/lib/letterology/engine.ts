import { findTension, LEXICON, themeOf } from "./lexicon";
import { alliesOf, bondCopy, enemiesOf } from "./circle";
import { almanacOf } from "./calendar";
import { archetypeOf, houseOf, pickTriad } from "./archetypes";
import type {
  Horoscope,
  Letter,
  LetterInventory,
  NamePart,
  TensionPair,
} from "./types";
import { ALPHABET, VOWEL_LETTERS } from "./types";

const FOLDS: Record<string, string> = {
  Æ: "AE",
  æ: "AE",
  Œ: "OE",
  œ: "OE",
  Ø: "O",
  ø: "O",
  Ð: "D",
  ð: "D",
  Þ: "TH",
  þ: "TH",
  ß: "SS",
  Ł: "L",
  ł: "L",
  Đ: "D",
  đ: "D",
};

export function foldCharacters(raw: string): string {
  let out = "";
  for (const ch of raw) {
    out += FOLDS[ch] ?? ch;
  }
  return out.normalize("NFD").replace(/\p{M}/gu, "");
}

export function parseName(raw: string): { displayName: string; parts: NamePart[] } {
  const displayName = raw.trim().replace(/\s+/g, " ");
  const folded = foldCharacters(displayName);
  const tokens = folded.split(/[^A-Za-z]+/).filter(Boolean);
  const parts: NamePart[] = tokens
    .map((token) => ({
      original: token,
      letters: token.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((p) => p.letters.length > 0);
  return { displayName, parts };
}

function isVowelInPart(letter: Letter, indexInPart: number): boolean {
  if (VOWEL_LETTERS.has(letter)) return true;
  if (letter === "Y") return indexInPart > 0;
  return false;
}

export function scoreParts(parts: NamePart[]): LetterInventory[] {
  const byLetter = new Map<Letter, LetterInventory>();
  let globalIndex = 0;

  parts.forEach((part, partIndex) => {
    const chars = [...part.letters];
    chars.forEach((letter, i) => {
      const isSignature = partIndex === 0 && i === 0;
      const isInitial = i === 0;
      const isFinal = i === chars.length - 1 && chars.length > 1;
      let weight = 1;
      if (isSignature) weight += 1.6;
      else if (isInitial) weight += 0.8;
      if (isFinal) weight += 0.25;

      const existing = byLetter.get(letter);
      if (existing) {
        existing.count += 1;
        existing.weight += weight;
        existing.isSignature = existing.isSignature || isSignature;
        existing.isInitial = existing.isInitial || isInitial;
        existing.isVowel = existing.isVowel || isVowelInPart(letter, i);
      } else {
        byLetter.set(letter, {
          letter,
          count: 1,
          weight: Math.round(weight * 100) / 100,
          firstIndex: globalIndex,
          isVowel: isVowelInPart(letter, i),
          isSignature,
          isInitial,
        });
      }
      globalIndex += 1;
    });
  });

  return [...byLetter.values()].sort(compareInventory);
}

function compareInventory(a: LetterInventory, b: LetterInventory): number {
  if (b.weight !== a.weight) return b.weight - a.weight;
  if (a.isSignature !== b.isSignature) return a.isSignature ? -1 : 1;
  return a.firstIndex - b.firstIndex;
}

function splitCircle(ranked: LetterInventory[], signature: Letter) {
  const present = new Set(ranked.map((item) => item.letter));
  const allies = alliesOf(signature);
  const enemies = enemiesOf(signature);
  return {
    allies: [...allies],
    enemies: [...enemies],
    kinPresent: allies.filter((letter) => present.has(letter)),
    kinAbsent: allies.filter((letter) => !present.has(letter)),
    crossPresent: enemies.filter((letter) => present.has(letter)),
    crossAbsent: enemies.filter((letter) => !present.has(letter)),
  };
}

function pickTension(
  ranked: LetterInventory[],
  signature: Letter,
  crossPresent: Letter[],
): TensionPair | null {
  const living = crossPresent[0];
  if (living) {
    const aHouse = houseOf(signature).noun;
    const bHouse = houseOf(living).noun;
    return {
      a: signature,
      b: living,
      title: `${aHouse} and ${bHouse}`,
      copy: bondCopy(signature, living, "enemy"),
    };
  }

  const top = ranked.slice(0, 6);
  let best: { pair: TensionPair; score: number } | null = null;
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const pair = findTension(top[i].letter, top[j].letter);
      if (!pair) continue;
      const score = top[i].weight + top[j].weight - i * 0.15 - j * 0.15;
      if (!best || score > best.score) best = { pair, score };
    }
  }
  return best?.pair ?? null;
}

function pickAbsentSeats(kinAbsent: Letter[], crossAbsent: Letter[], primary: Letter): Letter[] {
  const out: Letter[] = [];
  for (const letter of [...kinAbsent, ...crossAbsent]) {
    if (!out.includes(letter)) out.push(letter);
    if (out.length >= 2) break;
  }
  if (out.length < 2) {
    for (const letter of ALPHABET) {
      if (letter === primary || out.includes(letter)) continue;
      out.push(letter);
      if (out.length >= 2) break;
    }
  }
  return out.slice(0, 2);
}

function possessive(name: string): string {
  if (!name) return "This name's";
  return name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function listHouses(letters: Letter[]): string {
  return letters.map((letter) => `${houseOf(letter).noun} (${letter})`).join(", ");
}

export function buildHoroscope(rawName: string, now = new Date()): Horoscope | null {
  const { displayName, parts } = parseName(rawName);
  const inventory = scoreParts(parts);
  if (inventory.length === 0) return null;

  const primary = inventory[0];
  const secondaries = inventory.slice(1, 4);
  const gifts = [primary, ...secondaries.slice(0, 2)].map((x) => x.letter);
  const signature = inventory.find((x) => x.isSignature)?.letter ?? primary.letter;
  const circle = splitCircle(inventory, signature);
  const tension = pickTension(inventory, signature, circle.crossPresent);
  const shadows = pickAbsentSeats(circle.kinAbsent, circle.crossAbsent, primary.letter);
  const vowels = inventory.filter((x) => x.isVowel);
  const consonants = inventory.filter((x) => !x.isVowel);

  const almanac = almanacOf(now);
  const daily = almanac.dateLetter;
  const period = almanac.fortnight.letter;

  const p = themeOf(primary.letter);
  const g1 = themeOf(gifts[0]);
  const g2 = gifts[1] ? themeOf(gifts[1]) : null;
  const g3 = gifts[2] ? themeOf(gifts[2]) : null;
  const s1 = themeOf(shadows[0]);
  const s2 = shadows[1] ? themeOf(shadows[1]) : null;
  const dailyTheme = themeOf(daily);
  const periodTheme = themeOf(period);

  const vowelLead = vowels[0] ? themeOf(vowels[0].letter) : null;
  const consLead = consonants[0] ? themeOf(consonants[0].letter) : null;

  const primaryStatement = `${possessive(displayName)} signature pressure is ${p.name} — ${article(p.name)} ${p.name.toLowerCase()} field gathered around ${primary.letter}. ${p.essence}`;

  const giftBits = [g1, g2, g3].filter(Boolean).map((t) => `${t!.letter} (${t!.name.toLowerCase()})`);
  const giftsStatement = g2
    ? `The letters ${giftBits.join(", ")} keep company in this name. ${g1.gift} ${g2.gift}`
    : g1.gift;

  const challengeStatement = tension
    ? `${tension.copy} ${circle.kinAbsent[0] ? `Meanwhile the unused ally of ${houseOf(circle.kinAbsent[0]).house} waits as practice, not as lack: ${themeOf(circle.kinAbsent[0]).invitation}` : ""}`.trim()
    : s2
      ? `A growth edge appears where ${s1.name.toLowerCase()} and ${s2.name.toLowerCase()} are nearly silent. ${s1.invitation} ${s2.invitation}`
      : s1.challenge;

  const innerNote = vowelLead
    ? `Vowels in this name lean toward ${vowelLead.name.toLowerCase()}: ${vowelLead.inner}`
    : "This name carries almost no vowel field — a rare, highly articulated outer signature.";
  const outerNote = consLead
    ? `Consonants speak of ${consLead.name.toLowerCase()} in the outer life: ${consLead.outer}`
    : "This name is almost all vowel — an unusually inward constellation.";

  const triad = pickTriad(inventory, signature);
  const archetype = archetypeOf(triad);
  const kindred = circle.allies.map((letter) => archetypeOf([letter, triad[1], triad[2]]));
  const mannerTheme = themeOf(triad[1]);
  const fieldTheme = themeOf(triad[2]);

  const methodStatement = `The first letter of the first name sits the house (${signature}, ${houseOf(signature).noun}). The next two letters by weight set the manner (${triad[1]}, ${mannerTheme.name.toLowerCase()}) and the field (${triad[2]}, ${fieldTheme.name.toLowerCase()}).`;

  const wheelStatement = [
    circle.kinPresent.length
      ? `This name already carries allied seats: ${listHouses(circle.kinPresent)}.`
      : `None of the ${houseOf(signature).noun}'s allies appear in the letters — kinship is asked from outside the name.`,
    circle.crossPresent.length
      ? `The living cross is ${listHouses(circle.crossPresent)}.`
      : `The opposing seats are quiet in this name.`,
    circle.kinAbsent.length
      ? `Unlived allies remain: ${listHouses(circle.kinAbsent)}.`
      : `Every allied seat is already sounding.`,
  ].join(" ");

  const synthesis = [
    `${displayName} stands in the ${archetype.house} (${archetype.correspondence}). ${archetype.myth}`,
    tension
      ? `The characteristic pressure is ${tension.title.toLowerCase()}.`
      : p.invitation,
    `Notice where ${p.name.toLowerCase()} already shows up in ordinary days. Letterology is a mirror, not a forecast.`,
  ].join(" ");

  const lettersInName = inventory.map((item) => item.letter);
  const dailyInName = lettersInName.includes(daily);
  const periodHouse = houseOf(period);
  const dailyStatement = almanac.fortnight.hinge
    ? `Today is a hinge day — the Fool's gate between walks. The date still wears ${daily} (${dailyTheme.name}). ${dailyTheme.invitation}`
    : `Today's date letter is ${daily} — ${dailyTheme.name}${dailyInName ? ", which already lives in this name" : ", silent in this name"}. ${dailyTheme.invitation}`;
  const periodStatement = almanac.fortnight.hinge
    ? `The year is between circles. These leftover days belong to the Fool before the Seeker opens the walk again.`
    : `This fortnight the sun sits in ${period} — the ${periodHouse.house}, day ${almanac.fortnight.dayInSeat} of 14. ${periodTheme.invitation}`;

  return {
    displayName,
    normalized: parts.map((part) => part.letters).join(" "),
    parts,
    signature,
    primary,
    secondaries,
    inventory,
    vowels,
    consonants,
    tension,
    shadows,
    gifts,
    allies: circle.allies,
    enemies: circle.enemies,
    kinPresent: circle.kinPresent,
    kinAbsent: circle.kinAbsent,
    crossPresent: circle.crossPresent,
    crossAbsent: circle.crossAbsent,
    daily,
    period,
    triad,
    archetype,
    kindred,
    statements: {
      primary: primaryStatement,
      gifts: giftsStatement,
      challenge: challengeStatement,
      synthesis,
      method: methodStatement,
      wheel: wheelStatement,
      daily: dailyStatement,
      period: periodStatement,
      vowelNote: innerNote,
      consonantNote: outerNote,
    },
  };
}

export function readingAsText(h: Horoscope): string {
  const lines = [
    `Letterological Horoscope — ${h.displayName}`,
    `Normalized: ${h.normalized}`,
    "",
    `Signature letter: ${h.signature}`,
    `Primary: ${h.primary.letter} — ${themeOf(h.primary.letter).name}`,
    `Triad: ${h.archetype.code}`,
    `Archetype: ${h.archetype.title} (${h.archetype.house})`,
    `Method: ${h.statements.method}`,
    `Secondary: ${h.secondaries.map((s) => `${s.letter} (${themeOf(s.letter).name})`).join(", ") || "—"}`,
    h.tension ? `Tension: ${h.tension.title}` : "",
    `Allies: ${h.allies.join(", ")}`,
    `Enemies: ${h.enemies.join(", ")}`,
    `Unlived seats: ${h.shadows.map((s) => `${s} (${themeOf(s).name})`).join(", ")}`,
    `Date letter: ${h.daily} — ${themeOf(h.daily).name}`,
    `Fortnight: ${h.period} — ${themeOf(h.period).name}`,
    "",
    h.statements.primary,
    "",
    `${h.archetype.title}`,
    h.archetype.myth,
    h.archetype.correspondence,
    h.archetype.doctrine,
    h.archetype.portrait,
    `Shadow: ${h.archetype.shadow}`,
    `Gold: ${h.archetype.gold}`,
    "",
    h.statements.wheel,
    "",
    h.statements.gifts,
    "",
    h.statements.challenge,
    "",
    h.statements.synthesis,
    "",
    h.statements.vowelNote,
    h.statements.consonantNote,
    "",
    "This reading is reflective, not deterministic. The letters we carry are already speaking.",
  ];
  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}

export function letterPath(parts: NamePart[]): Letter[] {
  return parts.flatMap((p) => [...p.letters]);
}

export { LEXICON };
