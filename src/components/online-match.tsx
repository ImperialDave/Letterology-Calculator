import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { Copy, Dices, Volume2, VolumeX } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { GtcChip, GtcCode, GtcPortrait, GtcTicket, GtcWordmark, gtcAnswerClass } from "@/components/gtc-mark";
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
import { loadSeat, saveSeat } from "@/lib/gtc/seat";
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
    <ol className="gtc-log">
      {entries.map((entry) => (
        <li key={entry.id}>
          <p>{entry.kind === "g" ? `Guess: ${entry.text}` : entry.text}</p>
          {entry.answer ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className={gtcAnswerClass(entry.answer)}>{answerWord(entry.answer)}</span>
              {entry.note ? <span>{entry.note}</span> : null}
              {entry.hint ? <span>Hint</span> : null}
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
  peerId,
  restored = false,
  initialState,
  mailCursor = 0,
  onLeave,
}: {
  room: string;
  name: string;
  isHost: boolean;
  peerId: string;
  restored?: boolean;
  initialState?: OnlineState;
  /** Null is a seat from before room mail. Zero is a new room. */
  mailCursor?: number | null;
  onLeave: () => void;
}) {
  const [state, setState] = useState<OnlineState>(() => initialState ?? initialOnline());
  const stateRef = useRef(state);
  stateRef.current = state;
  const mailRef = useRef(mailCursor ?? 0);
  const rememberRef = useRef<(next: OnlineState) => void>(() => {});
  const p2p = useP2PRoom({
    room,
    name,
    selfId: peerId,
    redial: restored,
    via: "room",
    since: mailCursor ?? 0,
    onCursor: (id) => {
      mailRef.current = id;
      rememberRef.current(stateRef.current);
    },
    shouldLeave: () => {
      const seat = loadSeat(room);
      return !seat || seat.peerId !== peerId;
    },
  });
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const oppRef = useRef<string | null>(null);
  const helloFor = useRef<string | null>(null);
  const rolledFor = useRef(initialState && initialState.phase !== "wait" ? initialState.round : 0);
  const prevPhase = useRef(state.phase);

  const remember = useCallback(
    (next: OnlineState) => {
      saveSeat({
        room,
        name,
        role: isHost ? "host" : "guest",
        peerId,
        state: next,
        mailCursor: mailRef.current,
      });
    },
    [isHost, name, peerId, room],
  );
  rememberRef.current = remember;

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
      remember(result.state);
      for (const msg of result.out) sendTo(msg);
    },
    [isHost, remember, sendTo],
  );

  useEffect(() => {
    remember(stateRef.current);
  }, [remember]);

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
    const current = stateRef.current;
    if (restored && isHost && current.phase !== "wait" && current.themeLine.trim()) {
      sendTo({ t: "theme", themeId: current.themeId, themeLine: current.themeLine.trim() });
    }
  }, [dispatch, isHost, name, p2p.peers, restored, sendTo]);

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
        <h2 className="gtc-title">This room already started.</h2>
        <p className="mt-4 max-w-md text-muted">
          The character was picked on the other phone before you arrived. Leave and make a new room.
        </p>
        <Button className="mt-8 w-full" onClick={onLeave}>
          Back
        </Button>
      </div>
    );
  } else if (state.phase === "wait") {
    screen = (
      <WaitScreen
        room={room}
        joined={p2p.joined}
        signalingDown={p2p.signaling === "down"}
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
        dispatch={dispatch}
      />
    );
  }

  return (
    <main className="safe-x safe-y mx-auto flex min-h-dvh w-full max-w-xl flex-col" data-screen={state.phase}>
      <header className="gtc-hud">
        <div className="gtc-hud-top">
          <GtcWordmark compact />
          <button type="button" onClick={() => setRulesOpen(true)} className="gtc-rules press">
            Rules
          </button>
        </div>
        <p className="gtc-round">Round {state.round}</p>
        <div className="gtc-plates">
          <p className="gtc-plate gtc-plate-me">
            <span className="gtc-plate-name">{name}</span>
            <span className="gtc-plate-score">{state.me.score}</span>
          </p>
          <p className="gtc-plate gtc-plate-them">
            <span className="gtc-plate-name">{theirName}</span>
            <span className="gtc-plate-score">{state.them.score}</span>
          </p>
        </div>
      </header>

      {connected ? null : state.phase === "wait" || state.phase === "theme" ? null : (
        <p className="gtc-banner">
          {failed
            ? "The room lost them. Stay on this screen. They can rejoin this same code."
            : `${theirName} stepped away. The room keeps the game until they come back. A refresh on this phone keeps your character.`}
        </p>
      )}
      {connected && p2p.peers.length > 1 ? (
        <p className="mt-3 text-xs text-faint">A third person joined. This match stays with the first two.</p>
      ) : null}

      <div key={`${state.phase}-${state.pending?.id ?? "x"}-${state.round}`} className="rise flex flex-1 flex-col">
        {screen}
      </div>

      <footer className="gtc-foot py-2 text-sm">
        <p className="tabular-nums">
          Room {room}
          {opponent?.rttMs != null ? ` · ${opponent.rttMs} ms` : ""}
        </p>
        <button type="button" className="gtc-btn gtc-btn-quiet press" onClick={onLeave}>
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
  signalingDown,
  failed,
  found,
  copied,
  onCopy,
}: {
  room: string;
  joined: boolean;
  signalingDown: boolean;
  failed: boolean;
  found: boolean;
  copied: "code" | "link" | null;
  onCopy: (kind: "code" | "link") => void;
}) {
  return (
    <div className="flex flex-1 flex-col py-6">
      <GtcChip>
        {signalingDown
          ? "Room service"
          : failed
            ? "Still waiting"
            : found
              ? "Found them"
              : joined
                ? "Room open"
                : "Opening the room"}
      </GtcChip>
      <h2 className="gtc-title mt-3">
        {signalingDown ? "The room didn’t open." : failed ? "Couldn’t connect." : "Send this code."}
      </h2>
      <GtcCode code={room} />
      <p className="mt-4 max-w-md text-muted">
        {signalingDown
          ? "This phone could not register with the room. Leave and try again in a moment."
          : failed
            ? "The other phone has not reached this room yet. Stay on this screen, or leave and make a new one. One phone still works from the front screen."
            : "The other person opens Guess the Character, taps Join, and types this code. The character each of you picks stays on your own phone."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => onCopy("code")}>
          <Copy className="size-4" aria-hidden="true" />
          {copied === "code" ? "Copied" : "Copy code"}
        </Button>
        <Button variant="secondary" onClick={() => onCopy("link")}>
          {copied === "link" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="pt-6 text-sm text-faint">You can refresh. This phone keeps your place and the character you hid.</p>
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
        <GtcChip>{isHost ? "You start the round" : `Waiting on ${theirName}`}</GtcChip>
        <h2 className="gtc-title mt-3">Both of your characters</h2>
        <p className="mt-3 text-sm text-faint tabular-nums">{THEMES.length} in the deck</p>
      </div>
      <input
        aria-label="Theme"
        value={state.themeLine}
        maxLength={80}
        onChange={(event) => dispatch({ type: "SET_LINE", line: event.target.value })}
        className={fieldClass("gtc-field-ticket")}
      />
      {examples.length ? (
        <p className="text-sm text-muted">Fits, for instance: {examples.join(" · ")}</p>
      ) : (
        <p className="text-sm text-muted">Your theme. Anyone who truly fits is fair game.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: "ROLL" })}>
          <Dices className="size-4" aria-hidden="true" />
          New theme
        </Button>
        {state.examples.length > 4 ? (
          <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: "SHUFFLE" })}>
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
                className={cn("gtc-pick", theme.id === state.themeId && "is-on")}
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
      <GtcTicket line={state.themeLine} />
      <h2 className="gtc-title">Pick {theirName}’s character.</h2>
      <p className="text-muted">
        This stays on your phone. {theirName} will try to guess it, and you answer yes, no, or sort of.
      </p>
      {examples.length ? <p className="text-sm text-muted">Fits, for instance: {examples.join(" · ")}</p> : null}
      {state.iLocked ? (
        <GtcPortrait name={state.secret} note={state.note} kicker="Locked on this phone" seat="me" />
      ) : (
        <>
          <GtcPortrait kicker="Their character" seat="me">
            <label className="sr-only" htmlFor="secret">
              Their character
            </label>
            <input
              id="secret"
              value={state.secret}
              maxLength={48}
              autoComplete="off"
              onChange={(event) => dispatch({ type: "SET_SECRET", value: event.target.value })}
              className={fieldClass("gtc-field-name")}
              placeholder="Not your own"
            />
          </GtcPortrait>
          <label className="gtc-label" htmlFor="note">
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
      <GtcTicket line={state.themeLine} />
      <p className="text-sm text-muted tabular-nums">
        Worth {worth} if you get it now · this turn {state.me.turnQuestions}
      </p>
      <LogList entries={state.me.log} />
      <label className="gtc-label" htmlFor="ask">
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
        <Button variant="secondary" className="w-full" onClick={() => setGuessing((value) => !value)}>
          {guessing ? "Ask instead" : "Make a guess"}
        </Button>
      </div>
      {state.them.solved || state.them.gaveUp ? null : (
        <Button variant="quiet" className="w-full" onClick={() => dispatch({ type: "PASS" })}>
          Pass to {theirName}
        </Button>
      )}
      {confirmGiveUp ? (
        <div className="gtc-sheet">
          <p className="text-sm">Give up and score 0? They’ll show you the character.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={() => setConfirmGiveUp(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "GIVE_UP" })}>
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
      <GtcChip>On their phone</GtcChip>
      <h2 className="gtc-title mt-3">
        {state.me.gaveUp ? `Waiting for ${theirName} to reveal it.` : `Waiting for ${theirName}.`}
      </h2>
      {state.pending ? <p className="gtc-quote mt-6"><span className="gtc-quote-line">{state.pending.text}</span></p> : null}
      <p className="mt-4 text-muted">The character they picked for you is not on this phone.</p>
    </div>
  );
}

function WatchScreen({ state, theirName }: { state: OnlineState; theirName: string }) {
  return (
    <div className="flex flex-1 flex-col py-6">
      <GtcChip>{theirName} is guessing</GtcChip>
      <h2 className="gtc-title mt-3">You’ll answer here.</h2>
      <p className="mt-4 text-muted">Don’t say the name out loud. A question will land on this phone.</p>
      <div className="mt-6">
        <GtcPortrait name={state.secret} note={state.note} kicker="You picked this for them" seat="them" />
      </div>
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
      <GtcPortrait name={state.secret} note={state.note} kicker="Only you can see this" seat="them" />
      <div className="gtc-quote">
        <p className="gtc-quote-kicker">{theirName} {pending.kind === "g" ? "guessed" : "asked"}</p>
        <p className="gtc-quote-line">{pending.text}</p>
      </div>
      {pending.kind === "g" ? (
        <>
          {close ? (
            <p className="text-sm text-muted">This looks very close. Confirm it only if it’s the same character.</p>
          ) : (
            <p className="text-sm text-muted">Spelling can be fuzzy. An alias still needs your yes.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => dispatch({ type: "JUDGE", correct: true })}>Correct</Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "JUDGE", correct: false })}>
              Not quite
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-2">
            {(["yes", "no", "sort"] as AnswerWord[]).map((answer) => (
              <Button
                key={answer}
                variant="secondary"
                className={cn(
                  "gtc-choice w-full",
                  answer === "yes" && "gtc-choice-yes",
                  answer === "no" && "gtc-choice-no",
                  answer === "sort" && "gtc-choice-sort",
                )}
                onClick={() => dispatch({ type: "ANSWER", answer, note, hint })}
              >
                {answer === "sort" ? "Sort of" : answer === "yes" ? "Yes" : "No"}
              </Button>
            ))}
          </div>
          <label className="gtc-label" htmlFor="aside">
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
      <GtcChip>{state.me.gaveUp ? "Revealed" : "That’s the one"}</GtcChip>
      <div className="mt-4">
        <GtcPortrait name={state.myCharacter || "They confirmed it"} note={state.myNote} seat="me" />
      </div>
      <p className="gtc-points mt-6">{state.me.gaveUp ? "0" : `+${state.me.roundPoints ?? 0}`}</p>
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
  dispatch,
}: {
  state: OnlineState;
  name: string;
  theirName: string;
  dispatch: (action: OnlineAction) => void;
}) {
  const lead =
    state.me.score === state.them.score
      ? "All square."
      : `${state.me.score > state.them.score ? name : theirName} leads the match.`;
  const cards = [
    { label: name, character: state.myCharacter || "—", seat: state.me, who: "Yours" as const },
    { label: theirName, character: state.secret || "—", seat: state.them, who: "Theirs" as const },
  ];
  return (
    <div className="flex flex-col gap-5 py-6">
      <div>
        <GtcChip>Round {state.round}</GtcChip>
        <h2 className="gtc-title mt-3">{lead}</h2>
      </div>
      <GtcTicket line={state.themeLine} />
      {cards.map((card) => (
        <section key={card.label} className="flex flex-col gap-2">
          <GtcPortrait
            name={card.character}
            kicker={`${card.label} · ${card.who}`}
            seat={card.who === "Yours" ? "me" : "them"}
          />
          <p className="text-2xl font-bold tabular-nums">
            {card.seat.gaveUp ? "0" : `+${card.seat.roundPoints ?? 0}`}
            <span className="ml-2 text-sm font-normal text-muted">match {card.seat.score}</span>
          </p>
          <p className="text-sm text-muted">{scoreBits(card.seat)}</p>
        </section>
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
        <Dialog.Overlay className="gtc-overlay" />
        <Dialog.Content className="gtc-modal" aria-describedby="online-rules">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="gtc-title">Two phones</Dialog.Title>
            <Dialog.Close className="gtc-btn gtc-btn-quiet press">Close</Dialog.Close>
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
            <p>You can refresh this phone. It keeps your seat and the character you hid. Leave is what drops the room.</p>
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
