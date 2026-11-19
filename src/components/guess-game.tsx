import { useEffect, useReducer, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { Dices, Volume2, VolumeX } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { GtcChip, GtcPortrait, GtcTicket, GtcWordmark, gtcAnswerClass } from "@/components/gtc-mark";
import { THEMES } from "@/lib/gtc/themes";
import {
  answerLabel,
  initialState,
  isStrongMatch,
  loadSave,
  other,
  pointsFor,
  reducer,
  visibleExamples,
  writeSave,
  type GameState,
  type LogEntry,
  type PID,
  type Player,
} from "@/lib/gtc/logic";

function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

function chime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02 + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + i * 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + 0.32 + i * 0.08);
    });
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio is optional */
  }
}

function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
}) {
  return (
    <button
      type={type}
      className={cn(
        "gtc-btn press",
        variant === "primary" && "gtc-btn-primary",
        variant === "secondary" && "gtc-btn-secondary",
        variant === "quiet" && "gtc-btn-quiet",
        className,
      )}
      {...props}
    />
  );
}

function fieldClass(extra?: string) {
  return cn("gtc-field", extra);
}

function eyesOn(state: GameState): PID | null {
  const phase = state.phase;
  switch (phase.name) {
    case "draft":
    case "ask":
    case "solved":
      return phase.player;
    case "handoff":
      return phase.to;
    case "answer":
      return state.pending ? other(state.pending.guesser) : null;
    default:
      return null;
  }
}

function counterCopy(state: GameState): string | null {
  if (state.phase.name === "lobby" || state.phase.name === "results") return null;
  const phase = state.phase;
  const guesser =
    phase.name === "ask"
      ? phase.player
      : phase.name === "answer"
        ? (state.pending?.guesser ?? null)
        : phase.name === "handoff" && phase.intent.type === "ask"
          ? phase.intent.player
          : phase.name === "solved"
            ? phase.player
            : null;
  if (guesser === null) {
    const [a, b] = state.players;
    return `${a.name} ${a.questions} Q · ${b.name} ${b.questions} Q`;
  }
  const player = state.players[guesser];
  return `${player.name} · this turn ${player.turnQuestions} · round ${player.questions}`;
}

function ScoreBar({ state, onRules }: { state: GameState; onRules: () => void }) {
  const eyes = eyesOn(state);
  const counter = counterCopy(state);
  return (
    <header className="gtc-hud shrink-0">
      <div className="gtc-hud-top">
        <GtcWordmark compact />
        <button type="button" onClick={onRules} className="gtc-rules press">
          Rules
        </button>
      </div>
      <p className="gtc-round">Round {state.round}</p>
      <div className="gtc-plates">
        {state.players.map((player, index) => {
          const pid = index as PID;
          const hot = eyes === pid;
          return (
            <p key={pid} className={cn("gtc-plate", hot ? (pid === 0 ? "gtc-plate-me" : "gtc-plate-them") : "gtc-plate-idle")}>
              <span className="gtc-plate-name">{player.name || (pid === 0 ? "Player 1" : "Player 2")}</span>
              <span className="gtc-plate-score">{player.score}</span>
            </p>
          );
        })}
      </div>
      {counter ? <p className="text-xs text-muted tabular-nums">{counter}</p> : null}
    </header>
  );
}

function ThemeLine({ line }: { line: string }) {
  return <GtcTicket line={line} />;
}

function LogList({ entries }: { entries: LogEntry[] }) {
  if (!entries.length) {
    return (
      <p className="py-6 text-sm text-muted">
        Nothing asked yet. Rule out a crowd before you name anyone — the obvious pick is usually the trap.
      </p>
    );
  }
  return (
    <ol className="gtc-log">
      {entries.map((entry) => (
        <li key={entry.id} className="rise">
          <p className="text-sm font-bold">{entry.kind === "g" ? "Guess" : "Question"}</p>
          <p className="mt-1 text-base">{entry.text}</p>
          {entry.answer ? <p className={gtcAnswerClass(entry.answer)}>{answerLabel(entry.answer)}</p> : null}
          {entry.note ? (
            <p className="mt-1 text-sm text-muted">
              {entry.hint ? "Hint — " : null}
              {entry.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function HandoffScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  const phase = state.phase;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 700);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase.name !== "handoff") return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center py-8">
        <GtcChip>{phase.kicker}</GtcChip>
        <h2 className="gtc-title mt-3">{phase.title}</h2>
        <p className="mt-4 max-w-md text-base text-muted">{phase.body}</p>
      </div>
      <div className="flex flex-col gap-2 pb-4">
        {phase.canEdit !== null ? (
          <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: "EDIT_DRAFT" })}>
            Edit the character I picked
          </Button>
        ) : null}
        <Button className="w-full" disabled={!ready} onClick={() => dispatch({ type: "ADVANCE" })}>
          {ready ? phase.button : "Look up first"}
        </Button>
      </div>
    </div>
  );
}

function Lobby({
  state,
  dispatch,
  onLeave,
  onRules,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
  onLeave?: () => void;
  onRules: () => void;
}) {
  const examples = visibleExamples(state);
  const lineRef = useRef<HTMLInputElement>(null);
  const canStart = state.themeLine.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex justify-end">
        <button type="button" className="gtc-rules press" onClick={onRules}>
          Rules
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <GtcWordmark heading />
        <GtcChip>One phone</GtcChip>
        <p className="gtc-lede">
          A theme wide enough to be useless. You each hide a character for the other person, then try to
          guess the one they hid for you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((pid) => (
          <label key={pid} className="block">
            <span className={pid === 0 ? "gtc-chip gtc-chip-gold" : "gtc-chip"}>{pid === 0 ? "Player 1" : "Player 2"}</span>
            <input
              id={pid === 0 ? "p1-name" : "p2-name"}
              value={state.players[pid].name}
              maxLength={18}
              autoComplete="off"
              onChange={(event) => dispatch({ type: "SET_NAME", player: pid, name: event.target.value })}
              className={fieldClass("mt-2")}
            />
          </label>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="gtc-label">The theme</p>
          <span className="text-xs text-faint tabular-nums">{THEMES.length} in the deck</span>
        </div>
        <label className="sr-only" htmlFor="theme-line">
          Both of your characters
        </label>
        <input
          id="theme-line"
          ref={lineRef}
          value={state.themeLine}
          maxLength={80}
          onChange={(event) => dispatch({ type: "SET_LINE", line: event.target.value })}
          className={fieldClass("gtc-field-ticket")}
          placeholder="cannot swim"
        />
        {examples.length ? (
          <p className="mt-3 text-sm text-muted">Fits, for instance: {examples.join(" · ")}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">Your theme. Anyone who truly fits is fair game.</p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: "ROLL" })}>
            <Dices className="size-4" aria-hidden="true" />
            New theme
          </Button>
          {state.examples.length > 4 ? (
            <Button
              variant="secondary"
              className="w-full rounded-sm"
              onClick={() => dispatch({ type: "SHUFFLE_EXAMPLES" })}
            >
              More examples
            </Button>
          ) : null}
        </div>
        <details className="mt-4">
          <summary className="text-sm text-muted">Choose from the list</summary>
          <ul className="mt-2 max-h-52 overflow-y-auto">
            {THEMES.map((theme) => {
              const selected = theme.id === state.themeId;
              return (
                <li key={theme.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "PICK", id: theme.id })}
                    className={cn("gtc-pick", selected && "is-on")}
                  >
                    {theme.line}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      <Button id="start-round" className="w-full" disabled={!canStart} onClick={() => dispatch({ type: "BEGIN" })}>
        Start round
      </Button>
      {onLeave ? (
        <Button variant="quiet" className="w-full" onClick={onLeave}>
          Play on two phones instead
        </Button>
      ) : null}
      <p className="text-sm text-faint">
        Inspired by the Guess the Character bits. No accounts, no automatic answers — the person next to you
        is the judge.
      </p>
    </div>
  );
}

function DraftScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  const phase = state.phase;
  const [error, setError] = useState("");
  if (phase.name !== "draft") return null;
  const author = phase.player;
  const target = other(author);
  const secret = state.players[target];
  const examples = visibleExamples(state);

  return (
    <form
      className="flex flex-1 flex-col gap-4 overflow-y-auto py-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!secret.character.trim()) {
          setError("Name a character before you hand the phone over.");
          return;
        }
        setError("");
        dispatch({ type: "LOCK" });
      }}
    >
      <GtcChip>Only you look</GtcChip>
      <h2 className="gtc-title">Pick {state.players[target].name}’s character.</h2>
      <p className="text-base text-muted">
        They have to guess this. You will answer. {state.players[target].name} must not see this screen.
      </p>
      <ThemeLine line={state.themeLine} />
      {examples.length ? (
        <p className="text-sm text-muted">
          Inspiration, not the assignment: {examples.join(" · ")}. The poster child is usually a trap.
        </p>
      ) : null}
      <GtcPortrait kicker="Their character" seat={author === 0 ? "them" : "me"}>
        <label className="sr-only" htmlFor="character-input">
          Their character
        </label>
        <input
          id="character-input"
          autoFocus
          value={secret.character}
          maxLength={48}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            setError("");
            dispatch({ type: "SET_CHARACTER", value: event.target.value });
          }}
          className={fieldClass("gtc-field-name")}
          placeholder="Not the obvious one"
        />
      </GtcPortrait>
      <label className="block" htmlFor="note-input">
        <span className="gtc-label">Private reminder, optional</span>
        <textarea
          id="note-input"
          value={secret.note}
          maxLength={140}
          rows={2}
          onChange={(event) => dispatch({ type: "SET_NOTE", value: event.target.value })}
          className={fieldClass("mt-2 resize-none")}
          placeholder="Only you see this when you answer. They never do."
        />
      </label>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-auto w-full">
        Lock it in
      </Button>
    </form>
  );
}

function AskScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  const phase = state.phase;
  const [text, setText] = useState("");
  const [giveUp, setGiveUp] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const player = phase.name === "ask" ? state.players[phase.player] : null;
  const logLen = player?.log.length ?? 0;

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [logLen]);

  if (phase.name !== "ask" || !player) return null;
  const guessing = phase.composing === "guess";
  const opp = state.players[other(phase.player)];
  const worth = pointsFor(player);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThemeLine line={state.themeLine} />
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <p className="text-sm">
          <span className={phase.player === 0 ? "text-p1" : "text-p2"}>{player.name}</span>
          <span className="text-muted"> is guessing</span>
        </p>
        <p className="text-xs text-muted tabular-nums">Worth {worth} now</p>
      </div>
      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <LogList entries={player.log} />
      </div>
      <form
        className="shrink-0 border-t border-border pt-3 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          const value = text.trim();
          if (!value) return;
          dispatch({ type: "SUBMIT_TEXT", text: value });
          setText("");
        }}
      >
        <label className="sr-only" htmlFor="question-input">
          {guessing ? "Your guess" : "Yes or no question"}
        </label>
        <div className="flex gap-2">
          <input
            id="question-input"
            value={text}
            maxLength={160}
            onChange={(event) => setText(event.target.value)}
            placeholder={guessing ? "Name the character" : "Ask a yes or no question"}
            className={fieldClass()}
            autoComplete="off"
          />
          <Button type="submit" className="shrink-0 rounded-sm px-5" disabled={!text.trim()}>
            {guessing ? "Guess" : "Ask"}
          </Button>
        </div>
        {guessing ? <p className="mt-2 text-xs text-muted">A miss costs 2 points. Spelling can be loose.</p> : null}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="w-full rounded-sm"
            onClick={() => {
              setText("");
              dispatch({ type: "SET_COMPOSING", composing: guessing ? "question" : "guess" });
            }}
          >
            {guessing ? "Back to questions" : "Make a guess"}
          </Button>
          {opp.solved ? (
            <p className="flex items-center justify-center text-center text-xs text-muted">
              You’re the last one guessing.
            </p>
          ) : (
            <Button variant="secondary" className="w-full rounded-sm" onClick={() => dispatch({ type: "PASS_TURN" })}>
              Pass the turn
            </Button>
          )}
        </div>
        {giveUp ? (
          <div className="gtc-sheet mt-3">
            <p className="text-sm">Give up and score 0? Your character gets revealed.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="quiet" onClick={() => setGiveUp(false)}>
                Keep going
              </Button>
              <Button variant="secondary" className="rounded-sm text-danger" onClick={() => dispatch({ type: "GIVE_UP" })}>
                Reveal it
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="mt-3 text-sm text-faint hover:text-muted"
            onClick={() => setGiveUp(true)}
          >
            Give up this character
          </button>
        )}
      </form>
    </div>
  );
}

function AnswerScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  const pending = state.pending;
  const [note, setNote] = useState("");
  const [hint, setHint] = useState(false);
  const [words, setWords] = useState(false);
  if (state.phase.name !== "answer" || !pending) return null;
  const guesser = state.players[pending.guesser];
  const answerer = state.players[other(pending.guesser)];
  const strong = pending.kind === "g" && isStrongMatch(pending.text, guesser.character);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-5">
      <GtcChip>
        {answerer.name} answering for {guesser.name}
      </GtcChip>
      <GtcPortrait name={guesser.character} note={guesser.note} kicker="Their character" seat="them" />
      <ThemeLine line={state.themeLine} />
      <div className="gtc-quote">
        <p className="gtc-quote-kicker">{pending.kind === "g" ? "They guessed" : "They asked"}</p>
        <p className="gtc-quote-line">{pending.text}</p>
      </div>
      {pending.kind === "q" ? (
        <>
          {guesser.log.length ? (
            <details>
              <summary className="text-sm text-muted">Questions so far</summary>
              <LogList entries={guesser.log} />
            </details>
          ) : null}
          <button type="button" className="self-start text-sm text-muted" onClick={() => setWords((open) => !open)}>
            {words ? "No extra words" : "Add a few words"}
          </button>
          {words ? (
            <div className="flex flex-col gap-3">
              <input
                value={note}
                maxLength={120}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Only in the sequel"
                className={fieldClass()}
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="check"
                  checked={hint}
                  onChange={(event) => setHint(event.target.checked)}
                />
                This is a hint. It costs them a point.
              </label>
            </div>
          ) : null}
          <div className="mt-auto grid gap-2">
            {(["yes", "no", "sort"] as const).map((answer) => (
              <Button
                key={answer}
                variant="secondary"
                className={cn(
                  "gtc-choice w-full",
                  answer === "yes" && "gtc-choice-yes",
                  answer === "no" && "gtc-choice-no",
                  answer === "sort" && "gtc-choice-sort",
                )}
                onClick={() =>
                  dispatch({
                    type: "RESOLVE_QUESTION",
                    answer,
                    note,
                    hint: hint && note.trim().length > 0,
                  })
                }
              >
                {answer === "yes" ? "Yes" : answer === "no" ? "No" : "Sort of"}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            {strong
              ? "Spelling is close enough to count, if you agree it’s the same character."
              : "Not an obvious spelling match. Aliases still count if you say so."}
          </p>
          <div className="mt-auto grid gap-2">
            <Button className="w-full" onClick={() => dispatch({ type: "RESOLVE_GUESS", correct: true })}>
              Correct
            </Button>
            <Button
              variant="secondary"
              className="w-full rounded-sm"
              onClick={() => dispatch({ type: "RESOLVE_GUESS", correct: false })}
            >
              Not quite
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function tally(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function scoreBits(player: Player): string {
  if (player.gaveUp) return "Gave up · 0";
  const bits = ["12"];
  if (player.questions) {
    bits.push(`− ${player.questions} for ${player.questions === 1 ? "a question" : "questions"}`);
  }
  if (player.wrongGuesses) {
    bits.push(`− ${player.wrongGuesses * 2} for ${player.wrongGuesses === 1 ? "a miss" : "misses"}`);
  }
  if (player.hints) bits.push(`− ${player.hints} for ${player.hints === 1 ? "a hint" : "hints"}`);
  return bits.join(" ");
}

function SolvedScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  if (state.phase.name !== "solved") return null;
  const player = state.players[state.phase.player];
  const opp = state.players[other(state.phase.player)];
  return (
    <div className="flex flex-1 flex-col gap-4 py-8">
      <GtcChip>{player.gaveUp ? "Revealed" : "That’s the one"}</GtcChip>
      <GtcPortrait name={player.character} kicker={player.name} seat="me" />
      <p className="gtc-points">{player.gaveUp ? "0" : `+${player.roundPoints ?? 0}`}</p>
      <p className="mt-2 text-sm text-muted">{scoreBits(player)}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">
        {tally(player.questions, "question", "questions")} · {tally(player.wrongGuesses, "wrong guess", "wrong guesses")} ·{" "}
        {tally(player.hints, "hint", "hints")}
      </p>
      <Button className="mt-auto w-full" onClick={() => dispatch({ type: "CONTINUE" })}>
        {opp.solved ? "Round results" : `${opp.name}’s turn`}
      </Button>
    </div>
  );
}

function Results({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
}) {
  const [a, b] = state.players;
  const lead =
    a.score === b.score ? "All square." : `${a.score > b.score ? a.name : b.name} leads the match.`;
  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-3">
        <GtcChip>Round {state.round}</GtcChip>
        <h2 className="gtc-title">{lead}</h2>
        <GtcTicket line={state.themeLine} />
      </div>
      <div className="grid gap-5">
        {state.players.map((player, index) => (
          <section key={index} className="flex flex-col gap-2">
            <GtcPortrait name={player.character} kicker={player.name} seat={index === 0 ? "me" : "them"} />
            <p className="text-2xl font-bold tabular-nums">
              {player.gaveUp ? "0" : `+${player.roundPoints ?? 0}`}
              <span className="ml-2 text-sm font-normal text-muted">match {player.score}</span>
            </p>
            <p className="text-sm text-muted">{scoreBits(player)}</p>
            {player.log.length ? (
              <details className="mt-3">
                <summary className="text-sm text-muted">How it went</summary>
                <LogList entries={player.log} />
              </details>
            ) : null}
          </section>
        ))}
      </div>
      <Button className="w-full" onClick={() => dispatch({ type: "NEXT_ROUND" })}>
        Next round
      </Button>
    </div>
  );
}

function RulesDialog({
  open,
  onOpenChange,
  state,
  dispatch,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: GameState;
  dispatch: (action: Parameters<typeof reducer>[1]) => void;
  onLeave?: () => void;
}) {
  const [confirm, setConfirm] = useState<"reset" | "end" | null>(null);
  useEffect(() => {
    if (!open) setConfirm(null);
  }, [open]);
  const inRound = state.phase.name !== "lobby";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="gtc-overlay" />
        <Dialog.Content className="gtc-modal" aria-describedby="rules-body">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="gtc-title">How to play</Dialog.Title>
            <Dialog.Close className="gtc-btn gtc-btn-quiet press">Close</Dialog.Close>
          </div>
          <div id="rules-body" className="mt-4 flex flex-col gap-4 text-sm text-muted">
            <p className="text-foreground">
              This is the two-friend version of Guess the Character. One phone. A theme broad enough that the
              confident guess is usually wrong.
            </p>
            <section>
              <h3 className="font-medium text-foreground">The trick</h3>
              <p className="mt-1">
                You do not enter your own character. You secretly pick one for the other player. They pick
                yours. Then you try to guess yours, and they answer, because they chose it.
              </p>
            </section>
            <section>
              <h3 className="font-medium text-foreground">A turn</h3>
              <p className="mt-1">
                Ask anything that can be answered Yes, No, or Sort of. Sort of means sometimes, partly, or it
                depends. Ask as many as you want, then pass. Guess whenever you like.
              </p>
            </section>
            <section>
              <h3 className="font-medium text-foreground">Two phones</h3>
              <p className="mt-1">
                From the front screen, one person creates a room and reads the code. The other joins on their
                own phone. Each of you keeps the character you picked on your own device. No passing required.
              </p>
            </section>
            <section>
              <h3 className="font-medium text-foreground">Passing the phone</h3>
              <p className="mt-1">
                The guesser must not see their character. Hand the phone over to answer, then hand it back.
                Look away when the screen isn’t yours. The pause before the button is there on purpose.
              </p>
            </section>
            <section>
              <h3 className="font-medium text-foreground">Scoring</h3>
              <p className="mt-1">
                A correct guess starts at 12. Minus 1 per question, minus 2 per wrong guess, minus 1 per hint.
                The floor is 1 if you get there. Giving up scores 0. Spelling can be fuzzy; the answerer still
                confirms aliases like a secret identity.
              </p>
            </section>
            <section>
              <h3 className="font-medium text-foreground">Hints</h3>
              <p className="mt-1">
                The answerer may add a few words. Mark them as a hint only if they actually give the game
                away. A clarification is free.
              </p>
            </section>
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
            <Button variant="secondary" className="w-full rounded-sm" onClick={() => dispatch({ type: "TOGGLE_SOUND" })}>
              {state.sound ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
              Sound {state.sound ? "on" : "off"}
            </Button>
            {confirm === "reset" ? (
              <ConfirmRow
                copy="Clear both scores and go back to round 1?"
                yes="Reset match"
                onYes={() => {
                  dispatch({ type: "RESET_MATCH" });
                  onOpenChange(false);
                }}
                onNo={() => setConfirm(null)}
              />
            ) : confirm === "end" ? (
              <ConfirmRow
                copy="Leave this round? Points already earned stay. Unrevealed characters are discarded."
                yes="End round"
                onYes={() => {
                  dispatch({ type: "END_ROUND" });
                  onOpenChange(false);
                }}
                onNo={() => setConfirm(null)}
              />
            ) : (
              <>
                {inRound ? (
                  <Button variant="quiet" className="w-full" onClick={() => setConfirm("end")}>
                    End this round
                  </Button>
                ) : null}
                <Button variant="quiet" className="w-full" onClick={() => setConfirm("reset")}>
                  Reset scores
                </Button>
                {onLeave ? (
                  <Button variant="quiet" className="w-full" onClick={onLeave}>
                    Back to the front
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConfirmRow({
  copy,
  yes,
  onYes,
  onNo,
}: {
  copy: string;
  yes: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="gtc-sheet">
      <p className="text-sm text-foreground">{copy}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="quiet" onClick={onNo}>
          Cancel
        </Button>
        <Button variant="secondary" className="rounded-sm" onClick={onYes}>
          {yes}
        </Button>
      </div>
    </div>
  );
}

function screenKey(state: GameState): string {
  const phase = state.phase;
  switch (phase.name) {
    case "handoff":
      return `handoff-${phase.title}`;
    case "draft":
      return `draft-${phase.player}`;
    case "ask":
      return `ask-${phase.player}`;
    case "answer":
      return `answer-${state.pending?.text ?? ""}`;
    case "solved":
      return `solved-${phase.player}`;
    default:
      return phase.name;
  }
}

export function GuessGame({ onLeave }: { onLeave?: () => void }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [booted, setBooted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const prevPhase = useRef(state.phase.name);

  useEffect(() => {
    const saved = loadSave();
    if (saved) {
      prevPhase.current = saved.phase.name;
      dispatch({ type: "HYDRATE", state: saved });
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (booted) writeSave(state);
  }, [state, booted]);

  useEffect(() => {
    const phase = state.phase;
    if (prevPhase.current !== "solved" && phase.name === "solved" && state.sound) {
      const player = state.players[phase.player];
      if (!player.gaveUp) chime();
    }
    prevPhase.current = phase.name;
  }, [state.phase, state.players, state.sound]);

  const scrollPage = state.phase.name === "lobby" || state.phase.name === "results";

  let screen: ReactNode = null;
  switch (state.phase.name) {
    case "lobby":
      screen = <Lobby state={state} dispatch={dispatch} onLeave={onLeave} onRules={() => setRulesOpen(true)} />;
      break;
    case "handoff":
      screen = <HandoffScreen state={state} dispatch={dispatch} />;
      break;
    case "draft":
      screen = <DraftScreen state={state} dispatch={dispatch} />;
      break;
    case "ask":
      screen = <AskScreen state={state} dispatch={dispatch} />;
      break;
    case "answer":
      screen = <AnswerScreen state={state} dispatch={dispatch} />;
      break;
    case "solved":
      screen = <SolvedScreen state={state} dispatch={dispatch} />;
      break;
    case "results":
      screen = <Results state={state} dispatch={dispatch} />;
      break;
    default:
      screen = null;
  }

  return (
    <main
      className={cn(
        "safe-x safe-y mx-auto flex w-full max-w-xl flex-col",
        scrollPage ? "min-h-dvh" : "h-dvh overflow-hidden",
      )}
      data-screen={state.phase.name}
    >
      {state.phase.name === "lobby" ? null : <ScoreBar state={state} onRules={() => setRulesOpen(true)} />}
      <div key={screenKey(state)} className="rise flex min-h-0 flex-1 flex-col">
        {screen}
      </div>
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} state={state} dispatch={dispatch} onLeave={onLeave} />
    </main>
  );
}
