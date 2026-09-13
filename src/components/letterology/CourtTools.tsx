import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BRAIN_GRADES,
  MARK_NAME,
  VERDICT_NAME,
  markOf,
  type BrainVerdict,
} from "@/lib/letterology/brain";
import {
  downloadBrainAnswersCsv,
  downloadBrainSittingsCsv,
  loadBrainRoll,
} from "@/lib/letterology/brain-functions";
import type { BrainRollSummary, BrainSittingRow } from "@/lib/letterology/brain-sittings";
import { downloadThresholdAnswersCsv, downloadThresholdCsv, loadThresholdRoll } from "@/lib/letterology/threshold-functions";
import type { MembershipMark } from "@/lib/letterology/threshold";
import { ThresholdRollList, type ThresholdRollRow } from "@/components/letterology/ThresholdRoll";
import { VOICE } from "@/lib/letterology/voice";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

type Tongue = "la" | "el";
export type CourtDesk = "overview" | "portraits" | "threshold";

const DESKS: { id: CourtDesk; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "portraits", label: "Portraits" },
  { id: "threshold", label: "Threshold" },
];

function gateFromError(err: unknown): "auth" | "forbidden" | "error" {
  const message = err instanceof Error ? err.message : String(err);
  if (/unauthorized/i.test(message)) return "auth";
  if (/forbidden/i.test(message)) return "forbidden";
  return "error";
}

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Kicker() {
  return <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · The Court</p>;
}

export function CourtTools({ tongue, desk }: { tongue: Tongue; desk: CourtDesk }) {
  const { user, isPending } = useCurrentUserState();
  const [query, setQuery] = useState("");
  const [mark, setMark] = useState<MembershipMark | "all">("all");
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "auth" }
    | { status: "forbidden" }
    | { status: "error" }
    | { status: "ready"; summary: BrainRollSummary; sittings: BrainSittingRow[]; thresholds: ThresholdRollRow[] }
  >({ status: "loading" });

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setState({ status: "auth" });
      return;
    }
    let cancelled = false;
    void Promise.all([loadBrainRoll(), loadThresholdRoll()])
      .then(([data, threshold]) => {
        if (!cancelled) {
          setState({
            status: "ready",
            summary: data.summary,
            sittings: data.sittings,
            thresholds: threshold.sittings,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ status: gateFromError(err) === "auth" ? "auth" : gateFromError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, user]);

  const needle = query.trim().toLowerCase();
  const sittings = useMemo(() => {
    if (state.status !== "ready") return [];
    if (!needle) return state.sittings;
    return state.sittings.filter((row) => `${row.name} ${row.title} ${row.grade}`.toLowerCase().includes(needle));
  }, [needle, state]);
  const thresholds = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.thresholds.filter((row) => {
      if (mark !== "all" && row.mark !== mark) return false;
      if (!needle) return true;
      return `${row.handle} ${row.house} ${row.markName}`.toLowerCase().includes(needle);
    });
  }, [mark, needle, state]);

  if (isPending || state.status === "loading") {
    return (
      <section className="mx-auto max-w-xl space-y-6" aria-hidden="true">
        <div className="h-3 w-40 rounded bg-ink/10" />
        <div className="h-12 w-64 rounded bg-ink/10" />
        <div className="h-24 rounded-xl bg-raised" />
      </section>
    );
  }
  if (state.status === "auth") {
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <Kicker />
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.courtTitle}</h1>
        <p className="leading-relaxed text-ink/90">{VOICE.courtLede}</p>
        <p className="leading-relaxed text-ink/90">{VOICE.rollRefusal}</p>
        <Button asChild>
          <Link to="/login" search={{ next: "/court" }}>
            {VOICE.rollSignIn}
          </Link>
        </Button>
      </section>
    );
  }
  if (state.status === "forbidden") {
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <Kicker />
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.courtTitle}</h1>
        <p className="leading-relaxed text-ink/90">{VOICE.rollRefusal}</p>
      </section>
    );
  }
  if (state.status === "error") {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <Kicker />
        <h1 className="font-display text-4xl text-ink">{VOICE.courtTitle}</h1>
        <p className="leading-relaxed text-ink/90">The court could not be opened. Try again.</p>
      </section>
    );
  }

  const { summary } = state;
  const attention = state.thresholds.filter((row) => row.mark === "unseat" || row.mark === "costume");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Kicker />
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.courtTitle}</h1>
        <p className="max-w-2xl leading-relaxed text-ink/90">{VOICE.courtLede}</p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Court desks">
        {DESKS.map((item) => (
          <Link
            key={item.id}
            to="/court"
            search={{ tongue, desk: item.id === "overview" ? undefined : item.id }}
            className={cn(
              "inline-flex h-11 items-center rounded-md px-4 font-display text-xs tracking-[0.14em] uppercase shadow-[var(--shadow-border)]",
              desk === item.id ? "bg-primary text-primary-fg" : "bg-raised text-ink hover:shadow-[var(--shadow-border-hover)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {desk !== "overview" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={desk === "portraits" ? "Search a name or grade" : "Search a handle or mark"}
              aria-label="Search the court"
            />
          </div>
          {desk === "threshold" ? (
            <div className="flex flex-wrap gap-2">
              {(["all", "unseat", "costume", "hold", "keep", "thin"] as const).map((id) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={mark === id ? "default" : "outline"}
                  onClick={() => setMark(id)}
                >
                  {id === "all" ? "All" : id === "unseat" ? "Do not seat" : id === "costume" ? "Costume" : id === "hold" ? "Hold" : id === "keep" ? "Keep" : "Thin"}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {desk === "overview" ? (
        <Overview
          tongue={tongue}
          summary={summary}
          sittings={state.sittings}
          thresholds={state.thresholds}
          attention={attention}
        />
      ) : null}
      {desk === "portraits" ? <Portraits tongue={tongue} summary={summary} sittings={sittings} /> : null}
      {desk === "threshold" ? <ThresholdRollList sittings={thresholds} /> : null}
    </div>
  );
}

function Overview({
  tongue,
  summary,
  sittings,
  thresholds,
  attention,
}: {
  tongue: Tongue;
  summary: BrainRollSummary;
  sittings: BrainSittingRow[];
  thresholds: ThresholdRollRow[];
  attention: ThresholdRollRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard label="Portraits" value={summary.sittings} />
        <CountCard label="Named" value={summary.named} />
        <CountCard label="Threshold" value={thresholds.length} />
        <CountCard label="Needs a look" value={attention.length} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Doors</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Send someone in</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">The portrait is public. The threshold is a membership screen. Marks stay here.</p>
          <p className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/brain" search={{ tongue, a: undefined, n: undefined }}>
                Portrait
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/threshold">Threshold</Link>
            </Button>
          </p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Take-home</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Download</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Four sheets. Sittings and long answers, portraits and threshold.</p>
          <p className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void downloadBrainSittingsCsv().then((file) => download(file.filename, file.csv))}>
              Portraits
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadBrainAnswersCsv().then((file) => download(file.filename, file.csv))}>
              Portrait answers
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadThresholdCsv().then((file) => download(file.filename, file.csv))}>
              Threshold
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadThresholdAnswersCsv().then((file) => download(file.filename, file.csv))}>
              Threshold answers
            </Button>
          </p>
        </article>
      </section>

      {attention.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Needs a look</h2>
          <p className="max-w-2xl leading-relaxed text-muted">Costume or do-not-seat. Read the highlighted answers before you offer an office.</p>
          <ul className="space-y-3">
            {attention.slice(0, 8).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
                <div>
                  <p className="font-display text-lg text-ink">{row.handle}</p>
                  <p className="text-sm text-muted">
                    {row.markName} · {when(row.createdAt)}
                  </p>
                </div>
                <Link
                  to="/brain/roll/threshold/$id"
                  params={{ id: row.id }}
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  Open reading
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">Recent portraits</h2>
            <Link
              to="/court"
              search={{ tongue, desk: "portraits" }}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              All portraits
            </Link>
          </div>
          {sittings.length === 0 ? (
            <p className="leading-relaxed text-muted">{VOICE.rollEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {sittings.slice(0, 5).map((row) => (
                <SittingRow key={row.id} row={row} tongue={tongue} />
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">Recent threshold</h2>
            <Link
              to="/court"
              search={{ tongue, desk: "threshold" }}
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              All readings
            </Link>
          </div>
          {thresholds.length === 0 ? (
            <p className="leading-relaxed text-muted">{VOICE.thresholdEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {thresholds.slice(0, 5).map((row) => (
                <li key={row.id} className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{when(row.createdAt)}</p>
                      <p className="mt-1 font-display text-xl text-ink">{row.handle}</p>
                    </div>
                    <p className="font-display text-lg text-primary">{row.markName}</p>
                  </div>
                  <Link
                    to="/brain/roll/threshold/$id"
                    params={{ id: row.id }}
                    className="mt-2 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                  >
                    Open reading
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Portraits({
  tongue,
  summary,
  sittings,
}: {
  tongue: Tongue;
  summary: BrainRollSummary;
  sittings: BrainSittingRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-2xl text-ink">How they look</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(VERDICT_NAME) as BrainVerdict[]).map((id) => (
            <li key={id}>
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{VERDICT_NAME[id]}</p>
              <p className="mt-1 font-display text-3xl text-primary">{summary.verdicts[id]}</p>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
          {BRAIN_GRADES.map((grade) => (
            <li key={grade} className="text-center">
              <p className={cn("font-display", summary.grades[grade] ? "text-primary" : "text-muted/45")}>{grade}</p>
              <p className="text-xs text-muted">{summary.grades[grade]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-2xl text-ink">Ten aspects</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {summary.aspects.map((row) => (
            <li key={row.id} className="border-t border-ink/10 pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg text-ink">{row.name}</p>
                <p className="font-display text-sm tracking-[0.12em] text-primary uppercase">{MARK_NAME[markOf(row.mean)]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Sittings</h2>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" onClick={() => void downloadBrainSittingsCsv().then((file) => download(file.filename, file.csv))}>
              Download sittings
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadBrainAnswersCsv().then((file) => download(file.filename, file.csv))}>
              Download answers
            </Button>
          </div>
        </div>
        {sittings.length === 0 ? (
          <p className="leading-relaxed text-muted">{VOICE.rollEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {sittings.map((row) => (
              <SittingRow key={row.id} row={row} tongue={tongue} />
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <summary className="cursor-pointer font-display text-2xl text-ink">Item heat</summary>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Plus share is how often people sat on the plus pole. Canonical, after the sides were un-flipped.
        </p>
        <ul className="mt-5 space-y-3">
          {summary.items.map((row) => (
            <li key={row.id}>
              <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">
                {row.kind === "looking" ? "Looking" : "Trait"} · {row.aspect}
              </p>
              <p className="mt-1 font-display text-lg text-ink">{row.prompt}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full bg-primary" style={{ width: `${row.plusShare}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {MARK_NAME[markOf(row.mean)]} mean · {row.plusShare} in a hundred toward plus
              </p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function SittingRow({ row, tongue }: { row: BrainSittingRow; tongue: Tongue }) {
  return (
    <li className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{when(row.createdAt)}</p>
          <p className="mt-1 font-display text-xl text-ink">{row.name}</p>
          <p className="text-sm text-muted">
            {VERDICT_NAME[row.verdict]} · {row.title}
          </p>
        </div>
        <p className="font-display text-3xl text-primary">{row.grade}</p>
      </div>
      <p className="mt-3 flex flex-wrap gap-4">
        <Link
          to="/brain/roll/$id"
          params={{ id: row.id }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Open sitting
        </Link>
        <Link
          to="/brain"
          search={{ a: row.token, n: row.guest ? undefined : row.name, tongue }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
        >
          Certificate
        </Link>
      </p>
    </li>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-4xl text-primary">{value}</p>
    </article>
  );
}

export function CourtGone() {
  return (
    <section className="mx-auto max-w-xl space-y-4">
      <Kicker />
      <h1 className="font-display text-4xl text-ink">Sitting gone</h1>
      <p className="leading-relaxed text-ink/90">That sitting is not on the court.</p>
      <Link
        to="/court"
        className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
      >
        Back to the court
      </Link>
    </section>
  );
}
