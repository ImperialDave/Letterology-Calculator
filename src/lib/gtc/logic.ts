import { THEMES, themeById, type Theme } from "@/lib/gtc/themes";
import { pointsFor } from "./name";

export { isStrongMatch, normalizeName, pointsFor } from "./name";

export type PID = 0 | 1;

export type AnswerWord = "yes" | "no" | "sort";

export type LogEntry = {
  id: number;
  kind: "q" | "g";
  text: string;
  answer?: AnswerWord | "right" | "wrong";
  note?: string;
  hint?: boolean;
};

export type Player = {
  name: string;
  score: number;
  character: string;
  note: string;
  solved: boolean;
  gaveUp: boolean;
  questions: number;
  wrongGuesses: number;
  hints: number;
  turnQuestions: number;
  roundPoints: number | null;
  log: LogEntry[];
};

export type Pending = {
  guesser: PID;
  kind: "q" | "g";
  text: string;
};

export type Intent =
  | { type: "draft"; player: PID }
  | { type: "ask"; player: PID }
  | { type: "answer" }
  | { type: "solved"; player: PID }
  | { type: "results" };

export type Phase =
  | { name: "lobby" }
  | {
      name: "handoff";
      to: PID;
      intent: Intent;
      canEdit: PID | null;
      kicker: string;
      title: string;
      body: string;
      button: string;
    }
  | { name: "draft"; player: PID }
  | { name: "ask"; player: PID; composing: "question" | "guess" }
  | { name: "answer" }
  | { name: "solved"; player: PID }
  | { name: "results" };

export type GameState = {
  round: number;
  recentThemeIds: string[];
  themeId: string;
  themeLine: string;
  examples: string[];
  exampleCursor: number;
  starter: PID;
  nextId: number;
  sound: boolean;
  pending: Pending | null;
  players: [Player, Player];
  phase: Phase;
};

export type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "SET_NAME"; player: PID; name: string }
  | { type: "SET_LINE"; line: string }
  | { type: "ROLL" }
  | { type: "PICK"; id: string }
  | { type: "SHUFFLE_EXAMPLES" }
  | { type: "BEGIN" }
  | { type: "ADVANCE" }
  | { type: "EDIT_DRAFT" }
  | { type: "SET_CHARACTER"; value: string }
  | { type: "SET_NOTE"; value: string }
  | { type: "LOCK" }
  | { type: "SET_COMPOSING"; composing: "question" | "guess" }
  | { type: "SUBMIT_TEXT"; text: string }
  | { type: "RESOLVE_QUESTION"; answer: AnswerWord; note: string; hint: boolean }
  | { type: "RESOLVE_GUESS"; correct: boolean }
  | { type: "PASS_TURN" }
  | { type: "GIVE_UP" }
  | { type: "CONTINUE" }
  | { type: "NEXT_ROUND" }
  | { type: "END_ROUND" }
  | { type: "RESET_MATCH" }
  | { type: "TOGGLE_SOUND" };

const PHASES = new Set(["lobby", "handoff", "draft", "ask", "answer", "solved", "results"]);

export function other(pid: PID): PID {
  return pid === 0 ? 1 : 0;
}

export function answerLabel(answer: LogEntry["answer"]): string {
  switch (answer) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "sort":
      return "Sort of";
    case "right":
      return "Correct";
    case "wrong":
      return "Not quite";
    default:
      return "";
  }
}

export function visibleExamples(state: GameState): string[] {
  const list = state.examples;
  if (!list.length) return [];
  const count = Math.min(4, list.length);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(list[(state.exampleCursor + i) % list.length]!);
  }
  return out;
}

function blankPlayer(name: string): Player {
  return {
    name,
    score: 0,
    character: "",
    note: "",
    solved: false,
    gaveUp: false,
    questions: 0,
    wrongGuesses: 0,
    hints: 0,
    turnQuestions: 0,
    roundPoints: null,
    log: [],
  };
}

function fresh(player: Player): Player {
  const name = player.name.trim() || "Player";
  return { ...blankPlayer(name), score: player.score };
}

function mapPlayer(players: [Player, Player], pid: PID, patch: Partial<Player>): [Player, Player] {
  const next: [Player, Player] = [players[0], players[1]];
  next[pid] = { ...next[pid], ...patch };
  return next;
}

type Handoff = Extract<Phase, { name: "handoff" }>;

function handoff(partial: Omit<Handoff, "name">): Handoff {
  return { name: "handoff", ...partial };
}

function rollFrom(state: GameState): Pick<
  GameState,
  "themeId" | "themeLine" | "examples" | "exampleCursor" | "recentThemeIds"
> {
  const recent = [state.themeId, ...state.recentThemeIds].filter((id) => id !== "custom").slice(0, 12);
  let pool = THEMES.filter((theme) => !recent.includes(theme.id));
  if (!pool.length) pool = THEMES.filter((theme) => theme.id !== state.themeId);
  if (!pool.length) pool = THEMES;
  const theme = pool[Math.floor(Math.random() * pool.length)] ?? THEMES[0]!;
  return {
    themeId: theme.id,
    themeLine: theme.line,
    examples: theme.examples,
    exampleCursor: 0,
    recentThemeIds: recent,
  };
}

function applyTheme(theme: Theme): Pick<GameState, "themeId" | "themeLine" | "examples" | "exampleCursor"> {
  return {
    themeId: theme.id,
    themeLine: theme.line,
    examples: theme.examples,
    exampleCursor: 0,
  };
}

export function initialState(): GameState {
  const first = THEMES[0]!;
  return {
    round: 1,
    recentThemeIds: [],
    themeId: first.id,
    themeLine: first.line,
    examples: first.examples,
    exampleCursor: 0,
    starter: 0,
    nextId: 1,
    sound: true,
    pending: null,
    players: [blankPlayer("Player 1"), blankPlayer("Player 2")],
    phase: { name: "lobby" },
  };
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const p = value as Player;
  return typeof p.name === "string" && typeof p.score === "number" && Array.isArray(p.log);
}

export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  if (!Array.isArray(s.players) || s.players.length !== 2) return false;
  if (!isPlayer(s.players[0]) || !isPlayer(s.players[1])) return false;
  if (!s.phase || typeof s.phase !== "object" || !PHASES.has(s.phase.name)) return false;
  if (typeof s.themeLine !== "string" || typeof s.round !== "number") return false;
  return true;
}

const SAVE_KEY = "gtc-save-v1";

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; state?: unknown };
    if (parsed.version !== 1 || !isGameState(parsed.state)) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function writeSave(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, state }));
  } catch {
    /* private mode / quota — the match still runs */
  }
}

function named(players: [Player, Player], pid: PID): string {
  return players[pid].name.trim() || (pid === 0 ? "Player 1" : "Player 2");
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE": {
      const next = action.state;
      if (next.phase.name === "answer" && !next.pending) {
        return { ...next, phase: { name: "lobby" }, pending: null };
      }
      return next;
    }
    case "SET_NAME": {
      const name = action.name.slice(0, 18);
      return { ...state, players: mapPlayer(state.players, action.player, { name }) };
    }
    case "SET_LINE": {
      const line = action.line.slice(0, 80);
      const match = THEMES.find((theme) => theme.line.toLowerCase() === line.trim().toLowerCase());
      if (match) {
        return { ...state, ...applyTheme(match), themeLine: line };
      }
      return { ...state, themeLine: line, themeId: "custom", examples: [], exampleCursor: 0 };
    }
    case "ROLL":
      return { ...state, ...rollFrom(state) };
    case "PICK": {
      const theme = themeById(action.id);
      if (!theme) return state;
      return { ...state, ...applyTheme(theme) };
    }
    case "SHUFFLE_EXAMPLES":
      if (state.examples.length <= 4) return state;
      return { ...state, exampleCursor: (state.exampleCursor + 4) % state.examples.length };
    case "TOGGLE_SOUND":
      return { ...state, sound: !state.sound };
    case "BEGIN": {
      if (!state.themeLine.trim()) return state;
      const players: [Player, Player] = [fresh(state.players[0]), fresh(state.players[1])];
      players[0].name = state.players[0].name.trim() || "Player 1";
      players[1].name = state.players[1].name.trim() || "Player 2";
      const starter = ((state.round - 1) % 2) as PID;
      return {
        ...state,
        players,
        starter,
        pending: null,
        nextId: 1,
        phase: handoff({
          to: 0,
          intent: { type: "draft", player: 0 },
          canEdit: null,
          kicker: "Private",
          title: `${players[0].name}, you pick first.`,
          body: `${players[1].name} looks away. You are choosing the character they have to guess — not your own.`,
          button: `I’m ${players[0].name}`,
        }),
      };
    }
    case "ADVANCE": {
      if (state.phase.name !== "handoff") return state;
      const intent = state.phase.intent;
      switch (intent.type) {
        case "draft":
          return { ...state, phase: { name: "draft", player: intent.player } };
        case "ask":
          return { ...state, phase: { name: "ask", player: intent.player, composing: "question" } };
        case "answer":
          if (!state.pending) return { ...state, phase: { name: "lobby" } };
          return { ...state, phase: { name: "answer" } };
        case "solved":
          return { ...state, phase: { name: "solved", player: intent.player } };
        case "results":
          return { ...state, phase: { name: "results" } };
        default:
          return state;
      }
    }
    case "EDIT_DRAFT": {
      if (state.phase.name !== "handoff" || state.phase.canEdit === null) return state;
      return { ...state, phase: { name: "draft", player: state.phase.canEdit } };
    }
    case "SET_CHARACTER": {
      if (state.phase.name !== "draft") return state;
      const target = other(state.phase.player);
      return {
        ...state,
        players: mapPlayer(state.players, target, { character: action.value.slice(0, 48) }),
      };
    }
    case "SET_NOTE": {
      if (state.phase.name !== "draft") return state;
      const target = other(state.phase.player);
      return {
        ...state,
        players: mapPlayer(state.players, target, { note: action.value.slice(0, 140) }),
      };
    }
    case "LOCK": {
      if (state.phase.name !== "draft") return state;
      const author = state.phase.player;
      const target = other(author);
      const character = state.players[target].character.trim();
      if (!character) return state;
      const players = mapPlayer(state.players, target, {
        character,
        note: state.players[target].note.trim(),
      });
      if (author === 0) {
        return {
          ...state,
          players,
          phase: handoff({
            to: 1,
            intent: { type: "draft", player: 1 },
            canEdit: 0,
            kicker: "Pass the phone",
            title: `Hand it to ${named(players, 1)}.`,
            body: `${named(players, 0)}, look away. ${named(players, 1)} is about to pick your character.`,
            button: `I’m ${named(players, 1)}`,
          }),
        };
      }
      if (state.starter === 1) {
        return {
          ...state,
          players,
          phase: { name: "ask", player: 1, composing: "question" },
        };
      }
      return {
        ...state,
        players,
        phase: handoff({
          to: state.starter,
          intent: { type: "ask", player: state.starter },
          canEdit: 1,
          kicker: "Both locked in",
          title: `${named(players, state.starter)} guesses first.`,
          body: `${named(players, other(state.starter))} picked that character and will answer. Eyes off until a question needs you.`,
          button: `I’m ${named(players, state.starter)}`,
        }),
      };
    }
    case "SET_COMPOSING": {
      if (state.phase.name !== "ask") return state;
      return { ...state, phase: { ...state.phase, composing: action.composing } };
    }
    case "SUBMIT_TEXT": {
      if (state.phase.name !== "ask") return state;
      const text = action.text.trim();
      if (!text) return state;
      const guesser = state.phase.player;
      const kind: "q" | "g" = state.phase.composing === "guess" ? "g" : "q";
      const answerer = other(guesser);
      return {
        ...state,
        pending: { guesser, kind, text: text.slice(0, 160) },
        phase: handoff({
          to: answerer,
          intent: { type: "answer" },
          canEdit: null,
          kicker: kind === "g" ? "A guess" : "A question",
          title: `${named(state.players, answerer)}, you’re answering.`,
          body: `${named(state.players, guesser)} should not see this screen. Take the phone, then open it.`,
          button: `I’m ${named(state.players, answerer)}`,
        }),
      };
    }
    case "RESOLVE_QUESTION": {
      if (state.phase.name !== "answer" || !state.pending || state.pending.kind !== "q") return state;
      const { guesser, text } = state.pending;
      const note = action.note.trim().slice(0, 120);
      const hint = Boolean(action.hint && note);
      const player = state.players[guesser];
      const entry: LogEntry = {
        id: state.nextId,
        kind: "q",
        text,
        answer: action.answer,
        note: note || undefined,
        hint,
      };
      const players = mapPlayer(state.players, guesser, {
        questions: player.questions + 1,
        turnQuestions: player.turnQuestions + 1,
        hints: player.hints + (hint ? 1 : 0),
        log: [...player.log, entry],
      });
      return {
        ...state,
        players,
        nextId: state.nextId + 1,
        pending: null,
        phase: handoff({
          to: guesser,
          intent: { type: "ask", player: guesser },
          canEdit: null,
          kicker: "Answer locked",
          title: `Back to ${named(players, guesser)}.`,
          body: `${named(players, other(guesser))}, look away before the answer lands in the log.`,
          button: `I’m ${named(players, guesser)}`,
        }),
      };
    }
    case "RESOLVE_GUESS": {
      if (state.phase.name !== "answer" || !state.pending || state.pending.kind !== "g") return state;
      const { guesser, text } = state.pending;
      const player = state.players[guesser];
      if (!action.correct) {
        const entry: LogEntry = { id: state.nextId, kind: "g", text, answer: "wrong" };
        const players = mapPlayer(state.players, guesser, {
          wrongGuesses: player.wrongGuesses + 1,
          log: [...player.log, entry],
        });
        return {
          ...state,
          players,
          nextId: state.nextId + 1,
          pending: null,
          phase: handoff({
            to: guesser,
            intent: { type: "ask", player: guesser },
            canEdit: null,
            kicker: "Not that",
            title: `Back to ${named(players, guesser)}.`,
            body: "The guess missed. Don’t say the real name out loud.",
            button: `I’m ${named(players, guesser)}`,
          }),
        };
      }
      const roundPoints = pointsFor(player);
      const entry: LogEntry = { id: state.nextId, kind: "g", text, answer: "right" };
      const players = mapPlayer(state.players, guesser, {
        solved: true,
        gaveUp: false,
        roundPoints,
        score: player.score + roundPoints,
        log: [...player.log, entry],
      });
      return {
        ...state,
        players,
        nextId: state.nextId + 1,
        pending: null,
        phase: handoff({
          to: guesser,
          intent: { type: "solved", player: guesser },
          canEdit: null,
          kicker: "They got it",
          title: `Hand it back to ${named(players, guesser)}.`,
          body: "The reveal is on the next screen. Don’t spoil the points.",
          button: `I’m ${named(players, guesser)}`,
        }),
      };
    }
    case "PASS_TURN": {
      if (state.phase.name !== "ask") return state;
      const pid = state.phase.player;
      const opp = other(pid);
      if (state.players[opp].solved) return state;
      const players = mapPlayer(state.players, opp, { turnQuestions: 0 });
      return {
        ...state,
        players,
        phase: handoff({
          to: opp,
          intent: { type: "ask", player: opp },
          canEdit: null,
          kicker: "Turn over",
          title: `${named(players, opp)}, you’re guessing.`,
          body: `${named(players, pid)}, you answer from here. Look away until a question shows up.`,
          button: `I’m ${named(players, opp)}`,
        }),
      };
    }
    case "GIVE_UP": {
      if (state.phase.name !== "ask") return state;
      const pid = state.phase.player;
      const players = mapPlayer(state.players, pid, {
        solved: true,
        gaveUp: true,
        roundPoints: 0,
      });
      return { ...state, players, pending: null, phase: { name: "solved", player: pid } };
    }
    case "CONTINUE": {
      if (state.phase.name !== "solved") return state;
      const pid = state.phase.player;
      const opp = other(pid);
      if (!state.players[opp].solved) {
        const players = mapPlayer(state.players, opp, { turnQuestions: 0 });
        return {
          ...state,
          players,
          phase: handoff({
            to: opp,
            intent: { type: "ask", player: opp },
            canEdit: null,
            kicker: "Still in it",
            title: `${named(players, opp)}, your turn.`,
            body: `${named(players, pid)} is finished. Look away until you are asked to answer.`,
            button: `I’m ${named(players, opp)}`,
          }),
        };
      }
      return {
        ...state,
        phase: handoff({
          to: pid,
          intent: { type: "results" },
          canEdit: null,
          kicker: "Round over",
          title: "Both of you can look.",
          body: "The next screen names both characters and the points.",
          button: "Show the round",
        }),
      };
    }
    case "NEXT_ROUND": {
      const players: [Player, Player] = [fresh(state.players[0]), fresh(state.players[1])];
      return {
        ...state,
        ...rollFrom(state),
        round: state.round + 1,
        players,
        pending: null,
        phase: { name: "lobby" },
      };
    }
    case "END_ROUND": {
      const players: [Player, Player] = [fresh(state.players[0]), fresh(state.players[1])];
      return { ...state, players, pending: null, phase: { name: "lobby" } };
    }
    case "RESET_MATCH": {
      const names: [string, string] = [
        state.players[0].name.trim() || "Player 1",
        state.players[1].name.trim() || "Player 2",
      ];
      return {
        ...initialState(),
        sound: state.sound,
        themeId: state.themeId,
        themeLine: state.themeLine,
        examples: state.examples,
        exampleCursor: state.exampleCursor,
        players: [blankPlayer(names[0]), blankPlayer(names[1])],
      };
    }
    default:
      return state;
  }
}
