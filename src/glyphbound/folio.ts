import { ALLOWED_CHARS } from "./catalog";
import type { LevelId, TaskDef, ThemeId } from "./types";
import type { LevelMeta } from "./levels-story";

export type FolioKind = "stage" | "chunk" | "user";
export type FolioExit = "hub" | "win" | "none";

export interface Folio {
  version: 1;
  id: string;
  kind: FolioKind;
  name: string;
  theme: ThemeId;
  objective?: string;
  tasks?: TaskDef[];
  rows: string[];
  exit?: FolioExit;
  index?: number;
}

export interface FolioIssue {
  code: string;
  message: string;
}

const MIN_W = 16;
const MAX_W = 256;
const MIN_H = 8;
const MAX_H = 24;

export function padRows(rows: string[], fill = "#"): string[] {
  const w = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, fill));
}

export function folioFromMeta(meta: LevelMeta, kind: FolioKind = "stage"): Folio {
  return {
    version: 1,
    id: meta.id,
    kind,
    name: meta.name,
    theme: meta.theme,
    objective: meta.objective,
    tasks: meta.tasks,
    rows: padRows(meta.rows),
    exit: meta.exit ?? "hub",
    index: meta.index,
  };
}

export function metaFromFolio(folio: Folio): LevelMeta {
  return {
    id: (folio.id.startsWith("stage") || folio.id === "hub" ? folio.id : "hub") as LevelId,
    name: folio.name,
    theme: folio.theme,
    objective: folio.objective ?? "",
    tasks: folio.tasks ?? [],
    rows: padRows(folio.rows),
    exit: folio.exit === "win" ? "win" : "hub",
    index: folio.index ?? 0,
  };
}

export function validateFolio(folio: Folio): FolioIssue[] {
  const issues: FolioIssue[] = [];
  if (folio.version !== 1) issues.push({ code: "version", message: "folio.version must be 1" });
  if (!folio.id) issues.push({ code: "id", message: "folio.id is required" });
  if (!folio.name) issues.push({ code: "name", message: "folio.name is required" });
  if (!folio.kind) issues.push({ code: "kind", message: "folio.kind is required" });
  const rows = folio.rows ?? [];
  if (!rows.length) {
    issues.push({ code: "empty", message: "folio.rows is empty" });
    return issues;
  }
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  if (w < MIN_W || w > MAX_W) issues.push({ code: "width", message: `width ${w} outside ${MIN_W}–${MAX_W}` });
  if (h < MIN_H || h > MAX_H) issues.push({ code: "height", message: `height ${h} outside ${MIN_H}–${MAX_H}` });
  for (let y = 0; y < rows.length; y++) {
    if (rows[y].length !== w) {
      issues.push({ code: "rect", message: `row ${y} length ${rows[y].length} != ${w}` });
      break;
    }
  }
  let spawns = 0;
  let gates = 0;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (!ALLOWED_CHARS.has(ch)) {
        issues.push({ code: "char", message: `unknown '${ch}' at ${x},${y}` });
      }
      if (ch === "@") spawns += 1;
      if (ch === "P") gates += 1;
    }
  }
  if (folio.kind === "stage" || folio.kind === "user") {
    if (spawns < 1) issues.push({ code: "spawn", message: "stage/user folio needs @" });
    if (spawns > 1) issues.push({ code: "spawn", message: "more than one @" });
    if (folio.id !== "hub" && gates < 1) issues.push({ code: "gate", message: "stage/user folio needs P" });
  } else if (spawns > 1) {
    issues.push({ code: "spawn", message: "more than one @" });
  }
  return issues;
}

export function folioOk(folio: Folio): boolean {
  return validateFolio(folio).length === 0;
}
