import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BRAIN_ITEM_COUNT,
  SCALE_LABELS,
  answersFromDeck,
  displayPoles,
  encodeAnswers,
  presentDeck,
  type BrainChoice,
  type PresentedItem,
} from "@/lib/letterology/brain";
import { VOICE } from "@/lib/letterology/voice";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "cc33.brain.draft.v3";

type Draft = {
  seed: number;
  step: number;
  answers: Array<BrainChoice | null>;
  name: string;
};

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (typeof parsed.seed !== "number") return null;
    if (!Array.isArray(parsed.answers) || parsed.answers.length !== BRAIN_ITEM_COUNT) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // private mode
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // private mode
  }
}

export function BrainQuiz({ tongue }: { tongue: "la" | "el" }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<BrainChoice | undefined>>(
    Array.from({ length: BRAIN_ITEM_COUNT }, () => undefined),
  );
  const [name, setName] = useState("");
  const navigate = useNavigate({ from: "/brain" });
  const deck = useMemo<PresentedItem[]>(() => (seed == null ? [] : presentDeck(seed)), [seed]);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setSeed(saved.seed);
      setStep(Math.min(saved.step, BRAIN_ITEM_COUNT));
      setAnswers(saved.answers.map((value) => (value == null ? undefined : value)));
      setName(saved.name ?? "");
      return;
    }
    setSeed(randomSeed());
  }, []);

  useEffect(() => {
    if (seed == null) return;
    saveDraft({
      seed,
      step,
      answers: answers.map((value) => value ?? null),
      name,
    });
  }, [seed, step, answers, name]);

  const askingName = step >= BRAIN_ITEM_COUNT;
  const presented = deck[step];

  function choose(choice: BrainChoice) {
    const next = [...answers];
    next[step] = choice;
    setAnswers(next);
    window.setTimeout(() => setStep((current) => Math.min(BRAIN_ITEM_COUNT, current + 1)), 160);
  }

  function finish() {
    const filled = answers.every((value) => value != null);
    if (!filled || deck.length !== BRAIN_ITEM_COUNT) return;
    const canonical = answersFromDeck(deck, answers as BrainChoice[]);
    clearDraft();
    void navigate({
      search: {
        a: encodeAnswers(canonical),
        n: name.trim() || undefined,
        tongue,
      },
    });
  }

  if (seed == null || deck.length === 0) {
    return (
      <section className="mx-auto max-w-xl">
        <p className="font-display text-sm tracking-[0.16em] text-muted uppercase">Shuffling the seats</p>
      </section>
    );
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

  if (!presented) return null;
  const poles = displayPoles(presented.item, presented.flip);

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
      <h2 className="font-display text-2xl leading-snug text-ink sm:text-3xl">{presented.item.prompt}</h2>
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
        {SCALE_LABELS[0]} on the left. {SCALE_LABELS[4]} on the right. The middle is both. The sides
        switch, so do not assume the left-hand line is the kinder one.
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
        There are fifty situations. For each one, choose how close you sit to the left-hand
        description or the right-hand one. Both sides are working styles. The two sides switch places
        from question to question, so the nicer-sounding line cannot sit still on the left. Choose the
        one that is more like you, not the one that sounds kinder.
      </p>
      <p className="leading-relaxed text-ink/90">
        When you finish, you will get a letter grade from A+ to F for how you look, plus a map of five
        seats and ten aspects in our language, and a certificate you can share or print. A+ is a
        perfect Letter brain. F is a person led by numbers. The seats can disagree with the grade.
        That is the point.
      </p>
      <Button type="button" onClick={onStart}>
        Begin
      </Button>
      <p className="text-sm text-muted">No account is required. The answers stay in the link. You can go back.</p>
    </section>
  );
}
