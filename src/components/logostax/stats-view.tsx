import { formatClock } from "@/lib/logostax/clock";
import type { FieldReport, PuzzleSlice } from "@/lib/logostax/field";
import { personalStats, type HistoryEntry } from "@/lib/logostax/history";
import { utcDate, type Session } from "@/lib/logostax/engine";
import { ClubSignIn } from "./account-slot";

function ordinal(n: number): string {
  const mod = n % 100;
  if (mod >= 11 && mod <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

export function puzzleBlurb(puzzle: PuzzleSlice, won: boolean, shared: boolean): string {
  const label = shared ? "today's shared puzzle" : "this dealt word";
  if (puzzle.players === 0 && !won) return `You'll be the first result on ${label}.`;
  if (puzzle.solved === 0) return won ? `You're the first solve on ${label}.` : `No solves on ${label} yet.`;
  if (!won) {
    const mid = puzzle.medianMs == null ? "" : ` The middle solve took ${formatClock(puzzle.medianMs)}.`;
    return `${puzzle.solved} ${puzzle.solved === 1 ? "person" : "people"} solved ${label}.${mid}`;
  }
  if (puzzle.solved === 1) return `You're the first solve on ${label}.`;
  const place = puzzle.rank == null ? "" : `${ordinal(puzzle.rank)} of ${puzzle.solved} by time`;
  return place ? `On ${label} you're ${place}.` : `On ${label}, ${puzzle.solved} people have solved it.`;
}

export function fieldBlurb(report: FieldReport, won: boolean): string {
  if (report.players === 0 && !won) return "You'll be the first result on this word.";
  if (report.solved === 0) return won ? "You're the first solve on this word." : "No solves on this word yet.";
  if (!won) {
    const mid = report.medianMs == null ? "" : ` The middle solve took ${formatClock(report.medianMs)}.`;
    return `${report.solved} ${report.solved === 1 ? "solver" : "solvers"} finished it.${mid}`;
  }
  if (report.solved === 1) return "You're the first solve on this word.";
  const place = report.yourRank == null ? "" : `${ordinal(report.yourRank)} of ${report.solved} by time. `;
  const pace = report.fasterThanPct == null ? "" : `Faster than ${report.fasterThanPct}% of the other solvers.`;
  return `${place}${pace}`.trim();
}

export function PaceMeter({ you, median }: { you: number; median: number | null }) {
  if (median == null) return null;
  const span = Math.max(you, median, 1);
  const youAt = Math.min(96, Math.max(4, (you / span) * 100));
  const midAt = Math.min(96, Math.max(4, (median / span) * 100));
  return (
    <div className="pace" aria-hidden="true">
      <div className="pace-track">
        <span className="pace-mark mid" style={{ left: `${midAt}%` }} />
        <span className="pace-mark you" style={{ left: `${youAt}%` }} />
      </div>
      <div className="pace-key">
        <span>You {formatClock(you)}</span>
        <span>Middle {formatClock(median)}</span>
      </div>
    </div>
  );
}

export function RecordBlock({ history, archivePlayed }: { history: HistoryEntry[]; archivePlayed: number }) {
  const stats = personalStats(history, utcDate());
  return (
    <div className="stack">
      <div className="stats">
        <div className="stat">
          <b>{stats.played}</b>
          <span>Played</span>
        </div>
        <div className="stat">
          <b>{stats.rate}</b>
          <span>Solve %</span>
        </div>
        <div className="stat">
          <b>{stats.bestMs == null ? "–" : formatClock(stats.bestMs)}</b>
          <span>Best time</span>
        </div>
        <div className="stat">
          <b>{stats.streak}</b>
          <span>Today streak</span>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <b>{stats.averageMs == null ? "–" : formatClock(stats.averageMs)}</b>
          <span>Avg time</span>
        </div>
        <div className="stat">
          <b>{stats.averageGuesses ?? "–"}</b>
          <span>Avg guesses</span>
        </div>
        <div className="stat">
          <b>{stats.bestStreak}</b>
          <span>Best streak</span>
        </div>
        <div className="stat">
          <b>{stats.solved}</b>
          <span>Solved</span>
        </div>
      </div>
      {stats.byLength.length > 0 && (
        <div className="len-table">
          {stats.byLength.map((row) => (
            <div className="len-line" key={row.length}>
              <span>{row.length} letters</span>
              <span>
                {row.solved}/{row.played}
              </span>
              <span>{row.bestMs == null ? "–" : formatClock(row.bestMs)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="note">
        The streak counts the word of the day only. The clock starts on your first letter and pauses if you leave.
        {archivePlayed > 0 ? ` ${archivePlayed} earlier games were saved before times were kept.` : ""}
      </p>
    </div>
  );
}

export function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return <p className="note">Finished puzzles, with their times, will land here.</p>;
  return (
    <ol className="history">
      {history.slice(0, 30).map((entry) => (
        <li key={entry.puzzleId}>
          <span className="history-word">{entry.answer}</span>
          <span className="history-meta">
            {entry.kind === "table" && entry.length === 5 ? "Word of the day" : `${entry.length} letters`}
            {entry.kind === "deal" ? " · dealt" : ""}
            {entry.hard ? " · hard" : ""}
          </span>
          <span className="history-score">
            {entry.status === "won" ? formatClock(entry.elapsedMs) : "Miss"}
            <small>{entry.status === "won" ? `${entry.guesses} guesses` : `${entry.guesses} used`}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function FieldBlock({
  session,
  signedIn,
  report,
  state,
}: {
  session: Session | null;
  signedIn: boolean;
  report: (FieldReport & { puzzle?: PuzzleSlice | null }) | null;
  state: "idle" | "loading" | "ready" | "error";
  onError: (message: string) => void;
}) {
  if (!session || session.status === "playing") {
    return <p className="note">Finish the puzzle to see how your time compares with everyone who solved the same word.</p>;
  }
  if (!signedIn) {
    return (
      <div className="stack">
        <p>Sign in to put this time on the shared table and see where it sits.</p>
        <ClubSignIn label="Sign in" className="btn" />
      </div>
    );
  }
  if (state === "loading" || state === "idle") return <p className="note">Checking the table…</p>;
  if (state === "error" || !report) return <p className="note">The table didn't load. Your time is still saved on this device.</p>;
  const won = session.status === "won";
  const shared = session.kind === "table";
  return (
    <div className="stack">
      {report.puzzle && <p className="field-line">{puzzleBlurb(report.puzzle, won, shared)}</p>}
      <p className="field-line">{fieldBlurb(report, won)}</p>
      {won && <PaceMeter you={session.elapsedMs} median={report.medianMs} />}
      <div className="stats">
        <div className="stat">
          <b>{report.players}</b>
          <span>Played word</span>
        </div>
        <div className="stat">
          <b>{report.solved}</b>
          <span>Solved it</span>
        </div>
        <div className="stat">
          <b>{report.medianGuesses ?? "–"}</b>
          <span>Mid guesses</span>
        </div>
        <div className="stat">
          <b>{report.fastestMs == null ? "–" : formatClock(report.fastestMs)}</b>
          <span>Fastest</span>
        </div>
      </div>
      {won && report.fewerGuessesThanPct != null && (
        <p className="note">Fewer guesses than {report.fewerGuessesThanPct}% of the other solvers of this word.</p>
      )}
    </div>
  );
}
