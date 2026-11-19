import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { Copy, Dices, Volume2, VolumeX } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { isStrongMatch, pointsFor } from "@/lib/gtc/logic";
import {
  initialOnline,
  newId,
  parseWire,
  peekExamples,
  snapshot,
  step,
  type AnswerWord,
  type OnlineAction,
  type OnlineState,
  type OLog,
  type Seat,
  type Wire,
} from "@/lib/gtc/online";
import { THEMES } from "@/lib/gtc/themes";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";

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
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  return (
    <button
      type={type}
      className={cn(
        "press inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium",
        "transition-[background-color,color,opacity] duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border border-border bg-card text-foreground hover:bg-subtle",
        variant === "quiet" && "bg-transparent text-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function fieldClass(extra?: string) {
  return cn(
    "w-full rounded-sm border border-border bg-subtle px-3 py-3 text-base text-foreground",
    "placeholder:text-faint",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    extra,
  );
}

function answerWord(answer: OLog["answer"]): string {
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

function scoreBits(seat: Seat): string {
  if (seat.gaveUp) return "Gave up · 0";
  const bits = ["12"];
  if (seat.questions) bits.push(`− ${seat.questions} for ${seat.questions === 1 ? "a question" : "questions"}`);
  if (seat.wrongGuesses) {
    bits.push(`− ${seat.wrongGuesses * 2} for ${seat.wrongGuesses === 1 ? "a miss" : "misses"}`);
  }
  if (seat.hints) bits.push(`− ${seat.hints} for ${seat.hints === 1 ? "a hint" : "hints"}`);
  return bits.join(" ");
}

function LogList({ entries }: { entries: OLog[] }) {
  if (!entries.length) return <p className="py-4 text-sm text-muted">Nothing on the record yet.</p>;
  return (
    <ol className="flex flex-col gap-3 py-3">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <p className="text-foreground">{entry.kind === "g" ? `Guess: ${entry.text}` : entry.text}</p>
          {entry.answer ? (
            <p className="mt-1 text-muted">
              {answerWord(entry.answer)}
              {entry.note ? ` — ${entry.note}` : ""}
              {entry.hint ? " · hint" : ""}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function OnlineMatch({
  room,
  name,
  isHost,
  onLeave,
}: {
  room: string;
  name: string;
  isHost: boolean;
  onLeave: () => void;
}) {
  const p2p = useP2PRoom({ room, name });
  const [state, setState] = useState<OnlineState>(initialOnline);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const stateRef = useRef(state);
  const oppRef = useRef<string | null>(null);
  const helloFor = useRef<string | null>(null);
  const rolledFor = useRef(0);
  const prevPhase = useRef(state.phase);
  stateRef.current = state;

  const sendTo = useCallback(
    (data: Wire) => {
      const id = oppRef.current;
      if (id) p2p.send(data, id);
      else p2p.send(data);
    },
    [p2p.send],
  );

  const dispatch = useCallback(
    (action: OnlineAction) => {
      const result = step(stateRef.current, action, { isHost });
      stateRef.current = result.state;
      setState(result.state);
      for (const msg of result.out) sendTo(msg);
    },
    [isHost, sendTo],
  );

  const onWire = useCallback(
    (msg: Wire) => {
      const current = stateRef.current;
      switch (msg.t) {
        case "hello":
          dispatch({ type: "SET_THEIR_NAME", name: msg.name });
          for (const wire of snapshot(stateRef.current, isHost)) sendTo(wire);
          return;
        case "theme":
          dispatch({ type: "APPLY_THEME", themeId: msg.themeId, themeLine: msg.themeLine });
          return;
        case "lock":
          dispatch({ type: "THEY_LOCK" });
          return;
        case "start-draft":
          if (!isHost) dispatch({ type: "REMOTE_START", themeId: msg.themeId, themeLine: msg.themeLine });
          return;
        case "begin": {
          if (isHost) return;
          if (current.roundLive && current.phase !== "draft") return;
          if (current.phase !== "draft" || !current.iLocked) {
            sendTo({ t: "notready" });
            if (current.phase !== "draft") dispatch({ type: "MARK_STALE" });
            return;
          }
          dispatch({
            type: "REMOTE_BEGIN",
            firstIsMe: msg.first === "guest",
            round: msg.round,
          });
          return;
        }
        case "notready":
          if (isHost) dispatch({ type: "NOT_READY" });
          return;
        case "q":
          dispatch({ type: "RECV_Q", id: msg.id, text: msg.text });
          return;
        case "g":
          dispatch({ type: "RECV_G", id: msg.id, text: msg.text });
          return;
        case "a":
          dispatch({ type: "RECV_A", id: msg.id, answer: msg.answer, note: msg.note, hint: msg.hint });
          return;
        case "j":
          dispatch({
            type: "RECV_J",
            id: msg.id,
            correct: msg.correct,
            character: msg.character,
            note: msg.note,
          });
          return;
        case "pass":
          dispatch({ type: "RECV_PASS" });
          return;
        case "giveup":
          dispatch({ type: "RECV_GIVEUP" });
          return;
        case "reveal":
          dispatch({ type: "RECV_REVEAL", character: msg.character, note: msg.note });
          return;
        case "next":
          dispatch({ type: "RECV_NEXT" });
          return;
        default:
          return;
      }
    },
    [dispatch, isHost, sendTo],
  );

  useEffect(() => p2p.onMessage((from, data, channel) => {
    if (channel !== "reliable") return;
    const msg = parseWire(data);
    if (!msg) return;
    if (!oppRef.current) oppRef.current = from;
    const live = stateRef.current.roundLive || stateRef.current.iLocked;
    if (from !== oppRef.current) {
      if (live) return;
      oppRef.current = from;
    }
    setOpponentId(oppRef.current);
    onWire(msg);
  }), [onWire, p2p.onMessage]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("room") !== room) {
      url.searchParams.set("room", room);
      window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
    }
  }, [room]);

  useEffect(() => {
    const connected = p2p.peers.filter((peer) => peer.connectionState === "connected");
    if (!connected.length) return;
    const known = oppRef.current ? connected.find((peer) => peer.id === oppRef.current) : undefined;
    const pick = known ?? connected[0];
    if (!pick) return;
    const lockedIn = stateRef.current.roundLive || stateRef.current.iLocked;
    if (!oppRef.current || (!lockedIn && oppRef.current !== pick.id && !known)) oppRef.current = pick.id;
    setOpponentId(oppRef.current);
    if (helloFor.current === oppRef.current) return;
    if (pick.id !== oppRef.current || pick.connectionState !== "connected") return;
    helloFor.current = pick.id;
    sendTo({ t: "hello", name });
    dispatch({ type: "PEER", name: pick.name || "Friend" });
  }, [dispatch, name, p2p.peers, sendTo]);

  useEffect(() => {
    if (!isHost || state.phase !== "theme") return;
    const linked = p2p.peers.some((peer) => peer.id === opponentId && peer.connectionState === "connected");
    if (!linked) return;
    if (rolledFor.current === state.round) return;
    rolledFor.current = state.round;
    dispatch({ type: "ROLL" });
  }, [dispatch, isHost, opponentId, p2p.peers, state.phase, state.round]);

  useEffect(() => {
    if (prevPhase.current !== "solved" && state.phase === "solved" && state.sound && !state.me.gaveUp) chime();
    prevPhase.current = state.phase;
  }, [state.me.gaveUp, state.phase, state.sound]);

  const opponent = p2p.peers.find((peer) => peer.id === opponentId) ?? null;
  const connected = opponent?.connectionState === "connected";
  const failed = opponent?.connectionState === "failed";
  const theirName = state.theirName || "Friend";
  const myColor = isHost ? "text-p1" : "text-p2";
  const theirColor = isHost ? "text-p2" : "text-p1";

  async function copy(kind: "code" | "link") {
    const text = kind === "code" ? room : `${window.location.origin}${window.location.pathname}?room=${room}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  let screen: ReactNode = null;
  if (state.stale) {
    screen = (
      <div className="flex flex-1 flex-col justify-center py-8">
        <h2 className="display text-4xl">This room already started.</h2>
        <p className="mt-4 max-w-md text-muted">
          The character was picked on the other phone before you arrived. Leave and make a new room.
        </p>
        <Button className="mt-8 w-full" onClick={onLeave}>
          Back
        </Button>
      </div>
    );
  } else if (!connected && (state.phase === "wait" || state.phase === "theme")) {
    screen = (
      <WaitScreen
        room={room}
        joined={p2p.joined}
        failed={failed}
        found={Boolean(opponent)}
        copied={copied}
        onCopy={copy}
      />
    );
  } else if (state.phase === "theme" || state.phase === "wait") {
    screen = <ThemeScreen state={state} isHost={isHost} theirName={theirName} dispatch={dispatch} />;
  } else if (state.phase === "draft") {
    screen = <DraftScreen state={state} isHost={isHost} theirName={theirName} dispatch={dispatch} />;
  } else if (state.phase === "ask") {
    screen = <AskScreen state={state} theirName={theirName} dispatch={dispatch} />;
  } else if (state.phase === "hold") {
    screen = <HoldScreen state={state} theirName={theirName} />;
  } else if (state.phase === "watch") {
    screen = <WatchScreen state={state} theirName={theirName} />;
  } else if (state.phase === "respond") {
    screen = <RespondScreen state={state} theirName={theirName} dispatch={dispatch} />;
  } else if (state.phase === "solved") {
    screen = <SolvedScreen state={state} theirName={theirName} dispatch={dispatch} />;
  } else {
    screen = (
      <ResultsScreen
        state={state}
        name={name}
        theirName={theirName}
        myColor={myColor}
        theirColor={theirColor}
        dispatch={dispatch}
      />
    );
  }

  return (
    <main className="safe-x safe-y mx-auto flex min-h-dvh w-full max-w-xl flex-col" data-screen={state.phase}>
      <header className="flex items-center gap-3 border-b border-border py-3">
        <p className="shrink-0 text-xs font-semibold tracking-widest text-faint uppercase">Round {state.round}</p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <p className="flex min-w-0 items-baseline gap-1.5">
            <span className={cn("max-w-20 truncate text-xs", myColor)}>{name}</span>
            <span className="text-base font-medium tabular-nums">{state.me.score}</span>
          </p>
          <p className="flex min-w-0 items-baseline gap-1.5">
            <span className={cn("max-w-20 truncate text-xs", theirColor)}>{theirName}</span>
            <span className="text-base font-medium tabular-nums">{state.them.score}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="press shrink-0 rounded-lg px-2 py-2 text-sm font-medium"
        >
          Rules
        </button>
      </header>

      {connected ? null : state.phase === "wait" || state.phase === "theme" ? null : (
        <p className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
          {failed
            ? "The direct connection failed. Same Wi-Fi usually works. You can also leave and play on one phone."
            : `${theirName} dropped. Stay on this screen if they come back. A refresh starts over and loses the character on this phone.`}
        </p>
      )}
      {connected && p2p.peers.length > 1 ? (
        <p className="mt-3 text-xs text-faint">A third person joined. This match stays with the first two.</p>
      ) : null}

      <div key={`${state.phase}-${state.pending?.id ?? "x"}-${state.round}`} className="rise flex flex-1 flex-col">
        {screen}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border py-3 text-xs text-faint">
        <p className="tabular-nums">
          Room {room}
          {opponent?.rttMs != null ? ` · ${opponent.rttMs} ms` : ""}
        </p>
        <button type="button" className="press min-h-11 px-2 text-sm text-muted" onClick={onLeave}>
          Leave
        </button>
      </footer>

      <RulesDialog
        open={rulesOpen}
        sound={state.sound}
        onOpenChange={setRulesOpen}
        onSound={() => dispatch({ type: "TOGGLE_SOUND" })}
        onLeave={onLeave}
      />
    </main>
  );
}

function WaitScreen({
  room,
  joined,
  failed,
  found,
  copied,
  onCopy,
}: {
  room: string;
  joined: boolean;
  failed: boolean;
  found: boolean;
  copied: "code" | "link" | null;
  onCopy: (kind: "code" | "link") => void;
}) {
  return (
    <div className="flex flex-1 flex-col py-6">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">
        {failed ? "No direct line" : found ? "Found them" : joined ? "Room open" : "Opening the room"}
      </p>
      <h2 className="display mt-3 text-4xl">{failed ? "Couldn’t connect." : "Send this code."}</h2>
      <p id="room-code" className="display mt-6 text-6xl tracking-[0.18em]">
        {room}
      </p>
      <p className="mt-4 max-w-md text-muted">
        {failed
          ? "These two devices couldn’t open a direct connection. Try the same Wi-Fi, or a new room. One phone still works from the front screen."
          : "The other person opens Guess the Character, taps Join, and types this code. The character each of you picks stays on your own phone."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="rounded-sm" onClick={() => onCopy("code")}>
          <Copy className="size-4" aria-hidden="true" />
          {copied === "code" ? "Copied" : "Copy code"}
        </Button>
        <Button variant="secondary" className="rounded-sm" onClick={() => onCopy("link")}>
          {copied === "link" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="mt-auto pt-8 text-sm text-faint">Don’t refresh. A refresh drops the room and anything you typed.</p>
    </div>
  );
}

function ThemeScreen({
  state,
  isHost,
  theirName,
  dispatch,
}: {
  state: OnlineState;
  isHost: boolean;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const examples = peekExamples(state);
  return (
    <div className="flex flex-col gap-5 py-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-faint uppercase">
          {isHost ? "You start the round" : `Waiting on ${theirName}`}
        </p>
        <h2 className="display mt-3 text-4xl">Both of your characters</h2>
        <p className="mt-3 text-sm text-faint tabular-nums">{THEMES.length} in the deck</p>
      </div>
      <input
        aria-label="Theme"
        value={state.themeLine}
        maxLength={80}
        onChange={(event) => dispatch({ type: "SET_LINE", line: event.target.value })}
        className={fieldClass("display text-2xl italic")}
      />
      {examples.length ? (
        <p className="text-sm text-muted">Fits, for instance: {examples.join(" · ")}</p>
      ) : (
        <p className="text-sm text-muted">Your theme. Anyone who truly fits is fair game.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="w-full rounded-sm" onClick={() => dispatch({ type: "ROLL" })}>
          <Dices className="size-4" aria-hidden="true" />
          New theme
        </Button>
        {state.examples.length > 4 ? (
          <Button variant="secondary" className="w-full rounded-sm" onClick={() => dispatch({ type: "SHUFFLE" })}>
            More examples
          </Button>
        ) : null}
      </div>
      <details>
        <summary className="text-sm text-muted">Choose from the list</summary>
        <ul className="mt-2 max-h-52 overflow-y-auto">
          {THEMES.map((theme) => (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => dispatch({ type: "PICK", id: theme.id })}
                className={cn(
                  "flex min-h-11 w-full items-center rounded-sm px-2 text-left text-sm",
                  theme.id === state.themeId ? "bg-subtle text-foreground" : "text-muted hover:bg-subtle",
                )}
              >
                {theme.line}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {isHost ? (
        <Button className="w-full" disabled={!state.themeLine.trim()} onClick={() => dispatch({ type: "START_DRAFT" })}>
          Pick characters
        </Button>
      ) : (
        <p className="text-sm text-muted">{theirName} starts the picking once the theme looks right. You can still roll.</p>
      )}
    </div>
  );
}

function DraftScreen({
  state,
  isHost,
  theirName,
  dispatch,
}: {
  state: OnlineState;
  isHost: boolean;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const [error, setError] = useState("");
  const examples = peekExamples(state);
  return (
    <form
      className="flex flex-col gap-4 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!state.secret.trim()) {
          setError("Name a character first.");
          return;
        }
        setError("");
        dispatch({ type: "LOCK" });
      }}
    >
      <div>
        <p className="text-xs font-semibold tracking-widest text-faint uppercase">Both of your characters</p>
        <p className="display mt-2 text-3xl italic">{state.themeLine}</p>
      </div>
      <h2 className="display text-4xl">Pick {theirName}’s character.</h2>
      <p className="text-muted">
        This stays on your phone. {theirName} will try to guess it, and you answer yes, no, or sort of.
      </p>
      {examples.length ? <p className="text-sm text-muted">Fits, for instance: {examples.join(" · ")}</p> : null}
      {state.iLocked ? (
        <p className="display text-3xl italic">{state.secret}</p>
      ) : (
        <>
          <label className="block text-sm text-muted" htmlFor="secret">
            Their character
          </label>
          <input
            id="secret"
            value={state.secret}
            maxLength={48}
            autoComplete="off"
            onChange={(event) => dispatch({ type: "SET_SECRET", value: event.target.value })}
            className={fieldClass("display text-2xl")}
            placeholder="Not your own"
          />
          <label className="block text-sm text-muted" htmlFor="note">
            Private note, optional
          </label>
          <input
            id="note"
            value={state.note}
            maxLength={140}
            autoComplete="off"
            onChange={(event) => dispatch({ type: "SET_NOTE", value: event.target.value })}
            className={fieldClass()}
            placeholder="Alias, spelling, a ruling you’ll stick to"
          />
        </>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {state.iLocked ? (
        <p className="text-sm text-muted">
          Locked in.
          {state.theyLocked ? "" : ` Waiting for ${theirName}.`}
        </p>
      ) : (
        <Button type="submit" className="w-full">
          Lock it in
        </Button>
      )}
      {state.iLocked && !state.theyLocked ? (
        <Button variant="quiet" className="w-full" onClick={() => dispatch({ type: "LOCK" })}>
          Resend
        </Button>
      ) : null}
      {isHost && state.iLocked && state.theyLocked ? (
        <Button className="w-full" onClick={() => dispatch({ type: "BEGIN" })}>
          Start guessing
        </Button>
      ) : null}
      {!isHost && state.iLocked && state.theyLocked ? (
        <p className="text-sm text-muted">Both locked. {theirName} starts the round.</p>
      ) : null}
    </form>
  );
}

function AskScreen({
  state,
  theirName,
  dispatch,
}: {
  state: OnlineState;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const [text, setText] = useState("");
  const [guessing, setGuessing] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const worth = pointsFor(state.me);
  return (
    <form
      className="flex flex-1 flex-col gap-4 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        dispatch(guessing ? { type: "SEND_G", id: newId(), text } : { type: "SEND_Q", id: newId(), text });
        setText("");
      }}
    >
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">Both of your characters</p>
      <p className="display text-3xl italic">{state.themeLine}</p>
      <p className="text-sm text-muted tabular-nums">
        Worth {worth} if you get it now · this turn {state.me.turnQuestions}
      </p>
      <LogList entries={state.me.log} />
      <label className="text-sm text-muted" htmlFor="ask">
        {guessing ? "Your guess" : "Yes or no question"}
      </label>
      <input
        id="ask"
        value={text}
        maxLength={guessing ? 48 : 160}
        onChange={(event) => setText(event.target.value)}
        className={fieldClass()}
        placeholder={guessing ? "Name them" : "Are they human?"}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" className="w-full" disabled={!text.trim()}>
          {guessing ? "Guess" : "Ask"}
        </Button>
        <Button variant="secondary" className="w-full rounded-sm" onClick={() => setGuessing((value) => !value)}>
          {guessing ? "Ask instead" : "Make a guess"}
        </Button>
      </div>
      {state.them.solved || state.them.gaveUp ? null : (
        <Button variant="quiet" className="w-full" onClick={() => dispatch({ type: "PASS" })}>
          Pass to {theirName}
        </Button>
      )}
      {confirmGiveUp ? (
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm">Give up and score 0? They’ll show you the character.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={() => setConfirmGiveUp(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="rounded-sm" onClick={() => dispatch({ type: "GIVE_UP" })}>
              Give up
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="quiet" className="w-full" onClick={() => setConfirmGiveUp(true)}>
          Give up
        </Button>
      )}
    </form>
  );
}

function HoldScreen({ state, theirName }: { state: OnlineState; theirName: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">On their phone</p>
      <h2 className="display mt-3 text-4xl">
        {state.me.gaveUp ? `Waiting for ${theirName} to reveal it.` : `Waiting for ${theirName}.`}
      </h2>
      {state.pending ? <p className="display mt-6 text-2xl italic">{state.pending.text}</p> : null}
      <p className="mt-4 text-muted">The character they picked for you is not on this phone.</p>
    </div>
  );
}

function WatchScreen({ state, theirName }: { state: OnlineState; theirName: string }) {
  return (
    <div className="flex flex-1 flex-col py-6">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">{theirName} is guessing</p>
      <h2 className="display mt-3 text-4xl">You’ll answer here.</h2>
      <p className="mt-4 text-muted">Don’t say the name out loud. A question will land on this phone.</p>
      <article className="mt-6 rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-faint">You picked this for them</p>
        <p className="display mt-2 text-3xl italic">{state.secret}</p>
        {state.note ? <p className="mt-2 text-sm text-muted">{state.note}</p> : null}
      </article>
      {state.them.log.length ? (
        <details className="mt-4">
          <summary className="text-sm text-muted">What they’ve asked</summary>
          <LogList entries={state.them.log} />
        </details>
      ) : null}
    </div>
  );
}

function RespondScreen({
  state,
  theirName,
  dispatch,
}: {
  state: OnlineState;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const pending = state.pending;
  const [note, setNote] = useState("");
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setNote("");
    setHint(false);
  }, [pending?.id]);
  if (!pending) return null;
  const close = pending.kind === "g" && isStrongMatch(pending.text, state.secret);
  return (
    <div className="flex flex-col gap-4 py-6">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">Only you can see this</p>
      <p className="display text-4xl italic">{state.secret}</p>
      {state.note ? <p className="text-sm text-muted">{state.note}</p> : null}
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">
        {theirName} {pending.kind === "g" ? "guessed" : "asked"}
      </p>
      <p className="display text-2xl">{pending.text}</p>
      {pending.kind === "g" ? (
        <>
          {close ? (
            <p className="text-sm text-muted">This looks very close. Confirm it only if it’s the same character.</p>
          ) : (
            <p className="text-sm text-muted">Spelling can be fuzzy. An alias still needs your yes.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => dispatch({ type: "JUDGE", correct: true })}>Correct</Button>
            <Button variant="secondary" className="rounded-sm" onClick={() => dispatch({ type: "JUDGE", correct: false })}>
              Not quite
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(["yes", "no", "sort"] as AnswerWord[]).map((answer) => (
              <Button
                key={answer}
                variant="secondary"
                className="rounded-sm"
                onClick={() => dispatch({ type: "ANSWER", answer, note, hint })}
              >
                {answer === "sort" ? "Sort of" : answer === "yes" ? "Yes" : "No"}
              </Button>
            ))}
          </div>
          <label className="text-sm text-muted" htmlFor="aside">
            A few words, optional
          </label>
          <input
            id="aside"
            value={note}
            maxLength={140}
            onChange={(event) => setNote(event.target.value)}
            className={fieldClass()}
            placeholder="A clarification is free"
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={hint}
              onChange={(event) => setHint(event.target.checked)}
              className="size-4 accent-primary"
            />
            This gives the game away
          </label>
        </>
      )}
    </div>
  );
}

function SolvedScreen({
  state,
  theirName,
  dispatch,
}: {
  state: OnlineState;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const done = state.them.solved || state.them.gaveUp || state.afterSolved === "results";
  return (
    <div className="flex flex-1 flex-col py-8">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">
        {state.me.gaveUp ? "Revealed" : "That’s the one"}
      </p>
      <h2 className="display mt-3 text-4xl">{state.myCharacter || "They confirmed it"}</h2>
      {state.myNote ? <p className="mt-3 text-sm text-muted">{state.myNote}</p> : null}
      <p className="mt-6 text-5xl font-medium tabular-nums">{state.me.gaveUp ? "0" : `+${state.me.roundPoints ?? 0}`}</p>
      <p className="mt-2 text-sm text-muted">{scoreBits(state.me)}</p>
      {state.inbox.length ? <p className="mt-4 text-sm text-muted">{theirName} is already waiting.</p> : null}
      <Button className="mt-auto w-full" onClick={() => dispatch({ type: "CONTINUE" })}>
        {done ? "Round results" : `${theirName}’s turn`}
      </Button>
    </div>
  );
}

function ResultsScreen({
  state,
  name,
  theirName,
  myColor,
  theirColor,
  dispatch,
}: {
  state: OnlineState;
  name: string;
  theirName: string;
  myColor: string;
  theirColor: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const lead =
    state.me.score === state.them.score
      ? "All square."
      : `${state.me.score > state.them.score ? name : theirName} leads the match.`;
  const cards = [
    { label: name, color: myColor, character: state.myCharacter || "—", seat: state.me, who: "Yours" },
    { label: theirName, color: theirColor, character: state.secret || "—", seat: state.them, who: "Theirs" },
  ];
  return (
    <div className="flex flex-col gap-5 py-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-faint uppercase">Round {state.round}</p>
        <h2 className="display mt-2 text-4xl">{lead}</h2>
        <p className="mt-3 text-muted italic">{state.themeLine}</p>
      </div>
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-border bg-card p-4">
          <p className={cn("text-xs font-medium", card.color)}>
            {card.label} · {card.who}
          </p>
          <p className="display mt-2 text-3xl italic">{card.character}</p>
          <p className="mt-3 text-2xl font-medium tabular-nums">
            {card.seat.gaveUp ? "0" : `+${card.seat.roundPoints ?? 0}`}
            <span className="ml-2 text-sm font-normal text-muted">match {card.seat.score}</span>
          </p>
          <p className="mt-2 text-sm text-muted">{scoreBits(card.seat)}</p>
        </article>
      ))}
      <Button className="w-full" onClick={() => dispatch({ type: "NEXT" })}>
        Next round
      </Button>
    </div>
  );
}

function RulesDialog({
  open,
  sound,
  onOpenChange,
  onSound,
  onLeave,
}: {
  open: boolean;
  sound: boolean;
  onOpenChange: (open: boolean) => void;
  onSound: () => void;
  onLeave: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-panel" aria-describedby="online-rules">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="display text-3xl">Two phones</Dialog.Title>
            <Dialog.Close className="press rounded-lg px-2 py-2 text-sm text-muted">Close</Dialog.Close>
          </div>
          <div id="online-rules" className="mt-4 flex flex-col gap-4 text-sm text-muted">
            <p className="text-foreground">
              You pick their character. They pick yours. Questions stay on the guesser’s phone. Answers happen on
              the phone that wrote the secret. Nothing is judged by a computer.
            </p>
            <p>
              A correct guess starts at 12. Minus 1 per question, minus 2 per wrong guess, minus 1 per hint. The
              floor is 1 if you get there. Giving up scores 0.
            </p>
            <p>Don’t refresh. The character you picked lives only in this tab.</p>
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
            <Button variant="secondary" className="w-full rounded-sm" onClick={onSound}>
              {sound ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
              Sound {sound ? "on" : "off"}
            </Button>
            <Button variant="quiet" className="w-full" onClick={onLeave}>
              Leave the room
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
