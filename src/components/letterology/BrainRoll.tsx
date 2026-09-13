import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  BRAIN_GRADES,
  ITEMS,
  MARK_NAME,
  VERDICT_NAME,
  displayPoles,
  markOf,
  type BrainChoice,
  type BrainReading,
  type BrainVerdict,
} from "@/lib/letterology/brain";
import {
  downloadBrainAnswersCsv,
  downloadBrainSittingsCsv,
  loadBrainRoll,
  loadBrainSitting,
} from "@/lib/letterology/brain-functions";
import type { BrainRollSummary, BrainSittingRecord, BrainSittingRow, StoredAnswer } from "@/lib/letterology/brain-sittings";
import { loadThresholdRoll } from "@/lib/letterology/threshold-functions";
import { ThresholdRollList, type ThresholdRollRow } from "@/components/letterology/ThresholdRoll";
import { VOICE } from "@/lib/letterology/voice";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

type Tongue = "la" | "el";

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

function RollKicker() {
  return <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · The Roll</p>;
}

function RollAuth() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <RollKicker />
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.rollTitle}</h1>
      <p className="leading-relaxed text-ink/90">{VOICE.rollLede}</p>
      <p className="leading-relaxed text-ink/90">{VOICE.rollRefusal}</p>
      <Button asChild>
        <Link to="/login" search={{ next: "/brain/roll" }}>
          {VOICE.rollSignIn}
        </Link>
      </Button>
    </section>
  );
}

function RollRefusal() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <RollKicker />
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.rollTitle}</h1>
      <p className="leading-relaxed text-ink/90">{VOICE.rollRefusal}</p>
    </section>
  );
}

function RollSkeleton() {
  return (
    <section className="mx-auto max-w-xl space-y-6" aria-hidden="true">
      <div className="h-3 w-40 rounded bg-ink/10" />
      <div className="h-12 w-64 rounded bg-ink/10" />
      <div className="h-24 rounded-xl bg-raised" />
    </section>
  );
}

export function BrainRoll({ tongue }: { tongue: Tongue }) {
  const { user, isPending } = useCurrentUserState();
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

  if (isPending || state.status === "loading") return <RollSkeleton />;
  if (state.status === "auth") return <RollAuth />;
  if (state.status === "forbidden") return <RollRefusal />;
  if (state.status === "error") {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <RollKicker />
        <h1 className="font-display text-4xl text-ink">{VOICE.rollTitle}</h1>
        <p className="leading-relaxed text-ink/90">The roll could not be opened. Try again.</p>
      </section>
    );
  }

  const { summary, sittings, thresholds } = state;

  async function saveCsv(kind: "sittings" | "answers") {
    const file = kind === "sittings" ? await downloadBrainSittingsCsv() : await downloadBrainAnswersCsv();
    download(file.filename, file.csv);
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <RollKicker />
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.rollTitle}</h1>
        <p className="max-w-2xl leading-relaxed text-ink/90">{VOICE.rollLede}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <CountCard label="Sittings" value={summary.sittings} />
        <CountCard label="Named" value={summary.named} />
        <CountCard label="Guests" value={summary.guests} />
      </section>

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
        <p className="mt-6 font-display text-xs tracking-[0.16em] text-muted uppercase">Grade</p>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
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
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">Mean lean from the trait items. Looking items stay on the grade.</p>
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

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Fifty items</h2>
        <p className="max-w-2xl leading-relaxed text-muted">
          Plus share is how often people sat on the plus pole. Canonical, after the sides were un-flipped.
        </p>
        <ul className="space-y-3">
          {summary.items.map((row) => (
            <li key={row.id} className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
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
      </section>

      <ThresholdRollList sittings={thresholds} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Sittings</h2>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" onClick={() => void saveCsv("sittings")}>
              Download sittings
            </Button>
            <Button type="button" variant="outline" onClick={() => void saveCsv("answers")}>
              Download answers
            </Button>
          </div>
        </div>
        {sittings.length === 0 ? (
          <p className="leading-relaxed text-muted">{VOICE.rollEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {sittings.map((row) => (
              <li key={row.id} className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
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
            ))}
          </ul>
        )}
      </section>
    </div>
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

export function BrainRollSitting({ id, tongue }: { id: string; tongue: Tongue }) {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "auth" }
    | { status: "forbidden" }
    | { status: "missing" }
    | { status: "error" }
    | { status: "ready"; record: BrainSittingRecord; reading: BrainReading | null }
  >({ status: "loading" });

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setState({ status: "auth" });
      return;
    }
    let cancelled = false;
    void loadBrainSitting({ data: id })
      .then((data) => {
        if (cancelled) return;
        if (!data) setState({ status: "missing" });
        else setState({ status: "ready", record: data.record, reading: data.reading });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: gateFromError(err) === "forbidden" ? "forbidden" : gateFromError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, isPending, user]);

  if (isPending || state.status === "loading") return <RollSkeleton />;
  if (state.status === "auth") return <Navigate to="/login" search={{ next: "/court" }} />;
  if (state.status === "forbidden") return <RollRefusal />;
  if (state.status === "missing" || state.status === "error") {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <RollKicker />
        <h1 className="font-display text-4xl text-ink">Sitting gone</h1>
        <p className="leading-relaxed text-ink/90">That sitting is not on the roll.</p>
        <Link
          to="/court"
          search={{ desk: "portraits" }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Back to the court
        </Link>
      </section>
    );
  }

  const { record, reading } = state;
  const byId = new Map(ITEMS.map((item) => [item.id, item]));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <RollKicker />
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{when(record.createdAt)}</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{record.name}</h1>
        <p className="font-display text-xl text-primary">{record.title}</p>
        <p className="max-w-2xl leading-relaxed text-ink/90">{record.pattern}</p>
        <p className="font-display text-6xl text-primary">{record.grade}</p>
        {reading ? <p className="max-w-2xl leading-relaxed text-ink/90">{reading.headline}</p> : null}
        <p className="flex flex-wrap gap-4">
          <Link
            to="/court"
            search={{ desk: "portraits" }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Back to the court
          </Link>
          <Link
            to="/brain"
            search={{ a: record.token, n: record.guest ? undefined : record.name, tongue }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            Certificate
          </Link>
        </p>
      </header>

      {reading ? (
        <>
          <section className="space-y-6">
            <h2 className="font-display text-2xl text-ink">Five seats</h2>
            {reading.domains.map((row) => (
              <article key={row.id} className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{row.job}</p>
                    <h3 className="mt-1 font-display text-2xl text-ink">{row.name}</h3>
                  </div>
                  <p className="font-display text-3xl text-primary">{row.markName}</p>
                </div>
                <p className="mt-4 leading-relaxed text-ink/90">{row.gold}</p>
                <p className="mt-3 leading-relaxed text-ink/80">{row.shadow}</p>
              </article>
            ))}
          </section>
          <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
            <h2 className="font-display text-2xl text-ink">Ten aspects</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {reading.aspects.map((row) => (
                <li key={row.id} className="border-t border-ink/10 pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg text-ink">{row.name}</p>
                    <p className="font-display text-sm tracking-[0.12em] text-primary uppercase">{row.markName}</p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{row.job}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Fifty answers</h2>
        <ul className="space-y-3">
          {record.answers.map((answer) => (
            <AnswerCard key={answer.id} answer={answer} item={byId.get(answer.id)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function AnswerCard({
  answer,
  item,
}: {
  answer: StoredAnswer;
  item?: (typeof ITEMS)[number];
}) {
  if (!item) {
    return (
      <li className="rounded-xl bg-raised p-4 text-sm text-muted shadow-[var(--shadow-border)]">
        {answer.id} · {answer.choice}
      </li>
    );
  }
  const poles = displayPoles(item, false);
  const choice = answer.choice as BrainChoice;
  const toward = choice < 2 ? "plus" : choice > 2 ? "minus" : "both";
  return (
    <li className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
      <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">
        {item.kind === "looking" ? "Looking" : "Trait"} · {item.aspect}
      </p>
      <p className="mt-1 font-display text-lg text-ink">{item.prompt}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className={cn("text-sm leading-relaxed", toward === "plus" ? "text-ink" : "text-muted")}>{poles.left}</p>
        <p className={cn("text-sm leading-relaxed sm:text-right", toward === "minus" ? "text-ink" : "text-muted")}>
          {poles.right}
        </p>
      </div>
      <p className="mt-3 font-display text-xs tracking-[0.14em] text-primary uppercase">
        {toward === "both" ? "Both" : toward === "plus" ? "Plus pole" : "Minus pole"}
      </p>
    </li>
  );
}
