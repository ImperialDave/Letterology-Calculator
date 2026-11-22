/** Solve clock. Time accumulates only while the puzzle is open and the tab is visible. */

export type Clock = {
  elapsedMs: number;
  runningSince: number | null;
};

export const GAP_CAP_MS = 30 * 60 * 1000;

export function clockNow(clock: Clock, now = Date.now()): number {
  if (clock.runningSince == null) return Math.max(0, clock.elapsedMs);
  return Math.max(0, clock.elapsedMs + Math.max(0, now - clock.runningSince));
}

export function freezeClock(clock: Clock, now = Date.now()): Clock {
  return { elapsedMs: clockNow(clock, now), runningSince: null };
}

export function pauseClock(clock: Clock, now = Date.now()): Clock {
  return freezeClock(clock, now);
}

export function resumeClock(clock: Clock, now = Date.now()): Clock {
  if (clock.runningSince != null) return clock;
  return { elapsedMs: Math.max(0, clock.elapsedMs), runningSince: now };
}

/** Drop a too-long gap (tab closed overnight) but keep a refresh in the same sitting. */
export function normalizeClock(clock: Clock, started: boolean, now = Date.now()): Clock {
  if (!started) return { elapsedMs: 0, runningSince: null };
  if (clock.runningSince == null) return resumeClock(clock, now);
  const gap = now - clock.runningSince;
  if (gap > GAP_CAP_MS) return { elapsedMs: Math.max(0, clock.elapsedMs), runningSince: now };
  return { elapsedMs: clockNow(clock, now), runningSince: now };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
