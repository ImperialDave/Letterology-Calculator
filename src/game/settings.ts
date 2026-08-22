export type Deadzone = "tight" | "normal" | "wide";

export type CabSettings = {
  version: 1;
  muted: boolean;
  volume: number;
  shake: boolean;
  grit: boolean;
  pauseOnBlur: boolean;
  compass: boolean;
  invertY: boolean;
  deadzone: Deadzone;
  haptics: boolean;
};

export const SETTINGS_KEY = "cinderwell.cab.v1";

const DEADZONE_PX: Record<Deadzone, number> = {
  tight: 12,
  normal: 22,
  wide: 40,
};

export function prefersQuietMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function defaultSettings(): CabSettings {
  const quiet = prefersQuietMotion();
  return {
    version: 1,
    muted: false,
    volume: 0.7,
    shake: !quiet,
    grit: !quiet,
    pauseOnBlur: true,
    compass: true,
    invertY: false,
    deadzone: "normal",
    haptics: true,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.7;
  return Math.max(0, Math.min(1, n));
}

export function hydrateSettings(raw: unknown): CabSettings {
  const d = defaultSettings();
  if (!raw || typeof raw !== "object") return d;
  const p = raw as Partial<CabSettings>;
  const dead = p.deadzone;
  return {
    version: 1,
    muted: Boolean(p.muted),
    volume: clamp01(typeof p.volume === "number" ? p.volume : d.volume),
    shake: typeof p.shake === "boolean" ? p.shake : d.shake,
    grit: typeof p.grit === "boolean" ? p.grit : d.grit,
    pauseOnBlur: typeof p.pauseOnBlur === "boolean" ? p.pauseOnBlur : d.pauseOnBlur,
    compass: typeof p.compass === "boolean" ? p.compass : d.compass,
    invertY: Boolean(p.invertY),
    deadzone: dead === "tight" || dead === "wide" || dead === "normal" ? dead : d.deadzone,
    haptics: typeof p.haptics === "boolean" ? p.haptics : d.haptics,
  };
}

export function loadSettings(): CabSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return hydrateSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: CabSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, version: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function deadzonePx(s: Pick<CabSettings, "deadzone">): number {
  return DEADZONE_PX[s.deadzone] ?? DEADZONE_PX.normal;
}
