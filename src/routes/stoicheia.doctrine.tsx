import { createFileRoute } from "@tanstack/react-router";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { STOICHEIA_DOCTRINE } from "@/lib/stoicheia/doctrine";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/stoicheia/doctrine")({
  head: () =>
    pageCardMeta({
      title: "Stoicheia doctrine",
      description: "Why this is not Letterology. Twenty-four, hymn, axis, Milesian count, xenia.",
      path: "/stoicheia/doctrine",
      imagePath: "/og.jpg",
    }),
  component: StoicheiaDoctrinePage,
});

function StoicheiaDoctrinePage() {
  return (
    <StoicheiaFrame current="Why">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · second tongue</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Why this tongue</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Twenty-four letters. First and last, not a triad. Vowels in order, not by weight.
          A total that was already a spelling. Guest-friendship, not a score. Sunset and the
          moon, not the twenty-first of March.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          The Latin Doctrine remains. This page is only the argument that Stoicheia is not
          a costume for it.
        </p>
      </header>
      <div className="mt-10 space-y-10">
        {STOICHEIA_DOCTRINE.map((section) => (
          <article key={section.title} className="border-t border-ink/10 pt-8">
            <h2 className="font-display text-2xl text-ink">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 max-w-3xl leading-[1.7] text-ink/90">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </StoicheiaFrame>
  );
}
