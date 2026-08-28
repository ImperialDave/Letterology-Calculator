export type KeyAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "jump"
  | "attack"
  | "fang"
  | "special"
  | "interact"
  | "pause"
  | "stem"
  | "cycle";

export const KEY_DEFS: { id: KeyAction; label: string; code: string; extras: string[] }[] = [
  { id: "left", label: "Left", code: "KeyA", extras: ["ArrowLeft"] },
  { id: "right", label: "Right", code: "KeyD", extras: ["ArrowRight"] },
  { id: "up", label: "Up", code: "KeyW", extras: ["ArrowUp"] },
  { id: "down", label: "Down", code: "KeyS", extras: ["ArrowDown"] },
  { id: "jump", label: "Jump", code: "Space", extras: [] },
  { id: "attack", label: "Strike", code: "KeyJ", extras: ["KeyZ"] },
  { id: "fang", label: "Fang", code: "KeyF", extras: ["KeyH"] },
  { id: "special", label: "Skill", code: "KeyK", extras: ["KeyX"] },
  { id: "interact", label: "Talk", code: "KeyE", extras: [] },
  { id: "pause", label: "Pause", code: "Escape", extras: ["KeyP"] },
  { id: "stem", label: "Stem", code: "KeyL", extras: ["KeyI"] },
  { id: "cycle", label: "Cycle letter", code: "Tab", extras: ["KeyQ", "BracketRight"] },
];

export const DEFAULT_KEYS: Record<KeyAction, string> = Object.fromEntries(
  KEY_DEFS.map((d) => [d.id, d.code]),
) as Record<KeyAction, string>;

export function codesFor(map: Partial<Record<string, string>> | undefined, id: KeyAction): string[] {
  const def = KEY_DEFS.find((d) => d.id === id)!;
  const primary = map?.[id] || def.code;
  const extra = def.extras.filter((c) => c !== primary);
  return [primary, ...extra];
}

export function bindKey(
  map: Partial<Record<string, string>>,
  action: KeyAction,
  code: string,
): Partial<Record<string, string>> {
  const next: Partial<Record<string, string>> = { ...map, [action]: code };
  const prev = map[action] ?? DEFAULT_KEYS[action];
  for (const d of KEY_DEFS) {
    if (d.id === action) continue;
    const cur = next[d.id] ?? DEFAULT_KEYS[d.id];
    if (cur === code) next[d.id] = prev;
  }
  return next;
}

export function prettyCode(code: string) {
  if (code === "Space") return "Space";
  if (code === "Escape") return "Esc";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Arrow")) return code.slice(5);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}
