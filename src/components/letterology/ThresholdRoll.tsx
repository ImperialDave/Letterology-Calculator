import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { downloadThresholdAnswersCsv, downloadThresholdCsv, loadThresholdSitting } from "@/lib/letterology/threshold-functions";
import {
  AXIS_LISTEN,
  AXIS_NAME,
  SCENE_ITEMS,
  SCALE_ITEMS,
  SECTION_LISTEN,
  THRESHOLD_ITEMS,
  THRESHOLD_SECTIONS,
  WRITTEN_ITEMS,
  type ThresholdAxisId,
  type ThresholdRecord,
} from "@/lib/letterology/threshold";
import { VOICE } from "@/lib/letterology/voice";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export type ThresholdRollRow = {
  id: string;
  createdAt: string;
  handle: string;
  house: string;
  hours: string;
  axes: ThresholdRecord["axes"];
};

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

export function ThresholdRollList({ sittings }: { sittings: ThresholdRollRow[] }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Threshold readings</h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Membership screen at /threshold. Not a portrait. Axes are from the scale items only. Written answers stay
            off the certificate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void downloadThresholdCsv().then((file) => download(file.filename, file.csv))}
          >
            Download threshold
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void downloadThresholdAnswersCsv().then((file) => download(file.filename, file.csv))}
          >
            Download answers
          </Button>
        </div>
      </div>
      {sittings.length === 0 ? (
        <p className="leading-relaxed text-muted">{VOICE.thresholdEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {sittings.map((row) => (
            <li key={row.id} className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{when(row.createdAt)}</p>
                  <p className="mt-1 font-display text-xl text-ink">{row.handle}</p>
                  <p className="text-sm text-muted">
                    {row.house || "House unnamed"} · {row.hours || "Hours unnamed"}
                  </p>
                </div>
                <p className="font-display text-sm tracking-[0.12em] text-primary uppercase">
                  Stay {row.axes.stay} · Hand {row.axes.hand} · Room {row.axes.room} · Method {row.axes.method}
                </p>
              </div>
              {row.axes.poorDiscretion || row.axes.ornamental ? (
                <p className="mt-3 text-sm text-primary">
                  {row.axes.poorDiscretion ? "Poor discretion on the scale. " : null}
                  {row.axes.ornamental ? "Ornamental: enthusiasm without the unglamorous third." : null}
                </p>
              ) : null}
              <Link
                to="/brain/roll/threshold/$id"
                params={{ id: row.id }}
                className="mt-3 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
              >
                Open reading
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function gateFromError(err: unknown): "auth" | "forbidden" | "error" {
  const message = err instanceof Error ? err.message : String(err);
  if (/unauthorized/i.test(message)) return "auth";
  if (/forbidden/i.test(message)) return "forbidden";
  return "error";
}

export function ThresholdRollDetail({ id }: { id: string }) {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "auth" }
    | { status: "forbidden" }
    | { status: "missing" }
    | { status: "error" }
    | { status: "ready"; record: ThresholdRecord }
  >({ status: "loading" });

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setState({ status: "auth" });
      return;
    }
    let cancelled = false;
    void loadThresholdSitting({ data: id })
      .then((record) => {
        if (cancelled) return;
        if (!record) setState({ status: "missing" });
        else setState({ status: "ready", record });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: gateFromError(err) === "forbidden" ? "forbidden" : gateFromError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, isPending, user]);

  if (isPending || state.status === "loading") {
    return <p className="font-display text-sm tracking-[0.16em] text-muted uppercase">Opening the sitting</p>;
  }
  if (state.status === "auth") return <Navigate to="/login" search={{ next: "/brain/roll" }} />;
  if (state.status === "forbidden") {
    return <p className="leading-relaxed text-ink/90">{VOICE.rollRefusal}</p>;
  }
  if (state.status !== "ready") {
    return (
      <section className="space-y-4">
        <h1 className="font-display text-4xl text-ink">Sitting gone</h1>
        <Link
          to="/brain/roll"
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Back to the roll
        </Link>
      </section>
    );
  }

  const { record } = state;
  const axes = (Object.keys(AXIS_NAME) as ThresholdAxisId[]).map((id) => ({
    id,
    name: AXIS_NAME[id],
    value: record.axes[id],
    listen: AXIS_LISTEN[id],
  }));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · Threshold</p>
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{when(record.createdAt)}</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{record.handle}</h1>
        <p className="text-muted">
          {record.house || "House unnamed"} · {record.hours || "Hours unnamed"}
        </p>
        <Link
          to="/brain/roll"
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Back to the roll
        </Link>
      </header>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-2xl text-ink">What to listen for</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          These notes are for the court. The person who sat the threshold does not see them.
        </p>
        <ul className="mt-5 space-y-4">
          {THRESHOLD_SECTIONS.map((row) => (
            <li key={row.id}>
              <p className="font-display text-lg text-ink">{row.title}</p>
              <p className="mt-1 leading-relaxed text-ink/90">{SECTION_LISTEN[row.id]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-2xl text-ink">Four axes</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          From the scale items only. Written answers are below. A useful member can be skeptical. Intensity without
          craft is the poor fit.
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {axes.map((row) => (
            <li key={row.id}>
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{row.name}</p>
              <p className="mt-1 font-display text-3xl text-primary">{row.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/90">{row.listen.good}</p>
              <p className="text-sm leading-relaxed text-muted">{row.listen.poor}</p>
            </li>
          ))}
        </ul>
        {record.axes.poorDiscretion ? (
          <p className="mt-4 text-sm text-primary">Poor discretion: low on keeping handles private and asking before a reading.</p>
        ) : null}
        {record.axes.ornamental ? (
          <p className="mt-2 text-sm text-primary">Ornamental: low on finishing, boredom, and naming a broken promise early.</p>
        ) : null}
      </section>

      <AnswerList title="Written" items={WRITTEN_ITEMS} values={record.written} />
      <AnswerList
        title="Scale"
        items={SCALE_ITEMS}
        values={Object.fromEntries(SCALE_ITEMS.map((item) => [item.id, String(record.scales[item.id] ?? "")]))}
      />
      <AnswerList title="Scenes" items={SCENE_ITEMS} values={record.scenes} />
      <p className="text-sm text-muted">{THRESHOLD_ITEMS.length} items. None of this is on the portrait certificate.</p>
    </div>
  );
}

function AnswerList({
  title,
  items,
  values,
}: {
  title: string;
  items: typeof THRESHOLD_ITEMS;
  values: Record<string, string>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
            <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">{item.n}</p>
            <p className="mt-1 font-display text-lg text-ink">{item.prompt}</p>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink/90">{values[item.id] || "—"}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
