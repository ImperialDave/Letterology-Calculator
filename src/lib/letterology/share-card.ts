import { readFileSync } from "node:fs";
import { join } from "node:path";
import { themeOf } from "./lexicon";
import type { Horoscope } from "./types";

const INK = "#1c1712";
const WINE = "#7a3328";
const MUTED = "#6b6256";
const SUBTLE = "#8a8074";
const FACE = "Noto Serif, Georgia, 'Times New Roman', serif";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fit(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function wrap(value: string, width: number, maxLines: number): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length === maxLines - 1) {
      const rest = [word, ...words.slice(i + 1)].join(" ");
      lines.push(fit(rest, width));
      return lines;
    }
    current = word;
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function sealDataUri(): string | null {
  const candidates = [
    join(process.cwd(), "public/seal.jpg"),
    join(process.cwd(), ".output/public/seal.jpg"),
  ];
  for (const path of candidates) {
    try {
      const buf = readFileSync(path);
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      // try the next location
    }
  }
  return null;
}

function sealMark(letter: string): string {
  const seal = sealDataUri();
  if (seal) {
    return `<image href="${seal}" x="980" y="430" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#sealclip)"/>
      <circle cx="1050" cy="500" r="72" fill="none" stroke="${WINE}" stroke-opacity="0.4" stroke-width="3"/>`;
  }
  return `<circle cx="1050" cy="500" r="64" fill="${WINE}"/>
    <text x="1050" y="518" text-anchor="middle" font-family="${FACE}" font-size="52" fill="#f6f0e4">${esc(letter.slice(0, 1))}</text>`;
}

function paperShell(): string {
  return `<defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f6f0e4"/>
      <stop offset="55%" stop-color="#efe6d6"/>
      <stop offset="100%" stop-color="#e3d4bc"/>
    </linearGradient>
    <radialGradient id="glow" cx="16%" cy="28%" r="58%">
      <stop offset="0%" stop-color="${WINE}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${WINE}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.45" fill="${INK}" fill-opacity="0.045"/>
      <circle cx="4.5" cy="3.5" r="0.35" fill="${WINE}" fill-opacity="0.035"/>
    </pattern>
    <clipPath id="sealclip"><circle cx="1050" cy="500" r="70"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#paper)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grain)"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="${WINE}" stroke-opacity="0.28" stroke-width="1.5"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${WINE}" stroke-opacity="0.12" stroke-width="1"/>
  <path d="M56 72 H88 M56 72 V104" fill="none" stroke="${WINE}" stroke-opacity="0.45" stroke-width="1.5"/>
  <path d="M1144 72 H1112 M1144 72 V104" fill="none" stroke="${WINE}" stroke-opacity="0.45" stroke-width="1.5"/>
  <path d="M56 558 H88 M56 558 V526" fill="none" stroke="${WINE}" stroke-opacity="0.45" stroke-width="1.5"/>
  <path d="M1144 558 H1112 M1144 558 V526" fill="none" stroke="${WINE}" stroke-opacity="0.45" stroke-width="1.5"/>`;
}

function brandKicker(): string {
  return `<text x="80" y="96" font-family="${FACE}" font-size="18" letter-spacing="7" fill="${WINE}">LETTEROLOGY</text>
  <line x1="80" y1="112" x2="248" y2="112" stroke="${WINE}" stroke-opacity="0.28" stroke-width="1"/>`;
}

export function portraitSvg(h: Horoscope, dayLine?: string): string {
  const [house, manner, field] = h.triad;
  const houseTheme = themeOf(house);
  const mannerTheme = themeOf(manner);
  const fieldTheme = themeOf(field);
  const name = fit(h.displayName, 28);
  const title = fit(h.archetype.title, 34);
  const houseName = fit(h.archetype.house, 42);
  const mythLines = wrap(dayLine || h.archetype.myth, 64, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${paperShell()}
  ${brandKicker()}

  <text x="80" y="268" font-family="${FACE}" font-size="156" fill="${WINE}">${esc(h.signature)}</text>
  <text x="80" y="314" font-family="${FACE}" font-size="16" letter-spacing="3.5" fill="${MUTED}">${esc(houseTheme.name.toUpperCase())} SITS THE HOUSE</text>

  <text x="80" y="386" font-family="${FACE}" font-size="50" fill="${INK}">${esc(name)}</text>
  <text x="80" y="434" font-family="${FACE}" font-size="30" fill="${WINE}">${esc(title)}</text>
  <text x="80" y="470" font-family="${FACE}" font-size="20" fill="${MUTED}">${esc(houseName)}</text>
  ${mythLines
    .map(
      (line, i) =>
        `<text x="80" y="${508 + i * 28}" font-family="${FACE}" font-size="20" fill="${INK}">${esc(line)}</text>`,
    )
    .join("\n  ")}

  <g transform="translate(640, 150)">
    <text x="0" y="0" font-family="${FACE}" font-size="13" letter-spacing="4" fill="${SUBTLE}">HOUSE</text>
    <text x="0" y="72" font-family="${FACE}" font-size="72" fill="${WINE}">${esc(house)}</text>
    <text x="0" y="100" font-family="${FACE}" font-size="16" fill="${MUTED}">${esc(houseTheme.name)}</text>

    <text x="150" y="0" font-family="${FACE}" font-size="13" letter-spacing="4" fill="${SUBTLE}">MANNER</text>
    <text x="150" y="72" font-family="${FACE}" font-size="72" fill="${INK}">${esc(manner)}</text>
    <text x="150" y="100" font-family="${FACE}" font-size="16" fill="${MUTED}">${esc(mannerTheme.name)}</text>

    <text x="310" y="0" font-family="${FACE}" font-size="13" letter-spacing="4" fill="${SUBTLE}">FIELD</text>
    <text x="310" y="72" font-family="${FACE}" font-size="72" fill="${INK}">${esc(field)}</text>
    <text x="310" y="100" font-family="${FACE}" font-size="16" fill="${MUTED}">${esc(fieldTheme.name)}</text>
  </g>

  ${sealMark(h.signature)}
</svg>`;
}

export function glyphSvg(input: {
  letter: string;
  kicker: string;
  title: string;
  line: string;
}): string {
  const letter = esc(input.letter.slice(0, 1).toUpperCase());
  const kicker = esc(fit(input.kicker, 36));
  const title = esc(fit(input.title, 36));
  const lines = wrap(input.line, 48, 3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${paperShell()}
  ${brandKicker()}

  <text x="88" y="430" font-family="${FACE}" font-size="250" fill="${WINE}">${letter}</text>
  <text x="380" y="250" font-family="${FACE}" font-size="16" letter-spacing="4" fill="${MUTED}">${kicker}</text>
  <text x="380" y="322" font-family="${FACE}" font-size="46" fill="${INK}">${title}</text>
  <line x1="380" y1="346" x2="620" y2="346" stroke="${WINE}" stroke-opacity="0.28" stroke-width="1"/>
  ${lines
    .map(
      (line, i) =>
        `<text x="380" y="${390 + i * 34}" font-family="${FACE}" font-size="24" fill="${INK}">${esc(line)}</text>`,
    )
    .join("\n  ")}

  ${sealMark(input.letter)}
</svg>`;
}
