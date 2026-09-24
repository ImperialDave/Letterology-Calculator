/** The steppe as data. The simulation and the scene both read this object. */

import raw from "./levels/steppe.json";

export type LevelPoint = { x: number; z: number };
export type LevelProp = {
  id: string;
  file: string;
  x: number;
  z: number;
  meters: number;
  mode: "height" | "longest" | "stand";
  palette: string;
  yaw?: number;
  r?: number;
  wind?: boolean;
  say?: string;
  reach?: number;
  verb?: string;
};
export type LevelHouse = { id: string; x: number; z: number; h: number };
export type LevelMarker = { id: string; x: number; z: number };

export type Level = {
  schema: 1;
  name: string;
  spawn: { x: number; z: number; yaw: number };
  actors: {
    stag: { x: number; z: number; yaw: number; postA: LevelPoint; postB: LevelPoint };
    herder: LevelPoint;
    serif: LevelPoint;
    spire: LevelPoint;
    script: LevelPoint;
  };
  houses: LevelHouse[];
  terrain: {
    mesa: LevelPoint;
    caldera: LevelPoint;
    ford: { x: number; halfX: number; halfZ: number };
    river: { base: number; freq: number; amp: number };
    road: LevelPoint;
  };
  markers: LevelMarker[];
  props: LevelProp[];
};

export type Selection =
  | { kind: "prop"; id: string }
  | { kind: "house"; id: string }
  | { kind: "actor"; id: "spawn" | "stag" | "herder" | "serif" | "spire" | "script" }
  | { kind: "marker"; id: string }
  | { kind: "terrain" };

export const PLACEABLE = [
  "fountain", "cart", "stall", "bench", "tent", "pit", "fence", "gate", "hedge",
  "barrel", "box", "chest", "signpost", "workbench", "column", "log", "stump",
  "mushroom", "flowerRed", "flowerPurple", "candle", "torch", "bannerBlue",
  "table", "chair", "shelf", "tableCloth", "bottle", "jug", "coins", "crates",
  "barrelStack", "pillarDecor", "chestGold",
] as const;

export const DRAFT_KEY = "unwritten-wild-draft";

export const STEPPE = raw as Level;

function finitePoint(point: { x: number; z: number } | undefined, label: string, problems: string[]) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) problems.push(label);
}

export function levelProblems(level: Level): string[] {
  const problems: string[] = [];
  if (level.schema !== 1) problems.push("schema");
  if (!level.name.trim()) problems.push("name");
  finitePoint(level.spawn, "spawn", problems);
  if (!Number.isFinite(level.spawn?.yaw)) problems.push("spawn yaw");
  finitePoint(level.actors?.stag, "stag", problems);
  finitePoint(level.actors?.stag?.postA, "stag post", problems);
  finitePoint(level.actors?.stag?.postB, "stag post", problems);
  finitePoint(level.actors?.herder, "herder", problems);
  finitePoint(level.actors?.serif, "serif", problems);
  finitePoint(level.actors?.spire, "spire", problems);
  finitePoint(level.actors?.script, "scriptorium", problems);
  finitePoint(level.terrain?.mesa, "mesa", problems);
  finitePoint(level.terrain?.road, "road", problems);
  if (!level.houses?.length) problems.push("houses");
  const ids = new Set<string>();
  for (const prop of level.props ?? []) {
    if (!prop.id || ids.has(prop.id)) problems.push(`prop ${prop.id || "unnamed"}`);
    ids.add(prop.id);
    if (!Number.isFinite(prop.x) || !Number.isFinite(prop.z)) problems.push(`prop ${prop.id} place`);
  }
  const markers = new Set<string>();
  for (const marker of level.markers ?? []) {
    if (!marker.id || markers.has(marker.id)) problems.push(`marker ${marker.id || "unnamed"}`);
    markers.add(marker.id);
  }
  return problems;
}

export function parseLevel(input: unknown): Level | null {
  if (!input || typeof input !== "object") return null;
  const level = input as Level;
  if (levelProblems(level).length) return null;
  return structuredClone(level);
}

export function cloneLevel(level: Level): Level {
  return structuredClone(level);
}

export function snapTo(value: number, step: number) {
  if (!(step > 0)) return value;
  return Math.round(value / step) * step;
}

function pointOf(level: Level, selection: Selection): { x: number; z: number } | null {
  if (selection.kind === "prop") return level.props.find((prop) => prop.id === selection.id) ?? null;
  if (selection.kind === "house") return level.houses.find((house) => house.id === selection.id) ?? null;
  if (selection.kind === "marker") return level.markers.find((marker) => marker.id === selection.id) ?? null;
  if (selection.kind === "actor") {
    if (selection.id === "spawn") return level.spawn;
    if (selection.id === "stag") return level.actors.stag;
    return level.actors[selection.id];
  }
  return null;
}

export function selectionPoint(level: Level, selection: Selection) {
  const point = pointOf(level, selection);
  return point ? { x: point.x, z: point.z } : null;
}

export function moveSelection(level: Level, selection: Selection, x: number, z: number, step: number | null): Level {
  const next = cloneLevel(level);
  const point = pointOf(next, selection);
  if (!point || !Number.isFinite(x) || !Number.isFinite(z)) return level;
  point.x = step ? snapTo(x, step) : x;
  point.z = step ? snapTo(z, step) : z;
  return next;
}

export function yawSelection(level: Level, selection: Selection, yaw: number): Level {
  const next = cloneLevel(level);
  if (!Number.isFinite(yaw)) return level;
  if (selection.kind === "prop") {
    const prop = next.props.find((item) => item.id === selection.id);
    if (!prop) return level;
    prop.yaw = yaw;
    return next;
  }
  if (selection.kind === "actor" && selection.id === "spawn") {
    next.spawn.yaw = yaw;
    return next;
  }
  if (selection.kind === "actor" && selection.id === "stag") {
    next.actors.stag.yaw = yaw;
    return next;
  }
  return level;
}

export function deleteSelection(level: Level, selection: Selection): Level {
  if (selection.kind !== "prop") return level;
  const next = cloneLevel(level);
  next.props = next.props.filter((prop) => prop.id !== selection.id);
  return next;
}

export function duplicateSelection(level: Level, selection: Selection): { level: Level; id: string } | null {
  if (selection.kind !== "prop") return null;
  const prop = level.props.find((item) => item.id === selection.id);
  if (!prop) return null;
  const next = cloneLevel(level);
  let id = `${prop.id}-copy`;
  let n = 2;
  const taken = new Set(next.props.map((item) => item.id));
  while (taken.has(id)) id = `${prop.id}-copy-${n++}`;
  next.props.push({ ...prop, id, x: prop.x + 1.5, z: prop.z + 1.5 });
  return { level: next, id };
}

export function addProp(level: Level, file: string): { level: Level; id: string } {
  const next = cloneLevel(level);
  let id = file;
  let n = 2;
  const taken = new Set(next.props.map((item) => item.id));
  while (taken.has(id)) id = `${file}-${n++}`;
  next.props.push({
    id,
    file,
    x: next.spawn.x + 2,
    z: next.spawn.z + 2,
    meters: 1,
    mode: "height",
    palette: "wall",
    say: "",
    reach: 1.5,
  });
  return { level: next, id };
}

export function patchProp(level: Level, id: string, patch: Partial<LevelProp>): Level {
  const next = cloneLevel(level);
  const prop = next.props.find((item) => item.id === id);
  if (!prop) return level;
  Object.assign(prop, patch);
  if (levelProblems(next).length) return level;
  return next;
}

export function patchTerrain(level: Level, patch: Partial<Level["terrain"]>): Level {
  const next = cloneLevel(level);
  next.terrain = { ...next.terrain, ...patch, mesa: patch.mesa ?? next.terrain.mesa, ford: patch.ford ?? next.terrain.ford, river: patch.river ?? next.terrain.river, road: patch.road ?? next.terrain.road, caldera: patch.caldera ?? next.terrain.caldera };
  if (levelProblems(next).length) return level;
  return next;
}

/** Copy a document onto the live objects the simulation already holds. */
export function applyLevel(next: Level): string[] {
  const problems = levelProblems(next);
  if (problems.length) return problems;
  Object.assign(STEPPE.spawn, next.spawn);
  Object.assign(STEPPE.actors.stag, next.actors.stag);
  Object.assign(STEPPE.actors.stag.postA, next.actors.stag.postA);
  Object.assign(STEPPE.actors.stag.postB, next.actors.stag.postB);
  Object.assign(STEPPE.actors.herder, next.actors.herder);
  Object.assign(STEPPE.actors.serif, next.actors.serif);
  Object.assign(STEPPE.actors.spire, next.actors.spire);
  Object.assign(STEPPE.actors.script, next.actors.script);
  STEPPE.houses.splice(0, STEPPE.houses.length, ...next.houses.map((house) => ({ ...house })));
  Object.assign(STEPPE.terrain.mesa, next.terrain.mesa);
  Object.assign(STEPPE.terrain.caldera, next.terrain.caldera);
  Object.assign(STEPPE.terrain.ford, next.terrain.ford);
  Object.assign(STEPPE.terrain.river, next.terrain.river);
  Object.assign(STEPPE.terrain.road, next.terrain.road);
  STEPPE.markers.splice(0, STEPPE.markers.length, ...next.markers.map((marker) => ({ ...marker })));
  STEPPE.props.splice(0, STEPPE.props.length, ...next.props.map((prop) => ({ ...prop })));
  STEPPE.name = next.name;
  return [];
}

export function entitiesOf(level: Level): { selection: Selection; label: string; x: number; z: number }[] {
  const rows: { selection: Selection; label: string; x: number; z: number }[] = [
    { selection: { kind: "actor", id: "spawn" }, label: "Sable", x: level.spawn.x, z: level.spawn.z },
    { selection: { kind: "actor", id: "stag" }, label: "Stag", x: level.actors.stag.x, z: level.actors.stag.z },
    { selection: { kind: "actor", id: "herder" }, label: "Herder", x: level.actors.herder.x, z: level.actors.herder.z },
    { selection: { kind: "actor", id: "serif" }, label: "Serif", x: level.actors.serif.x, z: level.actors.serif.z },
    { selection: { kind: "actor", id: "spire" }, label: "Spire", x: level.actors.spire.x, z: level.actors.spire.z },
    { selection: { kind: "actor", id: "script" }, label: "Scriptorium", x: level.actors.script.x, z: level.actors.script.z },
  ];
  for (const house of level.houses) rows.push({ selection: { kind: "house", id: house.id }, label: house.id, x: house.x, z: house.z });
  for (const prop of level.props) rows.push({ selection: { kind: "prop", id: prop.id }, label: prop.id, x: prop.x, z: prop.z });
  for (const marker of level.markers) rows.push({ selection: { kind: "marker", id: marker.id }, label: `Marker ${marker.id}`, x: marker.x, z: marker.z });
  rows.push({ selection: { kind: "terrain" }, label: "Terrain", x: level.terrain.mesa.x, z: level.terrain.mesa.z });
  return rows;
}

export function sameSelection(a: Selection | null, b: Selection | null) {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "terrain" && b.kind === "terrain") return true;
  return "id" in a && "id" in b && a.id === b.id;
}
