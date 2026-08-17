import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HouseCircle } from "@/components/letterology/HouseCircle";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { AppShell } from "@/components/SiteChrome";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { Sheet } from "@/components/ui/sheet";
import { pageCardMeta } from "@/lib/letterology/share";
import { parseTongue } from "@/lib/letterology/tongue";
import type { Letter } from "@/lib/letterology/types";
import { markOf } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import type { Stoich } from "@/lib/stoicheia/letters";

type Search = { tongue?: "el" };

export const Route = createFileRoute("/letters")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Letters",
      description: "One wheel. Tap a letter.",
      path: "/letters",
      imagePath: "/og.jpg",
    }),
  component: LettersPage,
});

function LettersPage() {
  const { tongue: raw } = Route.useSearch();
  const tongue = parseTongue(raw);
  const [latin, setLatin] = useState<Letter>("A");
  const [greek, setGreek] = useState<Stoich | null>(null);
  const book = greek ? portraitOf(greek) : null;

  return (
    <AppShell current="letters" wide>
      <header className="text-center">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{tongue === "el" ? "Hours" : "Letters"}</h1>
        <p className="mt-2 text-sm text-muted">Tap a seat.</p>
      </header>
      <div className="mt-8">
        {tongue === "el" ? (
          <NightWheel onSelect={setGreek} />
        ) : (
          <HouseCircle selected={latin} onSelect={setLatin} />
        )}
      </div>
      {tongue === "la" ? (
        <div className="mt-10">
          <LetterDetail letter={latin} />
        </div>
      ) : null}
      {tongue === "el" && greek ? (
        <p className="mt-6 text-center">
          <Link
            to="/letters/$mark"
            params={{ mark: markOf(greek) }}
            search={{ tongue: "el" }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Open {greek}
          </Link>
        </p>
      ) : null}
      <Sheet open={Boolean(book)} onClose={() => setGreek(null)} title={book?.book.spoken}>
        {book ? <LetterBookView portrait={book} /> : null}
      </Sheet>
    </AppShell>
  );
}
