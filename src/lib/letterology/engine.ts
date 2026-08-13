import { findTension, LEXICON, themeOf } from "./lexicon";
import { archetypeOf, kindredArchetypes, pickTriad } from "./archetypes";
import type {
  Horoscope,
  Letter,
  LetterInventory,
  NamePart,
  TensionPair,
} from "./types";
import { ALPHABET, MAJOR_FIELDS, VOWEL_LETTERS } from "./types";

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
  const parts: NamePart[] = tokens.map((token) => ({
    original: token,
    letters: token.toUpperCase().replace(/[^A-Z]/g, ""),
  })).filter((p) => p.letters.length > 0);
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

function pickTension(ranked: LetterInventory[]): TensionPair | null {
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

function pickShadows(ranked: LetterInventory[], primary: Letter): Letter[] {
  const present = new Set(ranked.map((r) => r.letter));
  const complements = themeOf(primary).complements.filter((l) => !present.has(l));
  const majors = MAJOR_FIELDS.filter((l) => l !== primary && !present.has(l));
  const out: Letter[] = [];
  for (const letter of [...complements, ...majors]) {
    if (!out.includes(letter)) out.push(letter);
    if (out.length >= 2) break;
  }
  if (out.length < 2) {
    for (const letter of ALPHABET) {
      if (letter === primary || present.has(letter) || out.includes(letter)) continue;
      out.push(letter);
      if (out.length >= 2) break;
    }
  }
  return out.slice(0, 2);
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekKey(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function pickRotating(letters: Letter[], salt: string, fallback: Letter): Letter {
  if (letters.length === 0) return fallback;
  return letters[hashString(salt) % letters.length] ?? fallback;
}

function possessive(name: string): string {
  if (!name) return "This name's";
  return name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function buildHoroscope(rawName: string, now = new Date()): Horoscope | null {
  const { displayName, parts } = parseName(rawName);
  const inventory = scoreParts(parts);
  if (inventory.length === 0) return null;

  const primary = inventory[0];
  const secondaries = inventory.slice(1, 4);
  const gifts = [primary, ...secondaries.slice(0, 2)].map((x) => x.letter);
  const tension = pickTension(inventory);
  const shadows = pickShadows(inventory, primary.letter);
  const signature = inventory.find((x) => x.isSignature)?.letter ?? primary.letter;
  const vowels = inventory.filter((x) => x.isVowel);
  const consonants = inventory.filter((x) => !x.isVowel);

  const lettersInName = inventory.map((x) => x.letter);
  const daily = pickRotating(lettersInName, `${dayKey(now)}:${displayName.toLowerCase()}`, primary.letter);
  const periodPool = (secondaries.length > 0 ? secondaries : inventory).map((x) => x.letter);
  const period = pickRotating(
    periodPool,
    `w${weekKey(now)}:${displayName.toLowerCase()}`,
    secondaries[0]?.letter ?? primary.letter,
  );

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
    ? `${tension.copy} ${s1 ? `Meanwhile the quieter field of ${s1.letter} — ${s1.name.toLowerCase()} — waits as a shadow invitation: ${s1.invitation}` : ""}`.trim()
    : s2
      ? `A growth edge appears where ${s1.name.toLowerCase()} and ${s2.name.toLowerCase()} are nearly silent. ${s1.invitation} ${s2.invitation}`
      : s1.challenge;

  const innerNote = vowelLead
    ? `Vowels in this name lean toward ${vowelLead.name.toLowerCase()}: ${vowelLead.inner}`
    : "This name carries almost no vowel field — a rare, highly articulated outer signature.";
  const outerNote = consLead
    ? `Consonants speak of ${consLead.name.toLowerCase()} in the outer life: ${consLead.outer}`
    : "This name is almost all vowel — an unusually inward constellation.";

  const synthesis = [
    `${displayName} tends to meet the world through ${p.name.toLowerCase()}, with ${g2 ? `${g2.name.toLowerCase()} close behind` : "little secondary weather to dilute it"}.`,
    tension
      ? `A living tension — ${tension.title.toLowerCase()} — gives the configuration its characteristic pressure.`
      : `${p.invitation}`,
    shadows.length
      ? `The letters do not sentence you. They describe a climate. The quieter fields of ${shadows.map((l) => `${l} (${themeOf(l).name.toLowerCase()})`).join(" and ")} remain available as practice, not as lack.`
      : "",
    `Notice where ${p.name.toLowerCase()} already shows up in ordinary days. Letterology is a mirror, not a forecast.`,
  ]
    .filter(Boolean)
    .join(" ");

  const dailyStatement = `Today's letter in this name is ${daily} — ${dailyTheme.name}. ${dailyTheme.invitation}`;
  const periodStatement = `This week's period focus is ${period} (${periodTheme.name.toLowerCase()}). ${periodTheme.invitation}`;

  const triad = pickTriad(inventory, signature);
  const archetype = archetypeOf(triad);
  const kindred = kindredArchetypes(triad, 8);

  return {
    displayName,
    normalized: parts.map((p) => p.letters).join(" "),
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
    `Secondary: ${h.secondaries.map((s) => `${s.letter} (${themeOf(s.letter).name})`).join(", ") || "—"}`,
    h.tension ? `Tension: ${h.tension.title}` : "",
    `Shadow fields: ${h.shadows.map((s) => `${s} (${themeOf(s).name})`).join(", ")}`,
    `Daily letter: ${h.daily} — ${themeOf(h.daily).name}`,
    `Period focus: ${h.period} — ${themeOf(h.period).name}`,
    "",
    h.statements.primary,
    "",
    `${h.archetype.title}`,
    h.archetype.portrait,
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
