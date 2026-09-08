import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BRIEF_FOOTER,
  NEVER_SAY,
  SAY_THIS,
  briefSlides,
  toRoman,
  type BriefSlide,
} from "@/lib/letterology/brief";
import { pigmentOf } from "@/lib/letterology/pigment";
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
      if (event.key === "f" || event.key === "F") {
        void fullScreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, last, tongue]);

  async function fullScreen() {
    const node = document.getElementById("brief-deck");
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen().catch(() => undefined);
  }

  return (
    <div id="brief-deck" className="space-y-6 bg-bg">
      <header className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{VOICE.briefTitle}</h1>
          <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-ink/85">{VOICE.briefLede}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <div
        id="brief-stage"
        className="relative overflow-hidden rounded-xl bg-raised px-6 py-10 shadow-[var(--shadow-border)] sm:px-12 sm:py-14"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary" />
        <SlideBody slide={slide} />
        <p className="mt-10 font-display text-xs tracking-[0.16em] text-muted uppercase">{BRIEF_FOOTER}</p>
      </div>

      {notes ? (
        <aside className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] print:hidden">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Speaker notes</p>
          <div className="mt-3 space-y-3">
            {slide.notes.map((note) => (
              <p key={note.slice(0, 32)} className="text-pretty leading-relaxed text-ink/90">
                {note}
              </p>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
          {toRoman(current + 1)} · {toRoman(slides.length)}
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.title}
              aria-current={i === current}
              onClick={() => go(i)}
              className={cn(
                "size-11 rounded-full sm:size-2.5",
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

      <p className="text-sm text-muted print:hidden">
        Arrow keys move the slides. Press N for notes, F for full screen.
      </p>

      <p className="flex flex-wrap gap-4 print:hidden">
        <Link
          to="/brain"
          search={{ tongue, a: undefined, n: undefined }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Letter-brained or number-brained
        </Link>
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
  if (slide.layout === "compare" && slide.left && slide.right) {
    return (
      <article className="space-y-8">
        <SlideHead slide={slide} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Column card={slide.left} tone="letter" />
          <Column card={slide.right} tone="number" />
        </div>
        {slide.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="max-w-3xl text-pretty text-lg leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </article>
    );
  }

  if (slide.layout === "path" && slide.path) {
    return (
      <article className="space-y-8">
        <SlideHead slide={slide} />
        <div className="grid gap-6 sm:grid-cols-3">
          {slide.path.map((mark) => (
            <div key={mark.letter} className="rounded-lg bg-surface px-4 py-5 shadow-[var(--shadow-border)]">
              <p
                className="font-display text-6xl leading-none sm:text-7xl"
                style={{ color: pigmentOf(mark.letter).css }}
              >
                {mark.letter}
              </p>
              <p className="mt-3 font-display text-xs tracking-[0.16em] text-muted uppercase">{mark.label}</p>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-ink/90">{mark.line}</p>
            </div>
          ))}
        </div>
        {slide.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="max-w-3xl text-pretty leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </article>
    );
  }

  if (slide.layout === "speech") {
    return (
      <article className="space-y-8">
        <SlideHead slide={slide} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Never say</p>
            <ul className="mt-3 space-y-3">
              {NEVER_SAY.map((line) => (
                <li key={line} className="border-l-2 border-ink/20 pl-3 leading-relaxed text-ink/80">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-xs tracking-[0.16em] text-primary uppercase">Say this</p>
            <ul className="mt-3 space-y-3">
              {SAY_THIS.map((line) => (
                <li key={line} className="border-l-2 border-primary/50 pl-3 leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {slide.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="max-w-3xl text-pretty leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </article>
    );
  }

  return (
    <article className={cn(slide.layout === "hero" ? "space-y-8 py-6" : "space-y-6")}>
      <SlideHead slide={slide} hero={slide.layout === "hero" || slide.layout === "close"} />
      {slide.paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 40)}
          className={cn(
            "max-w-3xl text-pretty leading-relaxed text-ink/90",
            slide.layout === "hero" || slide.layout === "close" ? "text-xl" : "text-lg",
          )}
        >
          {paragraph}
        </p>
      ))}
    </article>
  );
}

function SlideHead({ slide, hero = false }: { slide: BriefSlide; hero?: boolean }) {
  return (
    <header>
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{slide.kicker}</p>
      <h2
        className={cn(
          "mt-2 text-balance font-display leading-tight text-ink",
          hero ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl",
        )}
      >
        {slide.title}
      </h2>
      {slide.lede ? (
        <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-ink/85">{slide.lede}</p>
      ) : null}
    </header>
  );
}

function Column({ card, tone }: { card: NonNullable<BriefSlide["left"]>; tone: "letter" | "number" }) {
  return (
    <div
      className={cn(
        "rounded-lg px-5 py-6 shadow-[var(--shadow-border)]",
        tone === "letter" ? "bg-primary text-primary-fg" : "bg-surface text-ink",
      )}
    >
      <p
        className={cn(
          "font-display text-xs tracking-[0.16em] uppercase",
          tone === "letter" ? "text-primary-fg/70" : "text-muted",
        )}
      >
        {card.kicker}
      </p>
      <h3 className="mt-2 font-display text-2xl">{card.title}</h3>
      <p className={cn("mt-4 text-pretty leading-relaxed", tone === "letter" ? "text-primary-fg/90" : "text-ink/90")}>
        {card.body}
      </p>
    </div>
  );
}
