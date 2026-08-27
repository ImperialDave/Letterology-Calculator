import { validateFolio, type Folio, type FolioIssue } from "./folio";

const FLOOR = new Set("#*=_T/\\&-`)g".split(""));
const SOLID = new Set(["#", "*", "&"]);
const SPIKE = "^";
const LASER = "|";
const SLUICE = "~";
const SAW = "S";

function at(rows: string[], x: number, y: number) {
  if (y < 0 || y >= rows.length || x < 0 || x >= (rows[y]?.length ?? 0)) return "#";
  return rows[y][x];
}

function isFloor(ch: string) {
  return FLOOR.has(ch);
}

function isSolid(ch: string) {
  return SOLID.has(ch);
}

function isHazard(ch: string) {
  return ch === SPIKE || ch === LASER || ch === SAW;
}

function canStand(rows: string[], x: number, y: number) {
  const here = at(rows, x, y);
  const below = at(rows, x, y + 1);
  if (isHazard(here)) return false;
  if (isSolid(here)) return false;
  if (isFloor(here) && here !== "#" && here !== "*" && here !== "&") return true;
  if (isHazard(below)) return false;
  return isFloor(below) || below === SLUICE;
}

function findChar(rows: string[], ch: string) {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

function mainFloorY(rows: string[]) {
  let best = 0;
  let fy = Math.max(1, rows.length - 3);
  for (let y = 1; y < rows.length - 1; y++) {
    let n = 0;
    for (const c of rows[y]) if (isFloor(c)) n++;
    if (n > best) {
      best = n;
      fy = y;
    }
  }
  return fy;
}

function pitIssues(rows: string[]): FolioIssue[] {
  const issues: FolioIssue[] = [];
  const fy = mainFloorY(rows);
  const W = rows[0]?.length ?? 0;
  let x = 1;
  while (x < W - 1) {
    if (isFloor(at(rows, x, fy))) {
      x++;
      continue;
    }
    const x0 = x;
    while (x < W - 1 && !isFloor(at(rows, x, fy))) x++;
    const w = x - x0;
    let assists = 0;
    let sluice = false;
    for (let i = x0; i < x; i++) {
      for (let dy = -2; dy <= 2; dy++) {
        const ch = at(rows, i, fy + dy);
        if (ch === "T" || ch === "=" || ch === "_" || ch === "`" || ch === ")" || ch === "g") assists += 1;
        if (ch === SLUICE) sluice = true;
      }
    }
    if (w > 7 && assists < 2 && !sluice) {
      issues.push({ code: "pit-wide", message: `pit at ${x0} is ${w} tiles — need two assists or sluice` });
    } else if (w > 4 && assists < 1 && !sluice) {
      issues.push({ code: "pit", message: `pit at ${x0} is ${w} tiles — need bounce, shelf, or sluice` });
    }
  }
  return issues;
}

function pointSafe(rows: string[], mark: string, label: string): FolioIssue[] {
  const p = findChar(rows, mark);
  if (!p) return [];
  const issues: FolioIssue[] = [];
  if (isSolid(at(rows, p.x, p.y))) {
    issues.push({ code: "embed", message: `${label} sits inside a solid` });
  }
  let floor = false;
  for (let d = 1; d <= 2; d++) {
    if (isFloor(at(rows, p.x, p.y + d)) || at(rows, p.x, p.y + d) === SLUICE) floor = true;
  }
  if (!floor) issues.push({ code: "hang", message: `${label} has no floor within 2 tiles` });
  if (at(rows, p.x, p.y + 1) === SPIKE) {
    issues.push({ code: "teeth", message: `${label} stands on spikes` });
  }
  return issues;
}

function jumpClear(rows: string[], x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.max(1, Math.abs(x1 - x0) + Math.abs(y1 - y0));
  for (let i = 1; i < steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    if (isSolid(at(rows, x, y))) return false;
  }
  return true;
}

function reachable(rows: string[]): boolean {
  const spawn = findChar(rows, "@");
  const gate = findChar(rows, "P");
  if (!spawn || !gate) return false;
  const W = rows[0]?.length ?? 0;
  const H = rows.length;
  const key = (x: number, y: number) => x + y * 512;
  const seen = new Set<number>();
  const q: Array<[number, number]> = [];
  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (!canStand(rows, x, y)) return;
    const k = key(x, y);
    if (seen.has(k)) return;
    seen.add(k);
    q.push([x, y]);
  };
  tryPush(spawn.x, spawn.y);
  if (canStand(rows, spawn.x, spawn.y - 1)) tryPush(spawn.x, spawn.y - 1);
  let i = 0;
  while (i < q.length) {
    const [x, y] = q[i++];
    if (x === gate.x && (y === gate.y || y === gate.y - 1 || y === gate.y + 1)) return true;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    for (let drop = 1; drop <= 6; drop++) {
      const ny = y + drop;
      if (isSolid(at(rows, x, ny))) break;
      tryPush(x, ny);
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let up = 0; up <= 2; up++) {
        if (dx === 0 && up === 0) continue;
        const nx = x + dx;
        const ny = y - up;
        if (!jumpClear(rows, x, y, nx, ny)) continue;
        tryPush(nx, ny);
      }
    }
  }
  return seen.has(key(gate.x, gate.y)) || seen.has(key(gate.x, gate.y - 1)) || seen.has(key(gate.x, gate.y + 1));
}

/** Jump-budget and reachability checks on ASCII rows. */
export function validateLevel(rows: string[]): FolioIssue[] {
  if (!rows.length) return [{ code: "empty", message: "no rows" }];
  const issues: FolioIssue[] = [];
  issues.push(...pointSafe(rows, "@", "spawn"));
  issues.push(...pointSafe(rows, "%", "checkpoint"));
  issues.push(...pointSafe(rows, "P", "gate"));
  issues.push(...pitIssues(rows));
  const spawn = findChar(rows, "@");
  const gate = findChar(rows, "P");
  if (spawn && gate && !reachable(rows)) {
    issues.push({ code: "path", message: "no walk/jump path from spawn to gate" });
  }
  return issues;
}

export function checkMap(folio: Folio): FolioIssue[] {
  return [...validateFolio(folio), ...validateLevel(folio.rows ?? [])];
}
