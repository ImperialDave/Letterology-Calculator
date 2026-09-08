import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BRIEF_FOOTER, briefSlides, type BriefSlide } from "@/lib/letterology/brief";
import { VOICE } from "@/lib/letterology/voice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BriefDeck({
  index,
  tongue,
}: {
  index: number;
  tongue: "la" | "el";
}) {
  const slides = briefSlides();
  const last = slides.length - 1;
  const current = Math.min(last, Math.max(0, index));
  const slide = slides[current] ?? slides[0];
  const [notes, setNotes] = useState(false);
  const navigate = useNavigate({ from: "/brief" });

  function go(next: number) {
    const clamped = Math.min(last, Math.max(0, next));
    void navigate({
      search: { tongue, s: clamped === 0 ? undefined : clamped },
      replace: true,
      resetScroll: false,
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(current + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(current - 1);
      }
      if (event.key === "n" || event.key === "N") {
        setNotes((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, last, tongue]);

  async function fullScreen() {
    const node = document.getElementById("brief-stage");
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen().catch(() => undefined);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.briefTitle}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/85">{VOICE.briefLede}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" type="button" onClick={() => setNotes((open) => !open)}>
            {VOICE.briefNotes}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => void fullScreen()}>
            {VOICE.briefFullscreen}
          </Button>
          <a
            href="/brief.pptx"
            className="inline-flex h-9 items-center rounded-sm bg-raised px-3 font-display text-xs text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
          >
            {VOICE.briefDownload}
          </a>
        </div>
      </header>

      <div id="brief-stage" className="rounded-xl bg-raised p-6 shadow-[var(--shadow-border)] sm:p-10">
        <SlideBody slide={slide} />
        <p className="mt-8 font-display text-xs tracking-[0.16em] text-muted uppercase">{BRIEF_FOOTER}</p>
      </div>

      {notes ? (
        <aside className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Speaker notes</p>
          <div className="mt-3 space-y-2">
            {slide.notes.map((note) => (
              <p key={note.slice(0, 32)} className="leading-relaxed text-ink/90">
                {note}
              </p>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">
          {current + 1} of {slides.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Slide ${i + 1}: ${item.title}`}
              aria-current={i === current}
              onClick={() => go(i)}
              className={cn(
                "size-11 rounded-full sm:size-3",
                i === current ? "bg-primary" : "bg-ink/20 hover:bg-ink/40",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" disabled={current === 0} onClick={() => go(current - 1)}>
            {VOICE.briefPrev}
          </Button>
          <Button type="button" disabled={current === last} onClick={() => go(current + 1)}>
            {VOICE.briefNext}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted">
        Arrow keys move the slides. Press N for notes.
      </p>

      <p className="flex flex-wrap gap-4">
        <Link
          to="/why"
          search={{ tongue }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Why
        </Link>
        <Link
          to="/sheet"
          search={{ tongue }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Cheat sheet
        </Link>
      </p>
    </div>
  );
}

function SlideBody({ slide }: { slide: BriefSlide }) {
  return (
    <article className="min-h-[18rem]">
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{slide.kicker}</p>
      <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{slide.title}</h2>
      <div className="mt-6 space-y-3">
        {slide.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="max-w-2xl text-lg leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
