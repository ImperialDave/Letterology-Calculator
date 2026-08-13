import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { themeOf } from "@/lib/letterology/lexicon";
import { ALPHABET, type Letter, VOWEL_LETTERS } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";

type Search = { letter?: string };

export const Route = createFileRoute("/atlas")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.letter === "string" ? search.letter.toUpperCase() : "A";
    const letter = ALPHABET.includes(raw) ? raw : "A";
    return { letter };
  },
  component: AtlasPage,
});

function AtlasPage() {
  const { letter } = Route.useSearch();
  const navigate = useNavigate({ from: "/atlas" });
  const selected = (letter ?? "A") as Letter;

  return (
    <div className="min-h-dvh">
      <SiteHeader current="atlas" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">The twenty-six fields</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Letter Atlas</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            Each letter is a field of meaning and a house of the psyche. The fields
            come from the conceptual neighborhood of words that begin with the letter.
            The houses are the old figures — Pearson, Jung, Tarot, hermetic and
            contemplative work — through which that field becomes a life. Vowels tend
            to speak of inner orientation; consonants of outer expression.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-7">
          {ALPHABET.map((item) => {
            const active = item === selected;
            const isVowel = VOWEL_LETTERS.has(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => navigate({ search: { letter: item } })}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md font-display text-lg transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
                  active
                    ? "bg-primary text-primary-fg"
                    : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                )}
                aria-pressed={active}
                aria-label={`${item} — ${themeOf(item).name}${isVowel ? ", vowel" : ""}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <LetterDetail letter={selected} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
