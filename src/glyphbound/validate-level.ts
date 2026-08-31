import { validateFolio, type Folio, type FolioIssue } from "./folio";

const FLOOR = new Set("#*=_T/\\&-`)gjw[".split(""));
const SOLID = new Set(["#", "*", "&"]);
const SPIKE = "^";
const LASER = "|";
const SLUICE = "~";
const SAW = "S";
const REST_HAZARD = new Set("^|Sjzl");

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
  return REST_HAZARD.has(ch);
}

function canStand(rows: string[], x: number, y: number) {
  let here = at(rows, x, y);
  let below = at(rows, x, y + 1);
  if (here === "v" || here === "|") here = ".";
  if (below === "v" || below === "|") below = at(rows, x, y + 2);
  if (here === SPIKE || here === SAW) return false;
  if (isSolid(here)) return false;
  if (isFloor(here) && here !== "#" && here !== "*" && here !== "&") return true;
  if (below === SPIKE || below === SAW) return false;
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
  const spawn = findChar(rows, "@");
  const main = spawn ? Math.min(rows.length - 2, spawn.y + 1) : mainFloorY(rows);
  const W = rows[0]?.length ?? 0;
  let x = 1;
  while (x < W - 1) {
    const local = localFloorY(rows, x);
    const carved = local >= main + 2 && local <= main + 4 && isFloor(at(rows, x, local));
    if (isFloor(at(rows, x, main)) || carved) {
      x++;
      continue;
    }
    const x0 = x;
    while (x < W - 1) {
      const yf = localFloorY(rows, x);
      const valley = yf >= main + 2 && yf <= main + 4 && isFloor(at(rows, x, yf));
      if (isFloor(at(rows, x, main)) || valley) break;
      x++;
    }
    const w = x - x0;
    let assists = 0;
    let sluice = false;
    for (let i = x0; i < x; i++) {
      const yf = localFloorY(rows, i);
      for (let dy = -2; dy <= 2; dy++) {
        const ch = at(rows, i, yf + dy);
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
    if (!isSolid(at(rows, x, y))) continue;
    if (x === x1 && y > y1) continue;
    return false;
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
    for (const dx of [-1, 0, 1] as const) {
      for (let drop = 1; drop <= 6; drop++) {
        const nx = x + dx;
        const ny = y + drop;
        if (isSolid(at(rows, nx, ny))) break;
        tryPush(nx, ny);
      }
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

function localFloorY(rows: string[], x: number) {
  const H = rows.length;
  for (let y = H - 2; y >= 1; y--) {
    const ch = at(rows, x, y);
    if (ch === "^" || ch === "S" || ch === "~") continue;
    if (isFloor(ch) && ch !== ".") continue;
    if (ch === "#" || ch === "*" || ch === "&") continue;
    return Math.min(H - 2, y + 1);
  }
  return mainFloorY(rows);
}

function laserFloorIssues(rows: string[]): FolioIssue[] {
  const W = rows[0]?.length ?? 0;
  const issues: FolioIssue[] = [];
  for (let x = 1; x < W - 1; x++) {
    const fy = localFloorY(rows, x);
    if (at(rows, x, fy) === LASER || at(rows, x, fy - 1) === LASER) {
      issues.push({ code: "laser-floor", message: `laser on the walkway at ${x}` });
    }
  }
  return issues;
}

function sawPathIssues(rows: string[]): FolioIssue[] {
  const W = rows[0]?.length ?? 0;
  const issues: FolioIssue[] = [];
  for (let x = 1; x < W - 1; x++) {
    const fy = localFloorY(rows, x);
    if (at(rows, x, fy - 1) === SAW) {
      issues.push({ code: "saw-path", message: `saw blocks the walkway at ${x}` });
    }
  }
  return issues;
}

function restHazardIssues(rows: string[]): FolioIssue[] {
  const issues: FolioIssue[] = [];
  const p = findChar(rows, "%");
  if (!p) return issues;
  const here = at(rows, p.x, p.y);
  const below = at(rows, p.x, p.y + 1);
  if (isHazard(here) || isHazard(below) || below === SAW || here === SAW || here === "j" || below === "j") {
    issues.push({ code: "rest-hazard", message: "checkpoint sits on a hazard" });
  }
  return issues;
}

function stamperWaitIssues(rows: string[]): FolioIssue[] {
  const issues: FolioIssue[] = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
      if (at(rows, x, y) !== "z") continue;
      const left = isFloor(at(rows, x - 1, y + 2)) || isSolid(at(rows, x - 1, y));
      const right = isFloor(at(rows, x + 1, y + 2)) || isSolid(at(rows, x + 1, y));
      if (!left && !right) {
        issues.push({ code: "wait-spot", message: `stamper at ${x},${y} has no wait-spot` });
      }
    }
  }
  return issues;
}

/** Jump-budget and reachability checks on ASCII rows. */
export function validateLevel(rows: string[]): FolioIssue[] {
  if (!rows.length) return [{ code: "empty", message: "no rows" }];
  const issues: FolioIssue[] = [];
  issues.push(...pointSafe(rows, "@", "spawn"));
  issues.push(...pointSafe(rows, "%", "checkpoint"));
  issues.push(...pointSafe(rows, "P", "gate"));
  const spawn = findChar(rows, "@");
  const gate = findChar(rows, "P");
  if (spawn && gate && gate.y > spawn.y + 1) {
    issues.push({ code: "buried", message: "gate is below the walkway" });
  }
  issues.push(...pitIssues(rows));
  issues.push(...laserFloorIssues(rows));
  issues.push(...sawPathIssues(rows));
  issues.push(...restHazardIssues(rows));
  issues.push(...stamperWaitIssues(rows));
  if (spawn && gate && !reachable(rows)) {
    issues.push({ code: "path", message: "no walk/jump path from spawn to gate" });
  }
  return issues;
}

export function checkMap(folio: Folio): FolioIssue[] {
  return [...validateFolio(folio), ...validateLevel(folio.rows ?? [])];
}
