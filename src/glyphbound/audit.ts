/** Doctrine auditor: Housing, Site, porch, Exchange. Path/fairness stay in validateLevel. */
import { ENEMY_GLYPHS } from "./density";
import { LEVELS } from "./levels";
import { localFloorY } from "./levels-story";
import { at } from "./site";
import { STAGE_COUNT } from "./types";
import { validateLevel } from "./validate-level";

export type AuditSeverity = "fail" | "warn";

export interface AuditIssue {
  code: string;
  message: string;
  x: number;
  y: number;
  severity: AuditSeverity;
}

export interface AuditReport {
  id: string;
  name: string;
  theme: string;
  issues: AuditIssue[];
  fails: number;
  warns: number;
}

const SOLID = "#*&";
const FLOORISH = "#*&-T/\\=_";
const EMITTER = "#*=&";
const HANG = "lzxSfd";
const FLOOR_TOY = "jw~";
const HUB_SKIP = "{}[dfjwx";
const FOUNDRY = "lzxfdjw}{[";
const FIGHT = ENEMY_GLYPHS + "!";
const PORCH_FLOOR = "jw^";
const PORCH_HANG = "lzxSfd";

export const AUDIT_BANDS: Record<string, string[]> = {
  hub: ["hub"],
  "1-5": ids(1, 5),
  "6-14": ids(6, 14),
  "15-24": ids(15, 24),
  "25-29": ids(25, 29),
  "30-44": ids(30, 44),
  "45-60": ids(45, 60),
};

function ids(a: number, b: number) {
  const out: string[] = [];
  for (let n = a; n <= b; n++) out.push(`stage${n}`);
  return out;
}

export function parseAuditTarget(arg?: string): string[] {
  if (!arg || arg === "all") {
    return ["hub", ...ids(1, STAGE_COUNT)];
  }
  if (AUDIT_BANDS[arg]) return AUDIT_BANDS[arg];
  if (arg === "hub" || /^stage\d+$/.test(arg)) return [arg];
  const n = Number(arg);
  if (Number.isInteger(n) && n >= 1 && n <= STAGE_COUNT) return [`stage${n}`];
  const m = /^(\d+)-(\d+)$/.exec(arg);
  if (m) {
    const lo = Math.max(1, Number(m[1]));
    const hi = Math.min(STAGE_COUNT, Number(m[2]));
    if (lo <= hi) return ids(lo, hi);
  }
  return [];
}

function solid(ch: string) {
  return SOLID.includes(ch);
}

function issue(code: string, message: string, x: number, y: number, severity: AuditSeverity = "fail"): AuditIssue {
  return { code, message, x, y, severity };
}

function mergeRuns(issues: AuditIssue[]): AuditIssue[] {
  const out: AuditIssue[] = [];
  const counts: number[] = [];
  for (const i of issues) {
    const last = out[out.length - 1];
    const li = out.length - 1;
    if (last && last.code === i.code && last.y === i.y && last.severity === i.severity && i.x === last.x + 1) {
      counts[li] += 1;
      last.message = last.message.replace(/ \(×\d+\)$/, "") + ` (×${counts[li]})`;
      continue;
    }
    out.push({ ...i });
    counts.push(1);
  }
  return out;
}

function isFluid(ch: string) {
  return ch === "~" || ch === "w";
}

export function snippetAround(rows: string[], x: number, y: number, rx = 4, ry = 2): string {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const y0 = Math.max(0, y - ry);
  const y1 = Math.min(H - 1, y + ry);
  const x0 = Math.max(0, x - rx);
  const x1 = Math.min(W - 1, x + rx);
  const lines: string[] = [];
  for (let yy = y0; yy <= y1; yy++) {
    const slice = (rows[yy] ?? "").slice(x0, x1 + 1);
    lines.push(`${String(yy).padStart(2, " ")} | ${slice}`);
  }
  const caret = " ".repeat(4 + (x - x0)) + "^";
  lines.push(`   | ${caret}`);
  return lines.join("\n");
}

function runEnd(rows: string[], x: number, y: number, ch: string) {
  let x1 = x;
  const W = rows[0]?.length ?? 0;
  while (x1 + 1 < W && at(rows, x1 + 1, y) === ch) x1 += 1;
  return x1;
}

function housingIssues(rows: string[], hub: boolean): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = at(rows, x, y);
      if (hub && HUB_SKIP.includes(ch)) continue;
      switch (ch) {
        case "^": {
          if (at(rows, x, y + 1) === "^") break;
          if (!solid(at(rows, x, y + 1))) {
            issues.push(issue("housing-socket", "spike has no # socket — teeth retract into air", x, y));
          }
          const airAbove = at(rows, x, y - 1) === "." || at(rows, x, y - 1) === "v";
          let walkNub = false;
          if (airAbove) {
            for (const d of [-1, 1] as const) {
              if (!solid(at(rows, x + d, y))) continue;
              const above = at(rows, x + d, y - 1);
              if (above !== "." && above !== "v") continue;
              if (localFloorY(rows, x + d) === y) walkNub = true;
            }
          }
          if (walkNub) {
            issues.push(issue("housing-float-spike", "spike replaced the walk floor — hop must be a pit", x, y));
          }
          break;
        }
        case "~":
        case "w": {
          if (at(rows, x - 1, y) === ch) break;
          const x1 = runEnd(rows, x, y, ch);
          let floor = true;
          for (let xx = x; xx <= x1; xx++) {
            const b = at(rows, xx, y + 1);
            if (!solid(b) && !isFluid(b)) floor = false;
          }
          if (!floor) {
            issues.push(issue("housing-basin", `${ch === "w" ? "sinkink" : "sluice"} has no basin floor`, x, y));
          }
          const surface = at(rows, x, y - 1) === "." || at(rows, x, y - 1) === "v";
          if (surface && (!solid(at(rows, x - 1, y)) || !solid(at(rows, x1 + 1, y)))) {
            issues.push(issue("housing-basin-lip", `${ch === "w" ? "sinkink" : "sluice"} basin has no # lips`, x, y));
          }
          break;
        }
        case "l":
        case "z":
        case "f": {
          const up = at(rows, x, y - 1);
          if (up !== "=" && up !== "#") {
            issues.push(issue("housing-beam", `${ch} hangs with no beam above`, x, y));
          }
          break;
        }
        case "x": {
          const jamb = at(rows, x - 1, y);
          if (!solid(jamb) && jamb !== "=") {
            issues.push(issue("housing-jamb", "guillotine has no # jamb at x-1", x, y));
          }
          break;
        }
        case "S": {
          let rail = false;
          let air = false;
          for (let d = -2; d <= 2; d++) {
            if (d === 0) continue;
            const n = at(rows, x + d, y);
            if (n === "=") rail = true;
            if (n === ".") air = true;
          }
          if (!rail && air) {
            issues.push(issue("housing-rail", "saw slides with no = rail on the travel", x, y));
          } else if (!rail) {
            issues.push(issue("housing-rail", "saw is boxed with no rail", x, y, "warn"));
          }
          break;
        }
        case "d": {
          const yf = localFloorY(rows, x);
          const pad = at(rows, x, yf);
          if (pad !== "&" && pad !== "#") {
            issues.push(issue("housing-plinth", "rotor has no plinth under the hub", x, y));
          }
          break;
        }
        case "}": {
          const up = at(rows, x, y - 1);
          if (up !== "=" && up !== "#") {
            issues.push(issue("housing-lintel", "shutter has no lintel", x, y));
          }
          break;
        }
        case "{": {
          let track = 0;
          for (let d = -3; d <= 3; d++) if (at(rows, x + d, y - 2) === "=") track += 1;
          if (track < 3) {
            issues.push(issue("housing-track", "carriage has no = track for its travel", x, y));
          }
          break;
        }
        case "[": {
          const under = at(rows, x, y + 1);
          const loft = at(rows, x - 1, y) === "=" && at(rows, x + 1, y) === "=";
          if (!FLOORISH.includes(under) && !loft) {
            issues.push(issue("housing-pad", "echo plate has no pad under it", x, y));
          }
          break;
        }
        case "|": {
          if (at(rows, x, y - 1) === "|") break;
          const up = at(rows, x, y - 1);
          if (!EMITTER.includes(up)) {
            issues.push(issue("housing-emitter", "laser column has no # emitter above", x, y));
          }
          break;
        }
        case "T": {
          if (at(rows, x, y + 1) === "T") break;
          const below = at(rows, x, y + 1);
          if (below === "^") {
            if (!solid(at(rows, x, y + 2))) {
              issues.push(issue("housing-footing", "bounce over teeth has no footing", x, y));
            }
          } else if (!solid(below)) {
            issues.push(issue("housing-footing", "bounce has no footing", x, y));
          } else {
            const gapCh = (ch: string) => ch === "." || ch === "^" || ch === "v";
            const gap = gapCh(at(rows, x - 1, y + 1)) || gapCh(at(rows, x + 1, y + 1));
            if (!gap) {
              issues.push(issue("site-bounce-hall", "bounce sits on solid walk — pit assist only", x, y));
            }
          }
          break;
        }
        case "`":
        case ":": {
          const under = at(rows, x, y + 1);
          if (FLOORISH.includes(under) || under === "#" || under === "^") break;
          if ((under === "." || under === "v") && (FLOORISH.includes(at(rows, x, y + 2)) || at(rows, x, y + 2) === "#")) break;
          const left = solid(at(rows, x - 1, y)) || solid(at(rows, x - 1, y + 1));
          const right = solid(at(rows, x + 1, y)) || solid(at(rows, x + 1, y + 1));
          if (!left && !right) {
            issues.push(issue("housing-shaft", "lift/fan has no shaft wall", x, y));
          }
          break;
        }
        case "g": {
          if (!solid(at(rows, x - 1, y)) && !solid(at(rows, x + 1, y))) {
            issues.push(issue("housing-vent", "geyser is not inset in #", x, y));
          }
          break;
        }
        case "j": {
          if (at(rows, x - 1, y) === "j") break;
          const x1 = runEnd(rows, x, y, "j");
          if (x1 - x + 1 >= 8) {
            issues.push(issue("site-grate-street", `grate sidewalk is ${x1 - x + 1} tiles`, x, y));
          }
          if (!solid(at(rows, x - 1, y)) || !solid(at(rows, x1 + 1, y))) {
            issues.push(issue("housing-inset", "grate has no # lips", x, y, "warn"));
          }
          break;
        }
        default:
          break;
      }
    }
  }
  return issues;
}

function siteRowIssues(rows: string[], hub: boolean): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = at(rows, x, y);
      if (hub && HUB_SKIP.includes(ch)) continue;
      const yf = localFloorY(rows, x);
      const onRail = at(rows, x - 1, y) === "=" || at(rows, x + 1, y) === "=";
      if (HANG.includes(ch) && (y === yf || y === yf - 1) && !onRail) {
        issues.push(issue("site-row", `${ch} is on the walk/floor — hang toys sit at yf-2`, x, y));
      }
      if (FLOOR_TOY.includes(ch) && y < yf - 1 && at(rows, x, y + 1) === ".") {
        issues.push(issue("site-row", `${ch} floats above the floor — floor toys sit at yf`, x, y));
      }
    }
  }
  return issues;
}

function porchIssues(rows: string[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 0; y < H; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!FIGHT.includes(at(rows, x, y))) continue;
      const yf = localFloorY(rows, x);
      if (PORCH_FLOOR.includes(at(rows, x, yf))) {
        issues.push(issue("porch", `digit at ${x} stands on ${at(rows, x, yf)}`, x, y));
      }
      for (let d = -1; d <= 1; d++) {
        if (PORCH_HANG.includes(at(rows, x + d, yf - 2))) {
          issues.push(issue("porch", `hang toy over the fight porch at ${x + d}`, x + d, yf - 2, "warn"));
          break;
        }
      }
    }
  }
  return issues;
}

function reservedIssues(rows: string[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const toys = FOUNDRY + "S|^~";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = at(rows, x, y);
      if (ch !== "@" && ch !== "%" && ch !== "P") continue;
      const below = at(rows, x, y + 1);
      if (toys.includes(below) || toys.includes(ch)) {
        issues.push(issue("reserved-hazard", `${ch === "@" ? "spawn" : ch === "%" ? "check" : "gate"} sits on ${below}`, x, y));
      }
    }
  }
  return issues;
}

function exchangeIssues(rows: string[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = at(rows, x, y);
      if (FOUNDRY.includes(ch)) {
        issues.push(issue("exchange-toy", `Exchange has foundry toy ${ch}`, x, y));
      }
    }
  }
  return issues;
}

export function auditLevel(rows: string[], opts?: { id?: string }): AuditIssue[] {
  const id = opts?.id ?? "";
  const hub = id === "hub";
  const issues: AuditIssue[] = [];
  for (const v of validateLevel(rows)) {
    issues.push(issue(v.code, v.message, 0, 0));
  }
  if (hub) {
    issues.push(...reservedIssues(rows));
    return issues;
  }
  issues.push(...housingIssues(rows, hub));
  issues.push(...siteRowIssues(rows, hub));
  issues.push(...porchIssues(rows));
  issues.push(...reservedIssues(rows));
  if (id === "stage1") issues.push(...exchangeIssues(rows));
  return mergeRuns(issues);
}

export function auditLedger(id: string): AuditReport {
  const meta = LEVELS[id];
  if (!meta) {
    return { id, name: id, theme: "", issues: [issue("missing", `no ledger ${id}`, 0, 0)], fails: 1, warns: 0 };
  }
  const issues = auditLevel(meta.rows, { id });
  return {
    id,
    name: meta.name,
    theme: meta.theme,
    issues,
    fails: issues.filter((i) => i.severity === "fail").length,
    warns: issues.filter((i) => i.severity === "warn").length,
  };
}

export function auditCampaign(target?: string): AuditReport[] {
  return parseAuditTarget(target).map(auditLedger);
}

export function formatReport(report: AuditReport, rows?: string[]): string {
  const lines = [
    `# ${report.id}  ${report.name}  ${report.theme}`,
    `fails ${report.fails}  warns ${report.warns}`,
  ];
  if (!report.issues.length) {
    lines.push("ok");
    return lines.join("\n");
  }
  const map = rows ?? LEVELS[report.id]?.rows;
  for (const i of report.issues) {
    lines.push("");
    lines.push(`${i.severity.toUpperCase()} ${i.code}  ${i.x},${i.y}`);
    lines.push(`  ${i.message}`);
    if (map && (i.x > 0 || i.y > 0)) lines.push(snippetAround(map, i.x, i.y));
  }
  return lines.join("\n");
}
