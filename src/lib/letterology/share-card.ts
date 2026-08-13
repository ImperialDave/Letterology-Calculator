import { readFileSync } from "node:fs";
import { join } from "node:path";
import { themeOf } from "./lexicon";
import type { Horoscope } from "./types";

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

export function portraitSvg(h: Horoscope, dayLine?: string): string {
  const [house, manner, field] = h.triad;
  const houseTheme = themeOf(house);
  const mannerTheme = themeOf(manner);
  const fieldTheme = themeOf(field);
  const name = fit(h.displayName, 28);
  const title = fit(h.archetype.title, 36);
  const houseName = fit(h.archetype.house, 42);
  const myth = fit(dayLine || h.archetype.myth, 92);
  const seal = sealDataUri();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f6f0e4"/>
      <stop offset="55%" stop-color="#efe6d6"/>
      <stop offset="100%" stop-color="#e3d4bc"/>
    </linearGradient>
    <radialGradient id="glow" cx="18%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#7a3328" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#7a3328" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="sealclip"><circle cx="1050" cy="500" r="70"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#paper)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="#7a3328" stroke-opacity="0.18" stroke-width="2"/>
  <rect x="48" y="48" width="1104" height="534" fill="#f6f0e4" fill-opacity="0.35"/>

  <text x="80" y="118" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="6" fill="#7a3328">${esc("LETTEROLOGY")}</text>
  <text x="80" y="268" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="168" fill="#7a3328">${esc(h.signature)}</text>
  <text x="80" y="328" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="22" fill="#6b6256">${esc(houseTheme.name.toUpperCase())} SITS THE HOUSE</text>

  <text x="80" y="400" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="56" fill="#1c1712">${esc(name)}</text>
  <text x="80" y="456" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="34" fill="#7a3328">${esc(title)}</text>
  <text x="80" y="498" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="22" fill="#6b6256">${esc(houseName)}</text>
  <text x="80" y="548" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="22" fill="#1c1712">${esc(myth)}</text>

  <g transform="translate(640, 96)">
    <text x="0" y="0" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="16" letter-spacing="4" fill="#8a8074">HOUSE</text>
    <text x="0" y="78" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="78" fill="#7a3328">${esc(house)}</text>
    <text x="0" y="108" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="18" fill="#6b6256">${esc(houseTheme.name)}</text>

    <text x="150" y="0" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="16" letter-spacing="4" fill="#8a8074">MANNER</text>
    <text x="150" y="78" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="78" fill="#1c1712">${esc(manner)}</text>
    <text x="150" y="108" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="18" fill="#6b6256">${esc(mannerTheme.name)}</text>

    <text x="310" y="0" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="16" letter-spacing="4" fill="#8a8074">FIELD</text>
    <text x="310" y="78" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="78" fill="#1c1712">${esc(field)}</text>
    <text x="310" y="108" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="18" fill="#6b6256">${esc(fieldTheme.name)}</text>
  </g>

  ${
    seal
      ? `<image href="${seal}" x="980" y="430" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#sealclip)"/>
         <circle cx="1050" cy="500" r="72" fill="none" stroke="#7a3328" stroke-opacity="0.35" stroke-width="3"/>`
      : `<circle cx="1050" cy="500" r="64" fill="#7a3328"/>
         <text x="1050" y="518" text-anchor="middle" font-family="Noto Serif, Georgia, 'Times New Roman', serif" font-size="52" fill="#f6f0e4">${esc(h.signature)}</text>`
  }
</svg>`;
}
