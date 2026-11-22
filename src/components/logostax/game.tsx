import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import "./logostax.css";
import { BarChart3, CircleHelp, Trophy } from "lucide-react";
import { AccountSlot } from "@/components/logostax/account-slot";
import { TournamentDesk } from "@/components/logostax/tournament";
import { FieldBlock, HistoryList, RecordBlock } from "@/components/logostax/stats-view";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { clockNow, formatClock, freezeClock } from "@/lib/logostax/clock";
import {
  evaluate,
  hardViolation,
  isLength,
  LENGTHS,
  maxGuesses,
  needLetters,
  nextLengthSettings,
  prettyDate,
  shareText,
  solvedLine,
  utcDate,
  WORD_OF_THE_DAY_LENGTH,
  type Mode,
  type Session,
  type Settings,
} from "@/lib/logostax/engine";
import type { HistoryEntry } from "@/lib/logostax/history";
import { loadLexicon, type Lexicon } from "@/lib/logostax/lexicon";
import { fieldForWord, myHistory, payloadFromEntry, recordSolve, syncSolves } from "@/lib/logostax/results";
import type { FieldView } from "@/lib/logostax/results";
import {
  absorbRemote,
  archivePlayed,
  dealSession,
  DEFAULT_SETTINGS,
  loadHistory,
  loadSettings,
  markHistorySynced,
  rememberResult,
  resolveSession,
  saveGame,
  saveSettings,
  settleClock,
} from "@/lib/logostax/storage";

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function MarkIcon() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect className="cream" x="5" y="7" width="2.4" height="18" rx="0.4" />
      <rect className="teal" x="9.9" y="7" width="2.4" height="18" rx="0.4" />
      <rect className="copper" x="14.8" y="7" width="2.4" height="18" rx="0.4" />
      <rect className="teal" x="19.7" y="7" width="2.4" height="18" rx="0.4" />
      <rect className="cream" x="24.6" y="7" width="2.4" height="18" rx="0.4" />
    </svg>
  );
}

function Modal({
  open,
  onClose,
  labelledBy,
  modal = true,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  modal?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (modal) el.showModal();
      else el.show();
    } else if (!open && el.open) el.close();
  }, [open, modal]);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

function park(session: Session): Session {
  const frozen = freezeClock({ elapsedMs: session.elapsedMs, runningSince: session.runningSince });
  return { ...session, elapsedMs: frozen.elapsedMs, runningSince: null };
}

export function Game() {
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [archive, setArchive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [popAt, setPopAt] = useState<number | null>(null);
  const [animRow, setAnimRow] = useState<number | null>(null);
  const [danceRow, setDanceRow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsTab, setStatsTab] = useState<"record" | "word" | "history">("record");
  const [resultOpen, setResultOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bootId, setBootId] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [field, setField] = useState<FieldView | null>(null);
  const [fieldState, setFieldState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pendingLen, setPendingLen] = useState<number | null>(null);
  const [surface, setSurface] = useState<"play" | "table">("play");

  const settingsRef = useRef(settings);
  const lexRef = useRef<Lexicon | null>(null);
  const live = useRef<Session | null>(null);
  const lock = useRef(false);
  const lastEnter = useRef(0);
  const token = useRef(0);
  const adoptGen = useRef(0);
  const userRef = useRef(user);
  const toastTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const pressRef = useRef<(key: string) => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const switching = useRef(false);
  const adoptRunning = useRef(false);
  const armId = useRef(0);
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;
  userRef.current = user;

  function commitSession(next: Session) {
    live.current = next;
    setSession(next);
    saveGame(next);
  }

  function commitSettings(next: Settings) {
    settingsRef.current = next;
    setSettings(next);
    saveSettings(next);
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  function triggerPop(index: number) {
    setPopAt(null);
    if (popTimer.current) window.clearTimeout(popTimer.current);
    window.requestAnimationFrame(() => {
      setPopAt(index);
      popTimer.current = window.setTimeout(() => setPopAt(null), 100);
    });
  }

  function reject(message: string) {
    showToast(message);
    setShake(false);
    window.requestAnimationFrame(() => setShake(true));
    window.setTimeout(() => setShake(false), 430);
  }

  async function publish(entry: HistoryEntry) {
    if (!userRef.current) return;
    try {
      await recordSolve({ data: payloadFromEntry(entry) });
      setHistory(markHistorySynced([entry.puzzleId]));
    } catch {
      /* kept locally until the next sign-in */
    }
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const nextSettings = loadSettings();
        const length = nextSettings.mode === "today" ? WORD_OF_THE_DAY_LENGTH : nextSettings.length;
        const lex = await loadLexicon(length);
        if (cancel) return;
        const opened = settleClock(resolveSession({ ...nextSettings, length }, lex));
        const settled = rememberResult(opened, nextSettings.hard);
        settingsRef.current = { ...nextSettings, length };
        lexRef.current = lex;
        live.current = settled.session;
        setSettings({ ...nextSettings, length });
        setSession(settled.session);
        setHistory(settled.history);
        setArchive(archivePlayed());
        setReady(true);
        setLoadError(null);
        busyRef.current = false;
        setBusy(false);
        if (settled.entry) void publish(settled.entry);
      } catch (error) {
        if (cancel) return;
        setLoadError(error instanceof Error ? error.message : "The word list didn't load.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [bootId]);

  useEffect(() => {
    if (!session || session.status !== "playing" || session.runningSince == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [session?.status, session?.runningSince, session?.puzzleId]);

  useEffect(() => {
    function onVis() {
      const current = live.current;
      if (!current || current.status !== "playing") return;
      if (document.hidden) commitSession(park(current));
      else if (current.guesses.length > 0 || current.draft.length > 0 || current.elapsedMs > 0) {
        commitSession({ ...current, runningSince: Date.now() });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (surfaceRef.current === "table") return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const key = event.key === "Enter" ? "Enter" : event.key === "Backspace" ? "Del" : event.key;
      if (key !== "Enter" && key !== "Del" && !/^[a-zA-Z]$/.test(key)) return;
      event.preventDefault();
      pressRef.current(key === "Enter" || key === "Del" ? key : key.toLowerCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (switching.current) return;
    const el = inputRef.current;
    if (!el) return;
    const next = session?.status === "playing" ? (session.draft ?? "") : "";
    if (el.value !== next) el.value = next;
  }, [session?.draft, session?.puzzleId, session?.status]);

  function restoreField() {
    const el = inputRef.current;
    const current = live.current;
    const next = current?.status === "playing" ? current.draft : "";
    if (el && el.value !== next) el.value = next;
  }

  function quietField() {
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    el.removeAttribute("maxlength");
  }

  function armSwitch() {
    const id = ++armId.current;
    switching.current = true;
    quietField();
    window.setTimeout(() => {
      if (armId.current !== id || adoptRunning.current) return;
      switching.current = false;
      restoreField();
    }, 400);
  }

  function cancelArm() {
    ++armId.current;
    switching.current = false;
    restoreField();
  }

  function onBoardPointerDown(event: ReactPointerEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Keep the hidden field focused. Otherwise iOS uses the first tap to blur it and drops the click.
    if (target.closest("button, a, [role='switch']")) {
      event.preventDefault();
      return;
    }
    if (target.closest("dialog, input, textarea, label, select")) return;
    if (document.querySelector("dialog[open]")) return;
    const current = live.current;
    if (!current || current.status !== "playing") return;
    inputRef.current?.focus({ preventScroll: true });
  }

  function submitEnter() {
    pressRef.current("Enter");
  }

  function syncFromNative(raw: string) {
    const el = inputRef.current;
    if (switching.current) {
      if (el) el.value = "";
      return;
    }
    const current = live.current;
    if (!current || current.status !== "playing") {
      if (el) el.value = "";
      return;
    }
    const next = raw.toLowerCase().replace(/[^a-z]/g, "").slice(0, current.length);
    let draftNow = current.draft;
    if (next === draftNow) {
      if (el && el.value !== draftNow) el.value = draftNow;
      return;
    }
    if (next.startsWith(draftNow)) {
      for (const ch of next.slice(draftNow.length)) pressRef.current(ch);
    } else if (draftNow.startsWith(next)) {
      for (let i = 0; i < draftNow.length - next.length; i++) pressRef.current("Del");
    } else {
      for (let i = 0; i < draftNow.length; i++) pressRef.current("Del");
      for (const ch of next) pressRef.current(ch);
    }
    draftNow = live.current?.draft ?? "";
    if (el && el.value !== draftNow) el.value = draftNow;
  }

  useEffect(() => {
    if (isPending || !user) return;
    let cancel = false;
    const pending = loadHistory().filter((entry) => !entry.synced);
    const job = (async () => {
      try {
        if (pending.length > 0) {
          await syncSolves({ data: pending.map(payloadFromEntry) });
          if (!cancel) markHistorySynced(pending.map((entry) => entry.puzzleId));
        }
        const remote = await myHistory();
        if (cancel) return;
        setHistory(absorbRemote(remote));
      } catch {
        /* guest stats stay on this device */
      }
    })();
    void job;
    return () => {
      cancel = true;
    };
  }, [user?.id, isPending]);

  useEffect(() => {
    if (!user || !session || session.status === "playing") {
      setField(null);
      setFieldState("idle");
      return;
    }
    let cancel = false;
    setFieldState("loading");
    fieldForWord({
      data: {
        answer: session.answer,
        puzzleId: session.puzzleId,
        elapsedMs: session.elapsedMs,
        guesses: session.guesses.length,
        won: session.status === "won",
      },
    })
      .then((report) => {
        if (cancel) return;
        setField(report);
        setFieldState("ready");
      })
      .catch(() => {
        if (!cancel) setFieldState("error");
      });
    return () => {
      cancel = true;
    };
  }, [user?.id, session?.puzzleId, session?.status, session?.elapsedMs]);

  function press(key: string) {
    if (switching.current || busyRef.current) return;
    const current = live.current;
    const lex = lexRef.current;
    const pref = settingsRef.current;
    if (!current || !lex || lock.current) return;
    if (current.status !== "playing") return;
    if (current.length !== lex.length || current.answer.length !== current.length) {
      if (isLength(current.length)) {
        const mode = current.length === WORD_OF_THE_DAY_LENGTH && pref.mode === "today" ? "today" : "open";
        setResultOpen(false);
        void adopt({ ...pref, mode, length: current.length });
      }
      return;
    }

    if (key === "Enter") {
      const stamped = Date.now();
      if (stamped - lastEnter.current < 80) return;
      lastEnter.current = stamped;
      submit(current, lex, pref);
      return;
    }
    if (key === "Del") {
      if (!current.draft) return;
      commitSession({ ...current, draft: current.draft.slice(0, -1) });
      return;
    }
    if (!/^[a-z]$/.test(key) || current.draft.length >= current.length) return;
    const started = current.runningSince == null ? { ...current, runningSince: Date.now() } : current;
    const draft = started.draft + key;
    commitSession({ ...started, draft });
    if (!prefersReduced()) triggerPop(draft.length - 1);
  }

  pressRef.current = press;

  function submit(current: Session, lex: Lexicon, pref: Settings) {
    if (current.draft.length < current.length) {
      reject(needLetters(current.length));
      return;
    }
    const guess = current.draft;
    if (!lex.guess.has(guess) || guess.length !== current.length) {
      reject("Not in the word list");
      return;
    }
    if (pref.hard) {
      const violation = hardViolation(guess, current.guesses, current.answer);
      if (violation) {
        reject(violation);
        return;
      }
    }

    const guesses = [...current.guesses, guess];
    const won = guess === current.answer;
    const lost = !won && guesses.length >= maxGuesses(current.length);
    const status = won ? "won" : lost ? "lost" : "playing";
    let next: Session = { ...current, guesses, draft: "", status };
    if (status !== "playing") {
      const frozen = freezeClock({ elapsedMs: next.elapsedMs, runningSince: next.runningSince });
      next = { ...next, elapsedMs: frozen.elapsedMs, runningSince: null };
    }
    const my = ++token.current;
    lock.current = true;
    commitSession(next);
    setAnimRow(guesses.length - 1);
    setDanceRow(null);

    const reduced = prefersReduced();
    const total = reduced ? 30 : 140 * (guess.length - 1) + 620;
    window.setTimeout(() => {
      if (token.current !== my) return;
      lock.current = false;
      setAnimRow(null);
      if (won && !reduced) setDanceRow(guesses.length - 1);
      if (status === "playing") return;
      const settled = rememberResult(live.current ?? next, pref.hard);
      commitSession(settled.session);
      setHistory(settled.history);
      if (settled.entry) void publish(settled.entry);
      setCopied(false);
      setResultOpen(true);
    }, total);
  }

  async function adopt(nextSettings: Settings, options?: { forceNew?: boolean; avoid?: string[] }) {
    const gen = ++adoptGen.current;
    ++armId.current;
    switching.current = true;
    adoptRunning.current = true;
    quietField();
    const previous = live.current;
    if (previous) saveGame(park(previous));
    token.current += 1;
    lock.current = false;
    const length = nextSettings.mode === "today" ? WORD_OF_THE_DAY_LENGTH : nextSettings.length;
    busyRef.current = true;
    setBusy(true);
    setPendingLen(length);
    setAnimRow(null);
    setDanceRow(null);
    setResultOpen(false);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
    try {
      if (!isLength(length)) throw new Error("That length isn't available.");
      const lex = await loadLexicon(length);
      if (adoptGen.current !== gen) return;
      if (lex.length !== length) throw new Error("The word list doesn't match that length.");
      const today = utcDate();
      const requested = { ...nextSettings, length };
      let next = options?.forceNew
        ? dealSession(lex, length, today, options.avoid ?? [])
        : resolveSession(requested, lex, today);
      if (next.length !== length || next.answer.length !== length) {
        throw new Error("Couldn't open that length.");
      }
      next = settleClock(next);
      const settled = rememberResult(next, requested.hard);
      next = settled.session;
      if (adoptGen.current !== gen) return;
      lexRef.current = lex;
      commitSettings(requested);
      commitSession(next);
      setHistory(settled.history);
      if (settled.entry) void publish(settled.entry);
      setLoadError(null);
    } catch (error) {
      if (adoptGen.current !== gen) return;
      showToast(error instanceof Error ? error.message : "Couldn't open that length");
    } finally {
      if (adoptGen.current === gen) {
        adoptRunning.current = false;
        switching.current = false;
        busyRef.current = false;
        setBusy(false);
        setPendingLen(null);
        restoreField();
      }
    }
  }

  function chooseLength(next: number) {
    armSwitch();
    const choice = nextLengthSettings(live.current, settingsRef.current, next);
    if (!choice) {
      cancelArm();
      return;
    }
    setResultOpen(false);
    void adopt(choice);
  }

  function chooseMode(mode: Mode) {
    armSwitch();
    if (mode === settingsRef.current.mode) {
      cancelArm();
      return;
    }
    const length = mode === "today" ? WORD_OF_THE_DAY_LENGTH : settingsRef.current.length;
    void adopt({ ...settingsRef.current, mode, length });
  }

  function toggleHard() {
    const next = { ...settingsRef.current, hard: !settingsRef.current.hard };
    commitSettings(next);
    showToast(next.hard ? "Hard mode on. Honor every hint." : "Hard mode off.");
  }

  function dealNew() {
    armSwitch();
    const current = live.current;
    if (!current) {
      cancelArm();
      return;
    }
    void adopt({ ...settingsRef.current, mode: "open", length: current.length }, { forceNew: true, avoid: [current.answer] });
  }

  async function share() {
    const current = live.current;
    if (!current) return;
    const ok = await copyText(shareText(current, settingsRef.current.hard));
    if (ok) {
      setCopied(true);
      showToast("Copied");
    } else {
      showToast("Couldn't copy");
    }
  }

  const length = session?.length ?? (settings.mode === "today" ? WORD_OF_THE_DAY_LENGTH : settings.length);
  const rows = maxGuesses(length);
  const guesses = session?.guesses ?? [];
  const draft = session?.draft ?? "";
  const active = session?.status === "playing" ? guesses.length : -1;
  const shownMs = session ? clockNow({ elapsedMs: session.elapsedMs, runningSince: session.runningSince }, now) : 0;
  const clockLabel = session && (session.runningSince != null || session.elapsedMs > 0 || session.status !== "playing")
    ? formatClock(shownMs)
    : "0:00";
  const todayView = settings.mode === "today";
  const subtitle = !ready
    ? loadError
      ? "Dictionary unavailable"
      : "Opening the dictionary…"
    : busy && pendingLen
      ? `Opening ${pendingLen} ${pendingLen === 1 ? "letter" : "letters"}…`
    : todayView
      ? `${prettyDate(session?.date ?? utcDate())} · word of the day`
      : session?.kind === "deal"
        ? `${length} letters · dealt for you`
        : `${prettyDate(session?.date ?? utcDate())} · ${length} letters · shared`;

  return (
    <div className="app" onPointerDown={onBoardPointerDown}>
      <header className="top">
        <div className="brand-row">
          <div className="brand">
            <MarkIcon />
            <h1 className="wordmark">Logostax</h1>
          </div>
          <div className="icon-row">
            <button type="button" className="iconbtn" aria-label="Table" aria-pressed={surface === "table"} onClick={() => setSurface((current) => (current === "table" ? "play" : "table"))}>
              <Trophy size={21} strokeWidth={1.75} />
            </button>
            <button type="button" className="iconbtn" aria-label="How to play" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={22} strokeWidth={1.75} />
            </button>
            <button type="button" className="iconbtn" aria-label="Statistics" onClick={() => setStatsOpen(true)}>
              <BarChart3 size={21} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="controls">
          <div className="seg" role="group" aria-label="Game mode">
            <button type="button" aria-pressed={surface === "play" && settings.mode === "today"} onClick={() => { setSurface("play"); chooseMode("today"); }} disabled={!ready}>
              Today
            </button>
            <button type="button" aria-pressed={surface === "play" && settings.mode === "open"} onClick={() => { setSurface("play"); chooseMode("open"); }} disabled={!ready}>
              Lengths
            </button>
          </div>
          <div className="control-right">
            <AccountSlot onError={showToast} />
            {surface === "play" && (
            <button
              type="button"
              className={settings.hard ? "hard on" : "hard"}
              role="switch"
              aria-checked={settings.hard}
              onClick={toggleHard}
            >
              <span>Hard</span>
              <span className="hard-track" aria-hidden="true">
                <span className="hard-knob" />
              </span>
            </button>
            )}
          </div>
        </div>
        {surface === "play" && (
        <div className="length-block">
          <span className="eyebrow" id="len-label">
            Letters
          </span>
          <div className="lengths" role="group" aria-labelledby="len-label">
            {LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                className="len"
                aria-pressed={
                  pendingLen != null
                    ? n === pendingLen
                    : todayView
                      ? n === WORD_OF_THE_DAY_LENGTH
                      : n === length
                }
                aria-label={`${n} letters`}
                disabled={!ready}
                onClick={() => chooseLength(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button type="button" className="texty" onClick={dealNew} disabled={!ready || busy}>
            Deal
          </button>
        </div>
        )}
        <div className="subline">
          {surface === "table" ? (
            <p className="sub">Same words for the table. Fewer guesses wins.</p>
          ) : (
            <>
          <p className="sub">{subtitle}</p>
          <p className={session?.runningSince != null ? "clock running" : "clock"} aria-label={`Solve time ${clockLabel}`}>
            {clockLabel}
          </p>
            </>
          )}
        </div>
      </header>

      <div className={toast ? "toast show" : "toast"} role="status" aria-live="polite">
        {toast}
      </div>

      <main className="stage" data-busy={surface === "play" && busy ? "true" : "false"}>
        {surface === "table" ? (
          <TournamentDesk
            signedIn={Boolean(user && !user.isDevFallback)}
            pending={isPending}
            playerName={user?.displayName ?? "Player"}
            onToast={showToast}
          />
        ) : loadError && !session ? (
          <div className="error-block">
            <p>{loadError}</p>
            <button type="button" className="btn" onClick={() => setBootId((n) => n + 1)}>
              Try again
            </button>
          </div>
        ) : (
          <div className="board-slot">
          <form
            className="guess-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitEnter();
            }}
          >
          <input
            ref={inputRef}
            className="native-input"
            aria-label="Type a guess"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            inputMode="text"
            disabled={!ready || session?.status !== "playing"}
            onInvalid={(event) => event.preventDefault()}
            onBeforeInput={(event) => {
              const inputType = event.nativeEvent.inputType;
              if (inputType !== "insertLineBreak" && inputType !== "insertParagraph") return;
              event.preventDefault();
              submitEnter();
            }}
            onInput={(event) => syncFromNative(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              submitEnter();
            }}
          />
          </form>
          <div
            className="board"
            data-len={length}
            data-length={length}
            key={session ? `${session.puzzleId}:${session.length}` : "boot"}
            style={{ "--cols": String(length), "--rows": String(rows) } as CSSProperties}
            role="grid"
            aria-label={`${length} letter guesses`}
          >
            {Array.from({ length: rows }, (_, r) => {
              const committed = guesses[r];
              const isDraft = r === active;
              const letters = (committed ?? (isDraft ? draft : "")).slice(0, length);
              const marks = committed && session ? evaluate(committed, session.answer) : null;
              const label = committed
                ? `Guess ${r + 1}: ${committed
                    .split("")
                    .map((ch, i) => `${ch} ${marks?.[i] ?? ""}`)
                    .join(", ")}`
                : `Guess ${r + 1}`;
              return (
                <div
                  className="row"
                  role="row"
                  key={r}
                  aria-label={label}
                  style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length }, (_, c) => {
                    const ch = letters[c] ?? "";
                    const mark = marks?.[c];
                    const play = animRow === r && Boolean(committed);
                    const dance = danceRow === r;
                    const className = [
                      "tile",
                      ch ? "filled" : "",
                      popAt === c && isDraft ? "pop" : "",
                      shake && isDraft ? "shake" : "",
                      play ? "play" : "",
                      dance ? "dance" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div
                        key={c}
                        role="cell"
                        className={className}
                        data-mark={mark}
                        style={{ "--i": c } as CSSProperties}
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        )}

        {session && session.status !== "playing" && (
          <div className="outcome">
            <p>
              {session.status === "won" ? (
                <>
                  {solvedLine(session.guesses.length)} <span className="answer-inline">{formatClock(session.elapsedMs)}</span>
                </>
              ) : (
                <>
                  The word was <span className="answer-inline">{session.answer}</span>
                </>
              )}
            </p>
            <button type="button" className="btn ghost" onClick={dealNew}>
              Deal another word
            </button>
          </div>
        )}
      </main>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} labelledBy="help-title">
        <h2 id="help-title">How to play</h2>
        <p>
          Today is the shared five-letter word. The numbers pick a length from 3 to 8, the same word for anyone
          who chooses that length today, unless you deal a private one.
        </p>
        <div className="legend">
          <div className="legend-row">
            <div className="tile mini" data-mark="correct">A</div>
            <p>Right letter, right place.</p>
          </div>
          <div className="legend-row">
            <div className="tile mini" data-mark="present">B</div>
            <p>In the word, wrong place. The tick marks it, so color isn’t the only cue.</p>
          </div>
          <div className="legend-row">
            <div className="tile mini" data-mark="absent">C</div>
            <p>Not in the word.</p>
          </div>
        </div>
        <p>
          The clock starts when you type the first letter and pauses if you leave. Tap the board and type with your
          keyboard. A finished puzzle keeps that time in your history. Sign in with X to compare it with everyone
          else who solved the same word. Open the trophy to host a table: you choose the seats, everyone plays the
          same words, and the fewest guesses wins.
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => setHelpOpen(false)}>
            Play
          </button>
        </div>
      </Modal>

      <Modal open={statsOpen} onClose={() => setStatsOpen(false)} labelledBy="stats-title">
        <h2 id="stats-title">Record</h2>
        <div className="seg stats-seg" role="tablist" aria-label="Stats">
          <button type="button" aria-pressed={statsTab === "record"} onClick={() => setStatsTab("record")}>
            You
          </button>
          <button type="button" aria-pressed={statsTab === "word"} onClick={() => setStatsTab("word")}>
            This word
          </button>
          <button type="button" aria-pressed={statsTab === "history"} onClick={() => setStatsTab("history")}>
            History
          </button>
        </div>
        {statsTab === "record" && <RecordBlock history={history} archivePlayed={archive} />}
        {statsTab === "word" && (
          <FieldBlock session={session} signedIn={Boolean(user && !user.isDevFallback)} report={field} state={fieldState} onError={showToast} />
        )}
        {statsTab === "history" && <HistoryList history={history} />}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => setStatsOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} labelledBy="result-title" modal={false} className="sheet">
        {session?.status === "won" ? (
          <h2 id="result-title">{solvedLine(session.guesses.length)}</h2>
        ) : (
          <>
            <h2 id="result-title">That’s the word</h2>
            <p className="answer-word">{session?.answer}</p>
          </>
        )}
        <p className="time-hero">{session ? formatClock(session.elapsedMs) : ""}</p>
        <FieldBlock session={session} signedIn={Boolean(user && !user.isDevFallback)} report={field} state={fieldState} onError={showToast} />
        <div className="actions">
          <button type="button" className="btn" onClick={() => void share()}>
            {copied ? "Copied" : "Share"}
          </button>
          <button type="button" className="btn ghost" onClick={dealNew}>
            Deal another word
          </button>
          <button type="button" className="btn ghost" onClick={() => setResultOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

