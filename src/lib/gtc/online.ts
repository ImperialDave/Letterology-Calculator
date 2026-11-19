import { pointsFor } from "@/lib/gtc/logic";
import { THEMES, themeById, type Theme } from "@/lib/gtc/themes";

export type AnswerWord = "yes" | "no" | "sort";

export type OLog = {
  id: string;
  kind: "q" | "g";
  text: string;
  answer?: AnswerWord | "right" | "wrong";
  note?: string;
  hint?: boolean;
};

export type Seat = {
  score: number;
  questions: number;
  wrongGuesses: number;
  hints: number;
  turnQuestions: number;
  solved: boolean;
  gaveUp: boolean;
  roundPoints: number | null;
  log: OLog[];
};

export type PhaseName =
  | "wait"
  | "theme"
  | "draft"
  | "ask"
  | "hold"
  | "watch"
  | "respond"
  | "solved"
  | "results";

export type Pending = { id: string; kind: "q" | "g"; text: string };

export type Wire =
  | { t: "hello"; name: string }
  | { t: "theme"; themeId: string; themeLine: string }
  | { t: "lock" }
  | { t: "start-draft"; themeId: string; themeLine: string }
  | { t: "begin"; first: "host" | "guest"; round: number }
  | { t: "notready" }
  | { t: "q"; id: string; text: string }
  | { t: "a"; id: string; answer: AnswerWord; note?: string; hint?: boolean }
  | { t: "g"; id: string; text: string }
  | { t: "j"; id: string; correct: boolean; character?: string; note?: string }
  | { t: "pass" }
  | { t: "giveup" }
  | { t: "reveal"; character: string; note?: string }
  | { t: "next" };

export type OnlineAction =
  | { type: "PEER"; name: string }
  | { type: "SET_THEIR_NAME"; name: string }
  | { type: "ROLL" }
  | { type: "PICK"; id: string }
  | { type: "SET_LINE"; line: string }
  | { type: "SHUFFLE" }
  | { type: "APPLY_THEME"; themeId: string; themeLine: string }
  | { type: "START_DRAFT" }
  | { type: "REMOTE_START"; themeId: string; themeLine: string }
  | { type: "SET_SECRET"; value: string }
  | { type: "SET_NOTE"; value: string }
  | { type: "LOCK" }
  | { type: "THEY_LOCK" }
  | { type: "BEGIN" }
  | { type: "REMOTE_BEGIN"; firstIsMe: boolean; round: number }
  | { type: "NOT_READY" }
  | { type: "MARK_STALE" }
  | { type: "SEND_Q"; id: string; text: string }
  | { type: "SEND_G"; id: string; text: string }
  | { type: "RECV_Q"; id: string; text: string }
  | { type: "RECV_G"; id: string; text: string }
  | { type: "ANSWER"; answer: AnswerWord; note: string; hint: boolean }
  | { type: "JUDGE"; correct: boolean }
  | { type: "RECV_A"; id: string; answer: AnswerWord; note?: string; hint?: boolean }
  | { type: "RECV_J"; id: string; correct: boolean; character?: string; note?: string }
  | { type: "PASS" }
  | { type: "RECV_PASS" }
  | { type: "GIVE_UP" }
  | { type: "RECV_GIVEUP" }
  | { type: "RECV_REVEAL"; character: string; note?: string }
  | { type: "CONTINUE" }
  | { type: "NEXT" }
  | { type: "RECV_NEXT" }
  | { type: "TOGGLE_SOUND" };

export type OnlineState = {
  phase: PhaseName;
  round: number;
  themeId: string;
  themeLine: string;
  examples: string[];
  exampleCursor: number;
  secret: string;
  note: string;
  iLocked: boolean;
  theyLocked: boolean;
  myCharacter: string | null;
  myNote: string | null;
  me: Seat;
  them: Seat;
  theirName: string;
  pending: Pending | null;
  afterSolved: "ask" | "watch" | "results";
  inbox: OnlineAction[];
  roundLive: boolean;
  sound: boolean;
  stale: boolean;
};

const QUEUED = new Set<OnlineAction["type"]>([
  "RECV_Q",
  "RECV_G",
  "RECV_A",
  "RECV_J",
  "RECV_PASS",
  "RECV_GIVEUP",
  "RECV_REVEAL",
]);

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function blankSeat(score: number): Seat {
  return {
    score,
    questions: 0,
    wrongGuesses: 0,
    hints: 0,
    turnQuestions: 0,
    solved: false,
    gaveUp: false,
    roundPoints: null,
    log: [],
  };
}

export function initialOnline(): OnlineState {
  const first = THEMES[0]!;
  return {
    phase: "wait",
    round: 1,
    themeId: first.id,
    themeLine: first.line,
    examples: first.examples,
    exampleCursor: 0,
    secret: "",
    note: "",
    iLocked: false,
    theyLocked: false,
    myCharacter: null,
    myNote: null,
    me: blankSeat(0),
    them: blankSeat(0),
    theirName: "",
    pending: null,
    afterSolved: "watch",
    inbox: [],
    roundLive: false,
    sound: true,
    stale: false,
  };
}

export function peekExamples(state: OnlineState): string[] {
  const list = state.examples;
  if (!list.length) return [];
  const count = Math.min(4, list.length);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) out.push(list[(state.exampleCursor + i) % list.length]!);
  return out;
}

function ok(state: OnlineState, out?: Wire | Wire[]): { state: OnlineState; out: Wire[] } {
  if (!out) return { state, out: [] };
  return { state, out: Array.isArray(out) ? out : [out] };
}

function themeOf(id: string, line: string): { themeId: string; themeLine: string; examples: string[] } {
  const known = themeById(id);
  return {
    themeId: known?.id ?? (id || "custom"),
    themeLine: line.slice(0, 80),
    examples: known?.examples ?? [],
  };
}

function withTheme(state: OnlineState, theme: Theme): OnlineState {
  return {
    ...state,
    phase: state.phase === "wait" ? "theme" : state.phase,
    themeId: theme.id,
    themeLine: theme.line,
    examples: theme.examples,
    exampleCursor: 0,
  };
}

function applyBegin(state: OnlineState, firstIsMe: boolean, round: number): OnlineState {
  return {
    ...state,
    round,
    phase: firstIsMe ? "ask" : "watch",
    roundLive: true,
    pending: null,
    inbox: [],
    afterSolved: "watch",
    myCharacter: null,
    myNote: null,
    me: blankSeat(state.me.score),
    them: blankSeat(state.them.score),
    stale: false,
  };
}

function advance(state: OnlineState): OnlineState {
  return {
    ...state,
    phase: "theme",
    round: state.round + 1,
    secret: "",
    note: "",
    iLocked: false,
    theyLocked: false,
    myCharacter: null,
    myNote: null,
    pending: null,
    inbox: [],
    roundLive: false,
    stale: false,
    me: blankSeat(state.me.score),
    them: blankSeat(state.them.score),
    afterSolved: "watch",
  };
}

function clipName(value: string): string {
  return value.trim().slice(0, 18);
}

export function step(
  state: OnlineState,
  action: OnlineAction,
  ctx: { isHost: boolean },
): { state: OnlineState; out: Wire[] } {
  if (state.phase === "solved" && QUEUED.has(action.type)) {
    return ok({ ...state, inbox: [...state.inbox, action] });
  }

  switch (action.type) {
    case "PEER":
    case "SET_THEIR_NAME": {
      const name = clipName(action.name) || state.theirName || "Friend";
      if (state.phase === "wait") return ok({ ...state, phase: "theme", theirName: name });
      return ok({ ...state, theirName: name });
    }
    case "ROLL": {
      if (state.phase !== "theme" && state.phase !== "wait") return ok(state);
      const pool = THEMES.filter((theme) => theme.id !== state.themeId);
      const theme = pool[Math.floor(Math.random() * pool.length)] ?? THEMES[0]!;
      const next = withTheme(state, theme);
      return ok(next, { t: "theme", themeId: next.themeId, themeLine: next.themeLine });
    }
    case "PICK": {
      if (state.phase !== "theme" && state.phase !== "wait") return ok(state);
      const theme = themeById(action.id);
      if (!theme) return ok(state);
      const next = withTheme(state, theme);
      return ok(next, { t: "theme", themeId: next.themeId, themeLine: next.themeLine });
    }
    case "SET_LINE": {
      if (state.phase !== "theme" && state.phase !== "wait") return ok(state);
      const line = action.line.slice(0, 80);
      const match = THEMES.find((theme) => theme.line.toLowerCase() === line.trim().toLowerCase());
      const next: OnlineState = {
        ...state,
        phase: state.phase === "wait" ? "theme" : state.phase,
        themeLine: line,
        themeId: match?.id ?? "custom",
        examples: match?.examples ?? [],
        exampleCursor: 0,
      };
      return ok(next, { t: "theme", themeId: next.themeId, themeLine: next.themeLine });
    }
    case "SHUFFLE":
      return ok({ ...state, exampleCursor: state.exampleCursor + 4 });
    case "APPLY_THEME": {
      if (state.phase !== "theme" && state.phase !== "wait") return ok(state);
      const theme = themeOf(action.themeId, action.themeLine);
      return ok({ ...state, phase: "theme", ...theme, exampleCursor: 0 });
    }
    case "START_DRAFT": {
      if ((state.phase !== "theme" && state.phase !== "wait") || !state.themeLine.trim()) return ok(state);
      const themeLine = state.themeLine.trim();
      return ok(
        {
          ...state,
          phase: "draft",
          themeLine,
          iLocked: false,
          theyLocked: false,
          secret: "",
          note: "",
          roundLive: false,
        },
        { t: "start-draft", themeId: state.themeId, themeLine },
      );
    }
    case "REMOTE_START": {
      const theme = themeOf(action.themeId, action.themeLine);
      if (state.roundLive || state.phase === "draft") return ok({ ...state, ...theme });
      if (state.phase === "ask" || state.phase === "results" || state.phase === "solved") return ok(state);
      return ok({
        ...state,
        phase: "draft",
        ...theme,
        exampleCursor: 0,
        secret: "",
        note: "",
        iLocked: false,
      });
    }
    case "SET_SECRET":
      if (state.phase !== "draft" || state.iLocked) return ok(state);
      return ok({ ...state, secret: action.value.slice(0, 48) });
    case "SET_NOTE":
      if (state.phase !== "draft" || state.iLocked) return ok(state);
      return ok({ ...state, note: action.value.slice(0, 140) });
    case "LOCK": {
      if (state.phase !== "draft" || !state.secret.trim()) return ok(state);
      return ok({ ...state, iLocked: true, secret: state.secret.trim() }, { t: "lock" });
    }
    case "THEY_LOCK":
      return ok({ ...state, theyLocked: true });
    case "BEGIN": {
      if (state.phase !== "draft" || !state.iLocked || !state.theyLocked || state.roundLive) return ok(state);
      const first: "host" | "guest" = state.round % 2 === 1 ? "host" : "guest";
      const firstIsMe = ctx.isHost ? first === "host" : first === "guest";
      return ok(applyBegin(state, firstIsMe, state.round), { t: "begin", first, round: state.round });
    }
    case "REMOTE_BEGIN": {
      if (state.roundLive && state.phase !== "draft") return ok(state);
      if (!state.iLocked || state.phase !== "draft") return ok({ ...state, stale: true });
      return ok(applyBegin(state, action.firstIsMe, action.round));
    }
    case "NOT_READY": {
      const started =
        state.me.questions + state.them.questions + state.me.wrongGuesses + state.them.wrongGuesses > 0 ||
        state.me.log.length + state.them.log.length > 0;
      if (started) return ok(state);
      if (state.phase !== "ask" && state.phase !== "watch" && state.phase !== "draft" && state.phase !== "hold") {
        return ok(state);
      }
      return ok({ ...state, phase: "draft", roundLive: false, theyLocked: false, pending: null });
    }
    case "MARK_STALE":
      return ok({ ...state, stale: true });
    case "SEND_Q":
    case "SEND_G": {
      if (state.phase !== "ask") return ok(state);
      const kind = action.type === "SEND_Q" ? "q" : "g";
      const text = action.text.trim().slice(0, kind === "q" ? 160 : 48);
      if (!text) return ok(state);
      const wire: Wire = kind === "q" ? { t: "q", id: action.id, text } : { t: "g", id: action.id, text };
      return ok({ ...state, phase: "hold", pending: { id: action.id, kind, text } }, wire);
    }
    case "RECV_Q":
    case "RECV_G": {
      if (state.phase === "hold" || state.phase === "respond" || state.phase === "results") return ok(state);
      if (state.phase === "draft" || state.phase === "theme" || state.phase === "wait") return ok(state);
      const kind = action.type === "RECV_Q" ? "q" : "g";
      const text = action.text.trim().slice(0, kind === "q" ? 160 : 48);
      if (!text) return ok(state);
      return ok({ ...state, phase: "respond", pending: { id: action.id, kind, text } });
    }
    case "ANSWER": {
      if (state.phase !== "respond" || !state.pending || state.pending.kind !== "q") return ok(state);
      const note = action.note.trim().slice(0, 140);
      const hint = Boolean(action.hint && note);
      const entry: OLog = {
        id: state.pending.id,
        kind: "q",
        text: state.pending.text,
        answer: action.answer,
        note: note || undefined,
        hint: hint || undefined,
      };
      return ok(
        {
          ...state,
          phase: "watch",
          pending: null,
          them: {
            ...state.them,
            questions: state.them.questions + 1,
            turnQuestions: state.them.turnQuestions + 1,
            hints: state.them.hints + (hint ? 1 : 0),
            log: [...state.them.log, entry],
          },
        },
        { t: "a", id: state.pending.id, answer: action.answer, note: note || undefined, hint },
      );
    }
    case "RECV_A": {
      if (state.phase !== "hold" || !state.pending || state.pending.kind !== "q" || state.pending.id !== action.id) {
        return ok(state);
      }
      const note = action.note?.trim().slice(0, 140) ?? "";
      const hint = Boolean(action.hint && note);
      const entry: OLog = {
        id: action.id,
        kind: "q",
        text: state.pending.text,
        answer: action.answer,
        note: note || undefined,
        hint: hint || undefined,
      };
      return ok({
        ...state,
        phase: "ask",
        pending: null,
        me: {
          ...state.me,
          questions: state.me.questions + 1,
          turnQuestions: state.me.turnQuestions + 1,
          hints: state.me.hints + (hint ? 1 : 0),
          log: [...state.me.log, entry],
        },
      });
    }
    case "JUDGE": {
      if (state.phase !== "respond" || !state.pending || state.pending.kind !== "g") return ok(state);
      if (!action.correct) {
        const entry: OLog = { id: state.pending.id, kind: "g", text: state.pending.text, answer: "wrong" };
        return ok(
          {
            ...state,
            phase: "watch",
            pending: null,
            them: {
              ...state.them,
              wrongGuesses: state.them.wrongGuesses + 1,
              log: [...state.them.log, entry],
            },
          },
          { t: "j", id: state.pending.id, correct: false },
        );
      }
      const roundPoints = pointsFor(state.them);
      const entry: OLog = { id: state.pending.id, kind: "g", text: state.pending.text, answer: "right" };
      const meDone = state.me.solved || state.me.gaveUp;
      return ok(
        {
          ...state,
          phase: meDone ? "results" : "ask",
          pending: null,
          me: meDone ? state.me : { ...state.me, turnQuestions: 0 },
          them: {
            ...state.them,
            solved: true,
            gaveUp: false,
            roundPoints,
            score: state.them.score + roundPoints,
            log: [...state.them.log, entry],
          },
        },
        {
          t: "j",
          id: state.pending.id,
          correct: true,
          character: state.secret,
          note: state.note.trim() || undefined,
        },
      );
    }
    case "RECV_J": {
      if (state.phase !== "hold" || !state.pending || state.pending.kind !== "g" || state.pending.id !== action.id) {
        return ok(state);
      }
      if (!action.correct) {
        const entry: OLog = { id: action.id, kind: "g", text: state.pending.text, answer: "wrong" };
        return ok({
          ...state,
          phase: "ask",
          pending: null,
          me: {
            ...state.me,
            wrongGuesses: state.me.wrongGuesses + 1,
            log: [...state.me.log, entry],
          },
        });
      }
      const roundPoints = pointsFor(state.me);
      const entry: OLog = { id: action.id, kind: "g", text: state.pending.text, answer: "right" };
      return ok({
        ...state,
        phase: "solved",
        pending: null,
        myCharacter: action.character?.trim() || state.myCharacter,
        myNote: action.note?.trim() || state.myNote,
        afterSolved: state.them.solved || state.them.gaveUp ? "results" : "watch",
        me: {
          ...state.me,
          solved: true,
          gaveUp: false,
          roundPoints,
          score: state.me.score + roundPoints,
          log: [...state.me.log, entry],
        },
      });
    }
    case "PASS": {
      if (state.phase !== "ask" || state.them.solved || state.them.gaveUp) return ok(state);
      return ok({ ...state, phase: "watch", them: { ...state.them, turnQuestions: 0 } }, { t: "pass" });
    }
    case "RECV_PASS": {
      if (state.phase !== "watch" && state.phase !== "respond") return ok(state);
      if (state.me.solved || state.me.gaveUp) {
        return ok({ ...state, phase: "results", pending: null });
      }
      return ok({ ...state, phase: "ask", pending: null, me: { ...state.me, turnQuestions: 0 } });
    }
    case "GIVE_UP": {
      if (state.phase !== "ask") return ok(state);
      return ok(
        {
          ...state,
          phase: "hold",
          pending: null,
          me: { ...state.me, gaveUp: true, solved: true, roundPoints: 0 },
        },
        { t: "giveup" },
      );
    }
    case "RECV_GIVEUP": {
      const them: Seat = { ...state.them, gaveUp: true, solved: true, roundPoints: 0 };
      const reveal: Wire = { t: "reveal", character: state.secret, note: state.note.trim() || undefined };
      if (state.me.solved || state.me.gaveUp) return ok({ ...state, them, phase: "results", pending: null }, reveal);
      return ok(
        { ...state, them, phase: "ask", pending: null, me: { ...state.me, turnQuestions: 0 } },
        reveal,
      );
    }
    case "RECV_REVEAL":
      return ok({
        ...state,
        phase: "solved",
        pending: null,
        myCharacter: action.character.trim() || state.myCharacter,
        myNote: action.note?.trim() || null,
        afterSolved: state.them.solved || state.them.gaveUp ? "results" : "watch",
        me: { ...state.me, gaveUp: true, solved: true, roundPoints: 0 },
      });
    case "CONTINUE": {
      if (state.phase !== "solved") return ok(state);
      let current: OnlineState = { ...state, phase: state.afterSolved, inbox: [], pending: null };
      const out: Wire[] = [];
      for (const queued of state.inbox) {
        const result = step(current, queued, ctx);
        current = result.state;
        out.push(...result.out);
      }
      return { state: current, out };
    }
    case "NEXT":
      if (state.phase !== "results") return ok(state);
      return ok(advance(state), { t: "next" });
    case "RECV_NEXT":
      if (state.phase !== "results") return ok(state);
      return ok(advance(state));
    case "TOGGLE_SOUND":
      return ok({ ...state, sound: !state.sound });
    default:
      return ok(state);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max) return null;
  return text;
}

export function parseWire(data: unknown): Wire | null {
  if (!isRecord(data) || typeof data.t !== "string") return null;
  switch (data.t) {
    case "hello": {
      const name = str(data.name, 18);
      return name ? { t: "hello", name } : null;
    }
    case "theme": {
      const themeId = str(data.themeId, 40) ?? "custom";
      const themeLine = str(data.themeLine, 80);
      return themeLine ? { t: "theme", themeId, themeLine } : null;
    }
    case "lock":
      return { t: "lock" };
    case "start-draft": {
      const themeId = str(data.themeId, 40) ?? "custom";
      const themeLine = str(data.themeLine, 80);
      return themeLine ? { t: "start-draft", themeId, themeLine } : null;
    }
    case "begin": {
      if (data.first !== "host" && data.first !== "guest") return null;
      if (typeof data.round !== "number" || data.round < 1 || data.round > 99) return null;
      return { t: "begin", first: data.first, round: Math.floor(data.round) };
    }
    case "notready":
      return { t: "notready" };
    case "q":
    case "g": {
      const id = str(data.id, 20);
      const text = str(data.text, data.t === "q" ? 160 : 48);
      if (!id || !text) return null;
      return data.t === "q" ? { t: "q", id, text } : { t: "g", id, text };
    }
    case "a": {
      const id = str(data.id, 20);
      if (!id || (data.answer !== "yes" && data.answer !== "no" && data.answer !== "sort")) return null;
      const note = typeof data.note === "string" ? data.note.trim().slice(0, 140) : undefined;
      return { t: "a", id, answer: data.answer, note: note || undefined, hint: data.hint === true };
    }
    case "j": {
      const id = str(data.id, 20);
      if (!id || typeof data.correct !== "boolean") return null;
      const character = typeof data.character === "string" ? data.character.trim().slice(0, 48) : undefined;
      const note = typeof data.note === "string" ? data.note.trim().slice(0, 140) : undefined;
      return { t: "j", id, correct: data.correct, character: character || undefined, note: note || undefined };
    }
    case "pass":
      return { t: "pass" };
    case "giveup":
      return { t: "giveup" };
    case "reveal": {
      const character = str(data.character, 48);
      if (!character) return null;
      const note = typeof data.note === "string" ? data.note.trim().slice(0, 140) : undefined;
      return { t: "reveal", character, note: note || undefined };
    }
    case "next":
      return { t: "next" };
    default:
      return null;
  }
}

export function snapshot(state: OnlineState, isHost: boolean): Wire[] {
  const wires: Wire[] = [];
  // The host's line is the one a reconnect should restore. A guest echo of an
  // older line would overwrite the roll that just happened on the host.
  if (isHost && state.themeLine.trim() && (state.phase === "theme" || state.phase === "draft" || state.roundLive)) {
    wires.push({ t: "theme", themeId: state.themeId, themeLine: state.themeLine.trim() });
  }
  if (isHost && (state.phase === "draft" || state.roundLive)) {
    wires.push({ t: "start-draft", themeId: state.themeId, themeLine: state.themeLine.trim() });
  }
  if (state.iLocked) wires.push({ t: "lock" });
  if (isHost && state.roundLive) {
    wires.push({
      t: "begin",
      first: state.round % 2 === 1 ? "host" : "guest",
      round: state.round,
    });
  }
  return wires;
}
