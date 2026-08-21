import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ask, tweetAsk, type AskReading, type AskVerdict } from "@/lib/letterology/ask";
import { copyToClipboard } from "@/lib/letterology/clipboard";
import { VOICE } from "@/lib/letterology/voice";
import { cn } from "@/lib/utils";

const VERDICT_MARK: Record<AskVerdict, string> = {
  yea: "Yes",
  lean: "Yes, small",
  hold: "Not today",
  nay: "No",
};

const GATE_LABEL: Record<string, string> = {
  same: "same",
  ally: "ally",
  enemy: "against",
  none: "foreign",
  favorable: "warm",
  contrary: "withdrawn",
  quiet: "quiet",
};

export function AskView({
  initialHandle = "",
  initialQuestion = "",
  lockHandle = false,
  onRun,
}: {
  initialHandle?: string;
  initialQuestion?: string;
  lockHandle?: boolean;
  onRun?: (handle: string, question: string) => void;
}) {
  const [handle, setHandle] = useState(initialHandle);
  const [question, setQuestion] = useState(initialQuestion);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHandle(initialHandle);
  }, [initialHandle]);
  useEffect(() => {
    setQuestion(initialQuestion);
  }, [initialQuestion]);

  const reading = useMemo(() => {
    if (!handle.trim() || !question.trim()) return null;
    return ask(handle, question);
  }, [handle, question]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const n = handle.trim();
    const q = question.trim();
    if (!n || !q) return;
    onRun?.(n, q);
  }

  async function copy() {
    if (!reading) return;
    if (await copyToClipboard(tweetAsk(reading))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <section className="space-y-6">
      {!lockHandle ? (
        <header>
          <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">CC33 · Ask</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Ask the letters</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">{VOICE.askLede}</p>
        </header>
      ) : (
        <header>
          <h2 className="font-display text-2xl text-ink">Ask</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{VOICE.askHint}</p>
        </header>
      )}

      <form onSubmit={submit} className="grid gap-3">
        {lockHandle ? null : (
          <div>
            <Label htmlFor="ask-handle">Username</Label>
            <Input
              id="ask-handle"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@lovelace"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="username"
              className="mt-2"
            />
          </div>
        )}
        <div>
          <Label htmlFor="ask-question">Question</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="ask-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Should I ship it, or wait?"
              autoCapitalize="none"
            />
            <Button type="submit" className="h-12 shrink-0 px-6">
              Ask
            </Button>
          </div>
        </div>
      </form>

      {handle.trim() && question.trim() && !reading ? (
        <p className="text-sm text-primary">We need letters in both the username and the question.</p>
      ) : null}

      {reading ? <AskCard reading={reading} copied={copied} onCopy={() => void copy()} /> : null}
    </section>
  );
}

function AskCard({
  reading,
  copied,
  onCopy,
}: {
  reading: AskReading;
  copied: boolean;
  onCopy: () => void;
}) {
  const hot = reading.verdict === "yea" || reading.verdict === "lean";
  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
        {reading.path.join("")} · luck {reading.luckScore} {reading.luckVerdict} · ask {reading.score}
      </p>
      <p className={cn("mt-3 font-display text-3xl sm:text-4xl", hot ? "text-primary" : "text-ink")}>
        {VERDICT_MARK[reading.verdict]}
      </p>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink">{reading.answer}</p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">{reading.why}</p>
      <p className="mt-4 max-w-2xl font-semibold text-ink">{reading.charge}</p>
      <p className="mt-2 max-w-2xl text-sm text-muted">{reading.ask}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Gate k="Role" v={GATE_LABEL[reading.gates.role] ?? reading.gates.role} />
        <Gate k="How" v={GATE_LABEL[reading.gates.method] ?? reading.gates.method} />
        <Gate k="Where" v={GATE_LABEL[reading.gates.place] ?? reading.gates.place} />
        <Gate k="Today" v={GATE_LABEL[reading.gates.court] ?? reading.gates.court} />
      </dl>
      <p className="mt-3 font-display text-xs tracking-[0.12em] text-muted uppercase">
        Question {reading.queryPath.join("")} · {reading.queryNoun} · {reading.mood}
        {reading.fork
          ? ` · ${reading.fork.a.matter} ${reading.fork.a.score} / ${reading.fork.b.matter} ${reading.fork.b.score}`
          : ""}
      </p>

      <div className="mt-5 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onCopy}
          className="font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <Link
          to="/"
          search={{ n: reading.handle, name: undefined, tongue: "la" }}
          className="font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Full reading
        </Link>
      </div>
    </article>
  );
}

function Gate({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t border-ink/10 pt-2">
      <dt className="font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase">{k}</dt>
      <dd className="mt-1 font-display text-ink">{v}</dd>
    </div>
  );
}
