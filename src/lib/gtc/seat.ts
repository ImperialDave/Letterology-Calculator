import { initialOnline, type OLog, type OnlineState, type Pending, type PhaseName, type Seat } from "@/lib/gtc/online";
import { themeById } from "@/lib/gtc/themes";

/** One active two-player seat. A phone holds its own; Leave deletes it. */
const KEY = "gtc-seat";
/** Long enough for an evening match, short enough that tomorrow's visit starts clean. */
export const SEAT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const PHASES = new Set<PhaseName>([
  "wait",
  "theme",
  "draft",
  "ask",
  "hold",
  "watch",
  "respond",
  "solved",
  "results",
]);
const ANSWERS = new Set(["yes", "no", "sort", "right", "wrong"]);
const ROOM = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4,8}$/;
const PEER = /^p-[a-z0-9]{6,16}$/;

export type SeatRole = "host" | "guest";

export type SavedSeat = {
  version: 1;
  room: string;
  name: string;
  role: SeatRole;
  peerId: string;
  state: OnlineState;
  savedAt: number;
  /**
   * Last room-mail id this phone has applied. Null means a seat saved before
   * mail existed. A number, including 0, resumes after that id.
   */
  mailCursor: number | null;
};

type Backend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

let override: Backend | null = null;
let useOverride = false;

/** Tests inject a memory store so they never touch the browser's localStorage. */
export function setSeatBackendForTests(store: Backend | null): void {
  useOverride = true;
  override = store;
}

export function resetSeatBackendForTests(): void {
  useOverride = false;
  override = null;
}

function db(): Backend | null {
  if (useOverride) return override;
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function parseLog(value: unknown): OLog[] {
  if (!Array.isArray(value)) return [];
  const out: OLog[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const kind = row.kind === "g" ? "g" : row.kind === "q" ? "q" : null;
    const id = clip(row.id, 16);
    const text = clip(row.text, kind === "g" ? 48 : 160);
    if (!kind || !id || !text) continue;
    const answer = typeof row.answer === "string" && ANSWERS.has(row.answer) ? row.answer : undefined;
    const note = clip(row.note, 140);
    out.push({
      id,
      kind,
      text,
      answer: answer as OLog["answer"],
      note: note || undefined,
      hint: row.hint === true ? true : undefined,
    });
    if (out.length >= 40) break;
  }
  return out;
}

function parsePlayer(value: unknown): Seat | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.score !== "number" || !Number.isFinite(row.score)) return null;
  return {
    score: num(row.score, 0, 9999, 0),
    questions: num(row.questions, 0, 999, 0),
    wrongGuesses: num(row.wrongGuesses, 0, 999, 0),
    hints: num(row.hints, 0, 999, 0),
    turnQuestions: num(row.turnQuestions, 0, 99, 0),
    solved: row.solved === true,
    gaveUp: row.gaveUp === true,
    roundPoints: typeof row.roundPoints === "number" && Number.isFinite(row.roundPoints) ? num(row.roundPoints, 0, 99, 0) : null,
    log: parseLog(row.log),
  };
}

function parsePending(value: unknown): Pending | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const kind = row.kind === "g" ? "g" : row.kind === "q" ? "q" : null;
  const id = clip(row.id, 16);
  const text = clip(row.text, kind === "g" ? 48 : 160);
  if (!kind || !id || !text) return null;
  return { id, kind, text };
}

export function parseOnlineState(value: unknown): OnlineState | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.phase !== "string" || !PHASES.has(row.phase as PhaseName)) return null;
  const me = parsePlayer(row.me);
  const them = parsePlayer(row.them);
  if (!me || !them) return null;
  const base = initialOnline();
  const themeId = clip(row.themeId, 40) || base.themeId;
  const known = themeById(themeId);
  const themeLine = clip(row.themeLine, 80) || known?.line || base.themeLine;
  const after = row.afterSolved === "ask" || row.afterSolved === "results" ? row.afterSolved : "watch";
  return {
    ...base,
    phase: row.phase as PhaseName,
    round: num(row.round, 1, 99, 1),
    themeId: known?.id ?? (themeId || "custom"),
    themeLine,
    themeFromThem: row.themeFromThem === true,
    examples: known?.examples ?? [],
    exampleCursor: num(row.exampleCursor, 0, 1000, 0),
    secret: clip(row.secret, 48),
    note: clip(row.note, 140),
    iLocked: row.iLocked === true,
    theyLocked: row.theyLocked === true,
    myCharacter: clip(row.myCharacter, 48) || null,
    myNote: clip(row.myNote, 140) || null,
    me,
    them,
    theirName: clip(row.theirName, 18),
    pending: parsePending(row.pending),
    afterSolved: after,
    inbox: [],
    roundLive: row.roundLive === true,
    sound: row.sound !== false,
    stale: row.stale === true,
  };
}

export function newPeerId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "p-";
  for (const byte of bytes) id += alphabet[byte % alphabet.length]!;
  return id;
}

/** Pass a room to require that code. Omit it to read this phone's current seat. */
export function loadSeat(room?: string): SavedSeat | null {
  const store = db();
  if (!store) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    store.removeItem(KEY);
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    store.removeItem(KEY);
    return null;
  }
  const row = parsed as Record<string, unknown>;
  const savedRoom = typeof row.room === "string" ? row.room : "";
  const savedAt = typeof row.savedAt === "number" ? row.savedAt : 0;
  if (row.version !== 1 || !ROOM.test(savedRoom) || !PEER.test(clip(row.peerId, 20))) {
    store.removeItem(KEY);
    return null;
  }
  if (!savedAt || Date.now() - savedAt > SEAT_MAX_AGE_MS) {
    store.removeItem(KEY);
    return null;
  }
  if (room && savedRoom !== room) return null;
  const state = parseOnlineState(row.state);
  const role = row.role === "host" || row.role === "guest" ? row.role : null;
  const name = clip(row.name, 18);
  if (!state || !role || !name) {
    store.removeItem(KEY);
    return null;
  }
  const mailCursor =
    typeof row.mailCursor === "number" && Number.isFinite(row.mailCursor) && row.mailCursor >= 0
      ? Math.min(Math.trunc(row.mailCursor), Number.MAX_SAFE_INTEGER)
      : null;
  return {
    version: 1,
    room: savedRoom,
    name,
    role,
    peerId: clip(row.peerId, 20),
    state,
    savedAt,
    mailCursor,
  };
}

export function saveSeat(
  seat: Omit<SavedSeat, "version" | "savedAt" | "mailCursor"> & { savedAt?: number; mailCursor?: number | null },
): void {
  const store = db();
  if (!store) return;
  if (!ROOM.test(seat.room) || !PEER.test(seat.peerId)) return;
  const mailCursor =
    typeof seat.mailCursor === "number" && Number.isFinite(seat.mailCursor) && seat.mailCursor >= 0
      ? Math.min(Math.trunc(seat.mailCursor), Number.MAX_SAFE_INTEGER)
      : 0;
  const record: SavedSeat = {
    version: 1,
    room: seat.room,
    name: seat.name.trim().slice(0, 18) || "Player",
    role: seat.role,
    peerId: seat.peerId,
    state: seat.state,
    savedAt: seat.savedAt ?? Date.now(),
    mailCursor,
  };
  try {
    store.setItem(KEY, JSON.stringify(record));
  } catch {
    // A full or blocked store still lets the match continue in memory.
  }
}

export function clearSeat(): void {
  const store = db();
  if (!store) return;
  try {
    store.removeItem(KEY);
  } catch {
    // Already gone.
  }
}
