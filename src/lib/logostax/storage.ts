import { normalizeClock } from "./clock";
import { answerFor, type Lexicon } from "./lexicon";
import {
  freshSession,
  isLength,
  maxGuesses,
  puzzleIdFor,
  utcDate,
  WORD_OF_THE_DAY_LENGTH,
  type Kind,
  type Mode,
  type Session,
  type Settings,
  type Status,
} from "./engine";
import {
  mergeRemote,
  upsertEntry,
  withSynced,
  type HistoryEntry,
} from "./history";

const SETTINGS_KEY = "fivefold-settings-v1";
const STATS_KEY = "fivefold-stats-v1";
const HISTORY_KEY = "fivefold-history-v1";

export type LengthStats = {
  played: number;
  won: number;
  streak: number;
  best: number;
  dist: number[];
  lastDate: string | null;
};

export type StatsFile = {
  version: 1;
  byLength: Record<string, LengthStats>;
};

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  length: WORD_OF_THE_DAY_LENGTH,
  mode: "today",
  hard: false,
};

export function emptyLengthStats(): LengthStats {
  return { played: 0, won: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0, 0, 0], lastDate: null };
}

export function winPct(stats: LengthStats): number {
  if (!stats.played) return 0;
  return Math.round((100 * stats.won) / stats.played);
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function slotKey(kind: Kind, length: number) {
  return kind === "deal" ? `fivefold-game-v1:deal:${length}` : `fivefold-game-v1:daily:${length}`;
}

export function loadSettings(): Settings {
  const raw = read(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as { length?: unknown; mode?: string; hard?: unknown };
    const length = typeof parsed.length === "number" && isLength(parsed.length) ? parsed.length : WORD_OF_THE_DAY_LENGTH;
    const rawMode = parsed.mode;
    let mode: Mode = "today";
    if (rawMode === "open" || rawMode === "practice") mode = "open";
    else if (rawMode === "daily" && length !== WORD_OF_THE_DAY_LENGTH) mode = "open";
    return { version: 1, length, mode, hard: parsed.hard === true };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings) {
  write(SETTINGS_KEY, JSON.stringify(settings));
}

function isStatus(value: unknown): value is Status {
  return value === "playing" || value === "won" || value === "lost";
}

function isKind(value: unknown): value is Kind {
  return value === "table" || value === "deal";
}

export function coerceSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<Session> & { mode?: string };
  if (typeof parsed.answer !== "string" || !Array.isArray(parsed.guesses)) return null;
  const length = typeof parsed.length === "number" ? parsed.length : parsed.answer.length;
  if (!isLength(length)) return null;
  let kind: Kind;
  if (isKind(parsed.kind)) kind = parsed.kind;
  else if (parsed.mode === "practice" || parsed.mode === "open") kind = "deal";
  else kind = "table";
  const date = typeof parsed.date === "string" ? parsed.date : "";
  const guesses = parsed.guesses.filter((guess): guess is string => typeof guess === "string");
  const draft = typeof parsed.draft === "string" ? parsed.draft : "";
  const status: Status = isStatus(parsed.status) ? parsed.status : "playing";
  const puzzleId =
    typeof parsed.puzzleId === "string" && parsed.puzzleId
      ? parsed.puzzleId
      : kind === "deal"
        ? `deal:${length}:${date || "x"}:legacy`
        : puzzleIdFor("table", length, date || "x");
  return {
    length,
    kind,
    answer: parsed.answer,
    date,
    guesses,
    draft,
    status,
    recorded: parsed.recorded === true,
    elapsedMs: typeof parsed.elapsedMs === "number" && Number.isFinite(parsed.elapsedMs) ? Math.max(0, parsed.elapsedMs) : 0,
    runningSince: typeof parsed.runningSince === "number" ? parsed.runningSince : null,
    puzzleId,
  };
}

function validSession(session: Session, lex: Lexicon, kind: Kind, length: number, today: string): boolean {
  if (session.kind !== kind || session.length !== length) return false;
  if (session.answer.length !== length || !lex.guess.has(session.answer)) return false;
  if (!/^[a-z]+$/.test(session.answer)) return false;
  if (kind === "table") {
    if (session.date !== today) return false;
    if (session.answer !== answerFor(lex, "daily", today)) return false;
  }
  if (session.guesses.length > maxGuesses(length)) return false;
  if (session.guesses.some((g) => g.length !== length || !/^[a-z]+$/.test(g))) return false;
  if (session.draft && (session.draft.length > length || !/^[a-z]+$/.test(session.draft))) return false;
  if (session.status === "won" && session.guesses.at(-1) !== session.answer) return false;
  if (session.status === "playing" && session.guesses.some((g) => g === session.answer)) return false;
  if (session.status === "playing" && session.guesses.length >= maxGuesses(length)) return false;
  if (session.status === "lost" && session.guesses.length < maxGuesses(length)) return false;
  if (session.status === "lost" && session.guesses.at(-1) === session.answer) return false;
  return true;
}

function readSlot(kind: Kind, length: number): Session | null {
  const primary = coerceSession(parseRaw(read(slotKey(kind, length))));
  if (primary) return primary;
  if (kind === "deal") return coerceSession(parseRaw(read(`fivefold-game-v1:practice:${length}`)));
  return null;
}

function parseRaw(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGame(session: Session) {
  write(slotKey(session.kind, session.length), JSON.stringify(session));
}

export function settleClock(session: Session, now = Date.now()): Session {
  const started = session.guesses.length > 0 || session.draft.length > 0 || session.elapsedMs > 0;
  if (session.status !== "playing") {
    if (session.runningSince == null) return session;
    const elapsed = session.elapsedMs + Math.max(0, now - session.runningSince);
    return { ...session, elapsedMs: elapsed, runningSince: null };
  }
  const clock = normalizeClock({ elapsedMs: session.elapsedMs, runningSince: session.runningSince }, started, now);
  return { ...session, elapsedMs: clock.elapsedMs, runningSince: clock.runningSince };
}

export function resolveSession(settings: Settings, lex: Lexicon, today = utcDate()): Session {
  const length = settings.mode === "today" ? WORD_OF_THE_DAY_LENGTH : settings.length;
  if (lex.length !== length) {
    throw new Error("The word list doesn't match that length.");
  }
  if (settings.mode === "open") {
    const deal = readSlot("deal", length);
    if (deal && validSession(deal, lex, "deal", length, today) && deal.status === "playing") {
      return settleClock(deal);
    }
  }
  const table = readSlot("table", length);
  if (table && validSession(table, lex, "table", length, today)) return settleClock(table);
  return freshSession({
    length,
    kind: "table",
    answer: answerFor(lex, "daily", today),
    date: today,
    puzzleId: puzzleIdFor("table", length, today),
  });
}

export function dealSession(lex: Lexicon, length: number, today: string, avoid: string[] = []): Session {
  if (lex.length !== length) throw new Error("The word list doesn't match that length.");
  return freshSession({
    length,
    kind: "deal",
    answer: answerFor(lex, "practice", today, avoid),
    date: today,
  });
}

export function loadStats(): StatsFile {
  const raw = read(STATS_KEY);
  if (!raw) return { version: 1, byLength: {} };
  try {
    const parsed = JSON.parse(raw) as StatsFile;
    if (!parsed || parsed.version !== 1 || typeof parsed.byLength !== "object" || !parsed.byLength) {
      return { version: 1, byLength: {} };
    }
    return parsed;
  } catch {
    return { version: 1, byLength: {} };
  }
}

export function archivePlayed(): number {
  const stats = loadStats();
  return Object.values(stats.byLength).reduce((sum, row) => sum + (row?.played || 0), 0);
}

function coerceEntry(raw: unknown): HistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<HistoryEntry>;
  if (typeof entry.puzzleId !== "string" || typeof entry.answer !== "string") return null;
  if (entry.status !== "won" && entry.status !== "lost") return null;
  if (entry.kind !== "table" && entry.kind !== "deal") return null;
  if (typeof entry.length !== "number" || typeof entry.guesses !== "number" || typeof entry.elapsedMs !== "number") return null;
  return {
    puzzleId: entry.puzzleId,
    answer: entry.answer,
    length: entry.length,
    kind: entry.kind,
    date: typeof entry.date === "string" ? entry.date : "",
    status: entry.status,
    guesses: entry.guesses,
    elapsedMs: Math.max(0, entry.elapsedMs),
    hard: entry.hard === true,
    at: typeof entry.at === "number" ? entry.at : 0,
    synced: entry.synced === true,
  };
}

export function loadHistory(): HistoryEntry[] {
  const raw = read(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceEntry).filter((entry): entry is HistoryEntry => entry != null);
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  write(HISTORY_KEY, JSON.stringify(entries));
}

export function rememberResult(session: Session, hard: boolean, now = Date.now()): { session: Session; history: HistoryEntry[]; entry: HistoryEntry | null } {
  const history = loadHistory();
  if (session.status === "playing" || session.recorded) return { session, history, entry: null };
  const next = { ...session, recorded: true, runningSince: null };
  saveGame(next);
  const entry: HistoryEntry = {
    puzzleId: next.puzzleId,
    answer: next.answer,
    length: next.length,
    kind: next.kind,
    date: next.date,
    status: next.status === "lost" ? "lost" : "won",
    guesses: next.guesses.length,
    elapsedMs: next.elapsedMs,
    hard,
    at: now,
    synced: false,
  };
  const updated = upsertEntry(history, entry);
  saveHistory(updated);
  return { session: next, history: updated, entry };
}

export function replaceHistory(entries: HistoryEntry[]) {
  saveHistory(entries);
  return entries;
}

export function markHistorySynced(ids: readonly string[]) {
  const next = withSynced(loadHistory(), ids);
  saveHistory(next);
  return next;
}

export function absorbRemote(remote: HistoryEntry[]) {
  const next = mergeRemote(loadHistory(), remote);
  saveHistory(next);
  return next;
}
