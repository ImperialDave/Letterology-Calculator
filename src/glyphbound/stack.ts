import { LEVELS } from "./levels";

const MOBS = "1023456789ABCEYGHKQUNJLM";

function setCell(rows: string[], x: number, y: number, ch: string) {
  if (y < 0 || y >= rows.length || x < 0 || x >= (rows[y]?.length ?? 0)) return;
  if (rows[y][x] !== ".") return;
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
}

function floorY(rows: string[]) {
  let best = 0;
  let fy = Math.max(1, rows.length - 3);
  for (let y = 1; y < rows.length - 1; y++) {
    let n = 0;
    for (const c of rows[y]) if (c === "#") n++;
    if (n > best) {
      best = n;
      fy = y;
    }
  }
  return fy;
}

function hash(n: number, x: number, s: number) {
  const v = Math.imul(n + 3, 374761) ^ Math.imul(x + 11, 668265) ^ Math.imul(s, 1274126177);
  return ((v >>> 0) % 1000) / 1000;
}

function alreadyStacked(rows: string[], fy: number) {
  let rails = 0;
  for (let y = fy - 5; y <= fy - 2; y++) {
    if (y < 1) continue;
    for (const c of rows[y] ?? "") if (c === "=" || c === "_" || c === "-") rails++;
  }
  return rails > 28;
}

const KINDS = ["terrace", "loftgap", "zipper", "perch", "colonnade", "switchback", "splitway", "cascade"] as const;

function paint(rows: string[], fy: number, x: number, kind: (typeof KINDS)[number], n: number) {
  const W = rows[0]?.length ?? 0;
  if (x < 8 || x > W - 16) return x;
  if (kind === "terrace") {
    for (let i = 0; i < 3; i++) setCell(rows, x + i, fy - 2, "=");
    for (let i = 0; i < 3; i++) setCell(rows, x + 4 + i, fy - 4, "=");
    for (let i = 0; i < 3; i++) setCell(rows, x + 8 + i, fy - 2, "=");
    if (n >= 10) setCell(rows, x + 5, fy - 5, "1");
    return x + 12;
  }
  if (kind === "loftgap") {
    setCell(rows, x + 2, fy - 1, "T");
    setCell(rows, x + 8, fy - 1, "T");
    for (let i = 0; i < 4; i++) setCell(rows, x + 3 + i, fy - 3, "=");
    setCell(rows, x + 5, fy - 5, "_");
    setCell(rows, x + 6, fy - 5, "_");
    if (n >= 12) setCell(rows, x + 4, fy - 4, "2");
    return x + 11;
  }
  if (kind === "zipper") {
    for (let i = 0; i < 4; i++) {
      const up = i % 2 === 0 ? 2 : 4;
      setCell(rows, x + i * 3, fy - up, "=");
      setCell(rows, x + i * 3 + 1, fy - up, "=");
    }
    if (n >= 16) setCell(rows, x + 6, fy - 5, "3");
    return x + 12;
  }
  if (kind === "perch") {
    setCell(rows, x + 3, fy - 3, "#");
    setCell(rows, x + 4, fy - 3, "#");
    setCell(rows, x + 5, fy - 3, "#");
    setCell(rows, x + 4, fy - 4, "#");
    setCell(rows, x + 4, fy - 5, n % 2 === 0 ? "7" : "4");
    return x + 10;
  }
  if (kind === "colonnade") {
    for (let i = 0; i < 3; i++) {
      setCell(rows, x + i * 4 + 2, fy - 1, "#");
      setCell(rows, x + i * 4 + 2, fy - 2, "#");
      setCell(rows, x + i * 4 + 2, fy - 3, "=");
      setCell(rows, x + i * 4 + 3, fy - 3, "=");
    }
    if (n >= 14) setCell(rows, x + 6, fy - 4, "1");
    return x + 14;
  }
  if (kind === "switchback") {
    setCell(rows, x, fy - 2, "=");
    setCell(rows, x + 1, fy - 2, "=");
    setCell(rows, x + 3, fy - 3, "=");
    setCell(rows, x + 4, fy - 3, "=");
    setCell(rows, x + 6, fy - 4, "_");
    setCell(rows, x + 7, fy - 4, "_");
    setCell(rows, x + 8, fy - 4, "_");
    setCell(rows, x + 10, fy - 2, "=");
    setCell(rows, x + 11, fy - 2, "=");
    return x + 13;
  }
  if (kind === "splitway") {
    for (let i = 0; i < 6; i++) setCell(rows, x + i, fy - 1, "/");
    for (let i = 0; i < 6; i++) setCell(rows, x + 2 + i, fy - 4, "_");
    if (n >= 18) setCell(rows, x + 8, fy - 1, "2");
    return x + 12;
  }
  setCell(rows, x + 1, fy - 1, "T");
  setCell(rows, x + 3, fy - 3, "=");
  setCell(rows, x + 4, fy - 3, "=");
  setCell(rows, x + 5, fy - 3, "=");
  setCell(rows, x + 7, fy - 4, "=");
  setCell(rows, x + 8, fy - 4, "=");
  setCell(rows, x + 9, fy - 1, "T");
  return x + 12;
}

function uniqueMob(rows: string[], x: number, y: number, prefer: string) {
  const used = new Set<string>();
  for (let dx = -8; dx <= 8; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const c = rows[y + dy]?.[x + dx];
      if (c && MOBS.includes(c)) used.add(c);
    }
  }
  if (!used.has(prefer)) {
    setCell(rows, x, y, prefer);
    return;
  }
  for (const ch of "12347") {
    if (!used.has(ch)) {
      setCell(rows, x, y, ch);
      return;
    }
  }
}

function placeBosses(rows: string[], n: number, fy: number) {
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= rows.length || x < 0 || x >= W) return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  if (n < 6) return;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < W; x++) if (rows[y][x] === "!") set(x, y, ".");
  }
  const isBoss = n % 5 === 0 || n === 60;
  if (!isBoss) return;
  let count = 1;
  if (n % 10 === 0 || n === 55) count = 2;
  if (n === 30 || n === 60) count = 3;
  const seats =
    count === 1 ? [W - 15] : count === 2 ? [Math.floor(W * 0.46), W - 15] : [Math.floor(W * 0.28), Math.floor(W * 0.55), W - 15];
  for (const raw of seats) {
    let x = Math.max(12, Math.min(W - 8, raw));
    if (rows[fy]?.[x] !== "#") {
      let found = -1;
      for (let d = 1; d < 10; d++) {
        if (rows[fy]?.[x + d] === "#") {
          found = x + d;
          break;
        }
        if (rows[fy]?.[x - d] === "#") {
          found = x - d;
          break;
        }
      }
      if (found < 0) continue;
      x = found;
    }
    set(x, fy - 1, "!");
  }
}

export function installStacks() {
  for (const meta of Object.values(LEVELS)) {
    if (!meta?.rows?.length) continue;
    if (meta.id === "hub") continue;
    const rows = meta.rows.slice();
    const fy = floorY(rows);
    const n = meta.index || 1;
    if (!alreadyStacked(rows, fy)) {
      const kind = KINDS[(n + meta.id.length) % KINDS.length];
      const W = rows[0].length;
      const start = 16 + (n % 7);
      const gap = 18 + (n % 5);
      let x = start;
      let painted = 0;
      while (x < W - 18 && painted < (n >= 30 ? 4 : 3)) {
        if (hash(n, x, 3) < 0.72) {
          const next = paint(rows, fy, x, KINDS[(KINDS.indexOf(kind) + painted) % KINDS.length], n);
          if (painted === 1) uniqueMob(rows, x + 2, fy - 1, "1");
          x = next + 4;
          painted++;
        } else x += gap;
      }
    }
    placeBosses(rows, n, fy);
    meta.rows = rows;
  }
}
