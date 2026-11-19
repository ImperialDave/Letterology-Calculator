export function pointsFor(p: { questions: number; wrongGuesses: number; hints: number }): number {
  return Math.max(1, 12 - p.questions - p.wrongGuesses * 2 - p.hints);
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) row[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length]!;
}

/** Close spelling, case, and punctuation. Aliases still need a human yes. */
export function isStrongMatch(guess: string, secret: string): boolean {
  const g = normalizeName(guess);
  const s = normalizeName(secret);
  if (!g || !s) return false;
  if (g === s) return true;
  const gf = g.replace(/\s/g, "");
  const sf = s.replace(/\s/g, "");
  if (gf === sf) return true;
  const dist = levenshtein(gf, sf);
  const len = Math.max(gf.length, sf.length);
  const allowed = len <= 6 ? 1 : len <= 14 ? 2 : 3;
  return dist <= allowed;
}
