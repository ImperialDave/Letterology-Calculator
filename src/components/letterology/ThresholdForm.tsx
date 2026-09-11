import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  THRESHOLD_ITEMS,
  THRESHOLD_SCALE_MAX,
  THRESHOLD_SCALE_MIN,
  THRESHOLD_SECTIONS,
  presentScaleDeck,
  type ThresholdItem,
  type ThresholdSectionId,
} from "@/lib/letterology/threshold";
import { submitThresholdSitting } from "@/lib/letterology/threshold-functions";
import { VOICE } from "@/lib/letterology/voice";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "cc33.threshold.draft.v1";
const STEPS: ThresholdSectionId[] = ["handle", "stay", "hand", "houses", "scale", "scenes"];

type Draft = {
  id: string;
  seed: number;
  step: number;
  handle: string;
  house: string;
  hours: string;
  written: Record<string, string>;
  scales: Record<string, number>;
  scenes: Record<string, string>;
};

function newId(): string {
  return crypto.randomUUID();
}

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (typeof parsed.id !== "string" || typeof parsed.seed !== "number") return null;
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

function itemsIn(section: ThresholdSectionId, scaleDeck: ThresholdItem[]): ThresholdItem[] {
  if (section === "scale") return scaleDeck;
  return THRESHOLD_ITEMS.filter((item) => item.section === section);
}

function canLeaveSection(section: ThresholdSectionId, draft: Draft): boolean {
  if (section === "handle") return Boolean(draft.handle.trim());
  return true;
}

export function ThresholdForm() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleDeck = useMemo(() => (draft ? presentScaleDeck(draft.seed) : []), [draft]);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setDraft(saved);
      return;
    }
    setDraft({
      id: newId(),
      seed: Math.floor(Math.random() * 0xffffffff) >>> 0,
      step: 0,
      handle: "",
      house: "",
      hours: "",
      written: {},
      scales: {},
      scenes: {},
    });
  }, []);

  useEffect(() => {
    if (!draft || done) return;
    saveDraft(draft);
  }, [draft, done]);

  if (!draft) {
    return <p className="font-display text-sm tracking-[0.16em] text-muted uppercase">Opening the threshold</p>;
  }

  if (done) {
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · Threshold</p>
        <h1 className="font-display text-4xl text-ink">{VOICE.thresholdTitle}</h1>
        <p className="leading-relaxed text-ink/90">{VOICE.thresholdThanks}</p>
      </section>
    );
  }

  const sectionId = STEPS[draft.step] ?? "handle";
  const section = THRESHOLD_SECTIONS.find((row) => row.id === sectionId)!;
  const items = itemsIn(sectionId, scaleDeck);
  const canAdvance = canLeaveSection(sectionId, draft);
  const last = draft.step >= STEPS.length - 1;

  function patch(partial: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function setWritten(id: string, value: string) {
    setDraft((current) => (current ? { ...current, written: { ...current.written, [id]: value } } : current));
  }

  function setScale(id: string, value: number) {
    setDraft((current) => (current ? { ...current, scales: { ...current.scales, [id]: value } } : current));
  }

  function setScene(id: string, value: string) {
    setDraft((current) => (current ? { ...current, scenes: { ...current.scenes, [id]: value } } : current));
  }

  async function finish() {
    if (!draft || saving || !canAdvance || !draft.handle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await submitThresholdSitting({
        data: {
          id: draft.id,
          handle: draft.handle,
          house: draft.house,
          hours: draft.hours,
          written: draft.written,
          scales: draft.scales,
          scenes: draft.scenes,
        },
      });
      clearDraft();
      setDone(true);
    } catch {
      setError("The sitting could not be kept. Try once more.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-4">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">Letterology.club · Threshold Reading</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.thresholdTitle}</h1>
        <p className="leading-relaxed text-ink/90">{VOICE.thresholdLede}</p>
      </header>

      {draft.step === 0 ? (
        <section className="space-y-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div>
            <Label htmlFor="threshold-handle">Handle you actually use</Label>
            <Input
              id="threshold-handle"
              className="mt-2"
              value={draft.handle}
              onChange={(event) => patch({ handle: event.target.value })}
              placeholder="@lovelace"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <div>
            <Label htmlFor="threshold-house">House of first letter, if you know it</Label>
            <Input
              id="threshold-house"
              className="mt-2"
              value={draft.house}
              onChange={(event) => patch({ house: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="threshold-hours">How many hours a week you can keep</Label>
            <Input
              id="threshold-hours"
              className="mt-2"
              value={draft.hours}
              onChange={(event) => patch({ hours: event.target.value })}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
          {draft.step + 1} of {STEPS.length}
        </p>
        <h2 className="font-display text-2xl text-ink">{section.title}</h2>
        <p className="leading-relaxed text-muted">{section.lede}</p>
        <p className="text-sm leading-relaxed text-muted">Leave a line blank if you have nothing honest to put there.</p>
        {items.map((item) => (
          <ItemField
            key={item.id}
            item={item}
            written={draft.written[item.id] ?? ""}
            scale={draft.scales[item.id]}
            scene={draft.scenes[item.id] ?? ""}
            onWritten={(value) => setWritten(item.id, value)}
            onScale={(value) => setScale(item.id, value)}
            onScene={(value) => setScene(item.id, value)}
          />
        ))}
      </section>

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={draft.step === 0}
          onClick={() => patch({ step: Math.max(0, draft.step - 1) })}
        >
          Back
        </Button>
        {last ? (
          <Button type="button" disabled={!canAdvance || saving} onClick={() => void finish()}>
            Send the sitting
          </Button>
        ) : (
          <Button type="button" disabled={!canAdvance} onClick={() => patch({ step: draft.step + 1 })}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemField({
  item,
  written,
  scale,
  scene,
  onWritten,
  onScale,
  onScene,
}: {
  item: ThresholdItem;
  written: string;
  scale?: number;
  scene: string;
  onWritten: (value: string) => void;
  onScale: (value: number) => void;
  onScene: (value: string) => void;
}) {
  return (
    <article className="space-y-3 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">{item.n}</p>
      <p className="font-display text-lg leading-snug text-ink">{item.prompt}</p>
      {item.kind === "choice" && item.options ? (
        <div className="flex flex-wrap gap-2">
          {item.options.map((option) => {
            const selected = written.startsWith(option);
            return (
              <Button
                key={option}
                type="button"
                variant={selected ? "default" : "outline"}
                onClick={() => {
                  const rest = written.includes("\n") ? written.slice(written.indexOf("\n")).trim() : "";
                  onWritten(rest ? `${option}\n${rest}` : option);
                }}
              >
                {option}
              </Button>
            );
          })}
        </div>
      ) : null}
      {item.kind === "scale" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">One is almost never. Five is almost always.</p>
          <div className="flex gap-2">
            {Array.from({ length: THRESHOLD_SCALE_MAX - THRESHOLD_SCALE_MIN + 1 }, (_, index) => {
              const value = index + THRESHOLD_SCALE_MIN;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value}`}
                  onClick={() => onScale(value)}
                  className={cn(
                    "size-11 rounded-full shadow-[var(--shadow-border)]",
                    scale === value ? "bg-primary text-primary-fg" : "bg-bg text-ink hover:bg-surface",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <textarea
          className="min-h-28 w-full rounded-md bg-bg px-3 py-2 text-ink shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          value={item.kind === "scene" ? scene : written}
          onChange={(event) => (item.kind === "scene" ? onScene(event.target.value) : onWritten(event.target.value))}
        />
      )}
    </article>
  );
}
