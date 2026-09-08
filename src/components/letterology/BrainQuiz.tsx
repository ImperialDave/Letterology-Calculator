import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BRAIN_ITEM_COUNT,
  SCALE_LABELS,
  encodeAnswers,
  orderedItems,
  polesOf,
  type BrainChoice,
} from "@/lib/letterology/brain";
import { VOICE } from "@/lib/letterology/voice";
import { cn } from "@/lib/utils";

export function BrainQuiz({ tongue }: { tongue: "la" | "el" }) {
  const items = useMemo(() => orderedItems(), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<BrainChoice | undefined>>(
    Array.from({ length: BRAIN_ITEM_COUNT }, () => undefined),
  );
  const [name, setName] = useState("");
  const navigate = useNavigate({ from: "/brain" });
  const askingName = step >= BRAIN_ITEM_COUNT;
  const item = items[step];

  function choose(choice: BrainChoice) {
    const next = [...answers];
    next[step] = choice;
    setAnswers(next);
    window.setTimeout(() => setStep((current) => Math.min(BRAIN_ITEM_COUNT, current + 1)), 160);
  }

  function finish() {
    const filled = answers.every((value) => value != null);
    if (!filled) return;
    void navigate({
      search: {
        a: encodeAnswers(answers as BrainChoice[]),
        n: name.trim() || undefined,
        tongue,
      },
    });
  }

  if (askingName) {
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Last step</p>
        <h2 className="font-display text-3xl text-ink">A name for the certificate</h2>
        <p className="leading-relaxed text-ink/90">
          If you want the certificate to use the username you actually walk around in, type it here. If
          you skip this, we will write “A guest of CC33.”
        </p>
        <div>
          <Label htmlFor="brain-name">Username</Label>
          <Input
            id="brain-name"
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="@lovelace"
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="username"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={finish}>
            See the portrait
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep(BRAIN_ITEM_COUNT - 1)}>
            Back
          </Button>
        </div>
      </section>
    );
  }

  if (!item) return null;
  const poles = polesOf(item);

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
        {step + 1} of {BRAIN_ITEM_COUNT}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${((step + 1) / BRAIN_ITEM_COUNT) * 100}%` }}
        />
      </div>
      <h2 className="font-display text-2xl leading-snug text-ink sm:text-3xl">{item.prompt}</h2>
      <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <p className="text-sm leading-relaxed text-ink/90">{poles.left}</p>
        <div className="flex justify-center gap-2">
          {SCALE_LABELS.map((label, index) => {
            const choice = index as BrainChoice;
            const selected = answers[step] === choice;
            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => choose(choice)}
                className={cn(
                  "size-11 rounded-full shadow-[var(--shadow-border)] sm:size-12",
                  selected ? "bg-primary text-primary-fg" : "bg-raised text-ink hover:bg-surface",
                )}
              >
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm leading-relaxed text-ink/90 sm:text-right">{poles.right}</p>
      </div>
      <p className="text-center text-xs text-muted">
        {SCALE_LABELS[0]} on the left. {SCALE_LABELS[4]} on the right. The middle is both.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Back
        </Button>
      </div>
    </section>
  );
}

export function BrainLanding({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.brainTitle}</h1>
      <p className="leading-relaxed text-ink/90">{VOICE.brainLede}</p>
      <p className="leading-relaxed text-ink/90">
        There are twenty-five situations. For each one, choose how close you sit to the left-hand
        description or the right-hand one. When you finish, you will get a leaning, five traits in our
        language, and a certificate you can share or print. Counting is useful. Treating the count as
        the person is the mistake.
      </p>
      <Button type="button" onClick={onStart}>
        Begin
      </Button>
      <p className="text-sm text-muted">No account is required. The answers stay in the link.</p>
    </section>
  );
}
