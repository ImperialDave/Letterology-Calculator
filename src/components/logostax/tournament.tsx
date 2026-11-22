import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ClubSignIn } from "@/components/logostax/account-slot";
import { formatClock } from "@/lib/logostax/clock";
import { LENGTHS, maxGuesses, needLetters, type Mark } from "@/lib/logostax/engine";
import {
  createTournament,
  forfeitTournament,
  joinTournament,
  leaveTournament,
  listMyTournaments,
  readTournament,
  startTournament,
  submitTournamentGuess,
} from "@/lib/logostax/tournament";
import {
  leaderLine,
  missCost,
  ROUND_MAX,
  ROUND_MIN,
  SEAT_MAX,
  SEAT_MIN,
  tableShare,
  type FinishedRound,
  type StandingRow,
  type TableSummary,
  type TableView,
} from "@/lib/logostax/tournament-score";

const REMEMBER = "fivefold-tournament-v1";

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div className="stepper-ctrl">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <b>{value}</b>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Board({
  length,
  rows,
  guesses,
  draft,
  status,
  shake,
  popAt,
}: {
  length: number;
  rows: number;
  guesses: { word: string; marks: Mark[] }[];
  draft: string;
  status: "playing" | "won" | "lost";
  shake: boolean;
  popAt: number | null;
}) {
  const active = status === "playing" ? guesses.length : -1;
  return (
    <div
      className="board"
      data-len={length}
      style={{ "--cols": String(length), "--rows": String(rows) } as CSSProperties}
      role="grid"
      aria-label={`${length} letter guesses`}
    >
      {Array.from({ length: rows }, (_, r) => {
        const committed = guesses[r];
        const isDraft = r === active;
        const letters = (committed?.word ?? (isDraft ? draft : "")).slice(0, length);
        const marks = committed?.marks ?? null;
        return (
          <div className="row" role="row" key={r} style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
            {Array.from({ length }, (_, c) => {
              const ch = letters[c] ?? "";
              const mark = marks?.[c];
              const className = ["tile", ch ? "filled" : "", popAt === c && isDraft ? "pop" : "", shake && isDraft ? "shake" : ""]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={c} role="cell" className={className} data-mark={mark || undefined}>
                  {ch}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function StandingList({ rows, rounds }: { rows: StandingRow[]; rounds: number }) {
  if (rows.length === 0) return null;
  return (
    <ol className="standings">
      {rows.map((row) => (
        <li key={row.userId} className={row.you ? "stand-row you" : "stand-row"}>
          <span className="stand-rank">{row.rank ?? "·"}</span>
          <span className="stand-name">
            {row.you ? "You" : row.name}
            {row.host ? <span className="stand-host">Host</span> : null}
            <span className="stand-pips" aria-hidden="true">
              {Array.from({ length: rounds }, (_, index) => {
                const cell = row.rounds[index];
                const label = !cell || cell.status === "playing" ? "·" : cell.status === "lost" ? "–" : String(cell.guesses);
                return (
                  <i key={index} data-state={cell?.status ?? "playing"}>
                    {label}
                  </i>
                );
              })}
            </span>
          </span>
          <span className="stand-score">
            {row.finished ? row.score : row.roundsDone > 0 ? `${row.roundsDone}/${rounds}` : "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function TournamentDesk({
  signedIn,
  pending,
  playerName,
  onToast,
}: {
  signedIn: boolean;
  pending: boolean;
  playerName: string;
  onToast: (message: string) => void;
}) {
  const [view, setView] = useState<TableView | null>(null);
  const [mine, setMine] = useState<TableSummary[]>([]);
  const [title, setTitle] = useState("");
  const [seats, setSeats] = useState(4);
  const [rounds, setRounds] = useState(3);
  const [length, setLength] = useState(5);
  const [code, setCode] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [popAt, setPopAt] = useState<number | null>(null);
  const [held, setHeld] = useState<FinishedRound | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuess = useRef(0);
  const viewRef = useRef(view);
  const clockRef = useRef({ elapsed: 0, at: Date.now(), key: "" });
  viewRef.current = view;

  function accept(next: TableView) {
    setView(next);
    if (next.justFinished) setHeld(next.justFinished);
    try {
      localStorage.setItem(REMEMBER, next.code);
    } catch {
      // Private mode can refuse storage; the table still works this visit.
    }
  }

  function forget() {
    setView(null);
    setHeld(null);
    setDraft("");
    setConfirmLeave(false);
    try {
      localStorage.removeItem(REMEMBER);
    } catch {
      // Ignore.
    }
  }

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void listMyTournaments()
      .then((rows) => {
        if (!cancelled) setMine(rows);
      })
      .catch(() => {});
    let remembered = "";
    try {
      remembered = localStorage.getItem(REMEMBER) ?? "";
    } catch {
      remembered = "";
    }
    if (remembered) {
      void readTournament({ data: { code: remembered } })
        .then((next) => {
          if (!cancelled) accept(next);
        })
        .catch(() => {
          if (!cancelled) forget();
        });
    }
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!view || view.status === "done") return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const current = viewRef.current;
      if (!current || current.status === "done") return;
      void readTournament({ data: { code: current.code } })
        .then((next) => {
          if (viewRef.current?.code === next.code) accept(next);
        })
        .catch((error: unknown) => {
          const text = message(error, "");
          if (/not at this table|no table/i.test(text)) forget();
        });
    }, 3000);
    return () => window.clearInterval(id);
  }, [view?.code, view?.status]);

  useEffect(() => {
    if (!view?.board || view.board.status !== "playing" || view.board.guesses.length === 0 || held) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [view?.board?.roundIndex, view?.board?.status, view?.board?.guesses.length, held]);

  useEffect(() => {
    setDraft("");
    const el = inputRef.current;
    if (el) el.value = "";
  }, [view?.board?.roundIndex, view?.code]);

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      onToast(message(error, "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  function typeDraft(raw: string) {
    const size = view?.length ?? length;
    const next = raw.toLowerCase().replace(/[^a-z]/g, "").slice(0, size);
    const el = inputRef.current;
    if (el && el.value !== next) el.value = next;
    setDraft(next);
    setPopAt(next.length > draft.length ? next.length - 1 : null);
  }

  function keepControlTap(event: { target: EventTarget | null; preventDefault: () => void; stopPropagation: () => void }) {
    const target = event.target;
    if (target instanceof Element && target.closest("button, a, [role='switch']")) event.preventDefault();
    event.stopPropagation();
  }

  async function commitGuess() {
    const stamped = Date.now();
    if (stamped - lastGuess.current < 80) return;
    lastGuess.current = stamped;
    const current = viewRef.current;
    if (!current?.board || current.board.status !== "playing" || held) return;
    if (draft.length !== current.length) {
      onToast(needLetters(current.length));
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      return;
    }
    await run(async () => {
      const next = await submitTournamentGuess({
        data: { code: current.code, round: current.board?.roundIndex ?? 0, guess: draft },
      });
      setDraft("");
      if (inputRef.current) inputRef.current.value = "";
      accept(next);
    });
  }

  if (pending) {
    return (
      <div className="table-desk">
        <p className="sub">Checking your account…</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="table-desk">
        <div className="table-scroll">
          <h2 className="table-title">A table</h2>
          <p className="table-copy">
            Host a tournament, pick how many seats, and share the code. Everyone gets the same words. Fewest guesses wins.
          </p>
          <ClubSignIn label="Sign in to host a table" className="btn" />
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="table-desk" onPointerDown={keepControlTap}>
        <div className="table-scroll">
          <h2 className="table-title">A table</h2>
          <p className="table-copy">
            Same words for everyone who sits down. You choose the seats, from {SEAT_MIN} to {SEAT_MAX}. A miss counts as{" "}
            {missCost(length)}, one worse than using every guess. A tie goes to the faster clock.
          </p>
          {mine.length > 0 && (
            <div className="resume">
              <span className="eyebrow">Open tables</span>
              {mine.map((table) => (
                <button
                  key={table.code}
                  type="button"
                  className="resume-row"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      accept(await readTournament({ data: { code: table.code } }));
                    })
                  }
                >
                  <b>{table.title}</b>
                  <span>
                    {table.code} · {table.filled}/{table.seats} · {table.status === "lobby" ? "lobby" : "live"}
                  </span>
                </button>
              ))}
            </div>
          )}
          <label className="field">
            <span className="eyebrow">Name</span>
            <input
              value={title}
              maxLength={32}
              placeholder="Friday table"
              autoComplete="off"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <Stepper label="Seats" value={seats} min={SEAT_MIN} max={SEAT_MAX} onChange={setSeats} />
          <Stepper label="Words" value={rounds} min={ROUND_MIN} max={ROUND_MAX} onChange={setRounds} />
          <div className="length-block table-lengths">
            <span className="eyebrow">Letters</span>
            <div className="lengths" role="group" aria-label="Word length">
              {LENGTHS.map((n) => (
                <button key={n} type="button" className="len" aria-pressed={n === length} onClick={() => setLength(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                accept(await createTournament({ data: { title, seats, rounds, length, player: playerName } }));
                setMine(await listMyTournaments().catch(() => []));
              })
            }
          >
            Host this table
          </button>
          <form
            className="join-row"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                accept(await joinTournament({ data: { code, player: playerName } }));
              });
            }}
          >
            <input
              value={code}
              aria-label="Table code"
              placeholder="Code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={8}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <button type="submit" className="btn ghost" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 5}>
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  const playing = view.board;
  const clockKey = `${view.code}:${playing?.roundIndex}:${playing?.elapsedMs}`;
  if (playing && clockRef.current.key !== clockKey) {
    clockRef.current = { elapsed: playing.elapsedMs, at: Date.now(), key: clockKey };
  }
  const shownBoard = held
    ? { guesses: held.guesses, status: held.status, roundIndex: held.roundIndex }
    : playing
      ? { guesses: playing.guesses, status: playing.status, roundIndex: playing.roundIndex }
      : null;
  const clockMs = playing && !held && playing.guesses.length > 0 ? clockRef.current.elapsed + Math.max(0, now - clockRef.current.at) : 0;
  const you = view.standings.find((row) => row.you);
  const headline = leaderLine(view);

  return (
    <div className="table-desk" onPointerDown={keepControlTap}>
      <div className="table-meta">
        <p className="code-hero">{view.code}</p>
        <p className="sub">
          {view.title} · {view.players.length}/{view.seats} seated · {view.rounds} {view.rounds === 1 ? "word" : "words"} ·{" "}
          {view.length} letters
        </p>
      </div>

      {view.status === "lobby" ? (
        <div className="table-scroll">
          <ul className="seat-list">
            {Array.from({ length: view.seats }, (_, index) => {
              const player = view.players[index];
              return (
                <li key={index} className={player ? "seat filled" : "seat"}>
                  {player ? (
                    <>
                      {player.you ? "You" : player.name}
                      {player.host ? <span className="stand-host">Host</span> : null}
                    </>
                  ) : (
                    "Open seat"
                  )}
                </li>
              );
            })}
          </ul>
          <p className="table-copy">
            Share the code. Start once at least two people are here — empty seats stay empty, so the table can be smaller than the cap.
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const ok = await copyText(`Join my Logostax table “${view.title}”\nCode ${view.code}`);
                  onToast(ok ? "Copied the code" : "Couldn't copy");
                })
              }
            >
              Copy code
            </button>
            {view.youAreHost ? (
              <button
                type="button"
                className="btn"
                disabled={busy || view.players.length < 2}
                onClick={() =>
                  void run(async () => {
                    accept(await startTournament({ data: { code: view.code } }));
                  })
                }
              >
                {view.players.length < 2 ? "Need two players" : "Start the words"}
              </button>
            ) : (
              <p className="sub">Waiting for the host to start.</p>
            )}
            <button
              type="button"
              className="btn ghost"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await leaveTournament({ data: { code: view.code } });
                  forget();
                  setMine(await listMyTournaments().catch(() => []));
                })
              }
            >
              {view.youAreHost ? "Close the table" : "Leave"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {shownBoard && (
            <div className="board-slot table-board">
              {playing && !held && (
                <form
                  className="guess-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void commitGuess();
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
                  onInvalid={(event) => event.preventDefault()}
                  onBeforeInput={(event) => {
                    const inputType = event.nativeEvent.inputType;
                    if (inputType !== "insertLineBreak" && inputType !== "insertParagraph") return;
                    event.preventDefault();
                    void commitGuess();
                  }}
                  onInput={(event) => typeDraft(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    void commitGuess();
                  }}
                />
                </form>
              )}
              <Board
                length={view.length}
                rows={maxGuesses(view.length)}
                guesses={shownBoard.guesses}
                draft={held ? "" : draft}
                status={shownBoard.status}
                shake={shake}
                popAt={popAt}
              />
            </div>
          )}
          <div className="table-scroll tight">
            <p className="table-copy">
              {held ? (
                held.status === "won" ? (
                  <>
                    Word {held.roundIndex + 1} of {view.rounds} was <span className="answer-inline">{held.answer}</span>
                  </>
                ) : (
                  <>
                    The word was <span className="answer-inline">{held.answer}</span>
                  </>
                )
              ) : playing ? (
                <>
                  Word {playing.roundIndex + 1} of {view.rounds}
                  {playing.guesses.length > 0 ? ` · ${formatClock(clockMs)}` : ""}
                </>
              ) : (
                headline
              )}
            </p>
            {held && (
              <ul className="seat-list">
                {view.standings.map((row) => {
                  const cell = row.rounds[held.roundIndex];
                  const label =
                    !cell || cell.status === "playing" ? "still guessing" : cell.status === "lost" ? "miss" : `${cell.guesses}`;
                  return (
                    <li key={row.userId} className="seat filled">
                      <span>{row.you ? "You" : row.name}</span>
                      <b>{label}</b>
                    </li>
                  );
                })}
              </ul>
            )}
            {!held && headline && playing && <p className="sub">{headline}</p>}
            <StandingList rows={view.standings} rounds={view.rounds} />
            <div className="actions">
              {held && (
                <button type="button" className="btn" onClick={() => setHeld(null)}>
                  {playing ? "Next word" : "See the table"}
                </button>
              )}
              {view.status === "done" && you && (
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    void run(async () => {
                      const ok = await copyText(tableShare(view, you));
                      onToast(ok ? "Copied" : "Couldn't copy");
                    })
                  }
                >
                  Share result
                </button>
              )}
              {playing && !held &&
                (confirmLeave ? (
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        accept(await forfeitTournament({ data: { code: view.code } }));
                        setConfirmLeave(false);
                        setHeld(null);
                      })
                    }
                  >
                    Forfeit the rest
                  </button>
                ) : (
                  <button type="button" className="btn ghost" onClick={() => setConfirmLeave(true)}>
                    Leave the table
                  </button>
                ))}
              {(view.status === "done" || !playing) && (
                <button type="button" className="btn ghost" onClick={forget}>
                  Back
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
