import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HouseCircle } from "@/components/letterology/HouseCircle";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { TongueStage } from "@/components/letterology/TongueStage";
import { AppShell } from "@/components/SiteChrome";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { pageCardMeta } from "@/lib/letterology/share";
import { useTongue } from "@/components/letterology/TongueProvider";
import { VOICE } from "@/lib/letterology/voice";
import type { Letter } from "@/lib/letterology/types";
import { markOf } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import type { Stoich } from "@/lib/stoicheia/letters";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/letters")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
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
  const tongue = useTongue(raw);
  const [latin, setLatin] = useState<Letter>("A");
  const [greek, setGreek] = useState<Stoich>("Α");
  const book = portraitOf(greek);

  return (
    <AppShell current="letters" wide>
      <header className="text-center">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{tongue === "el" ? "Hours" : "Letters"}</h1>
        <p className="mt-2 text-sm text-muted">
          {tongue === "el" ? VOICE.lettersGreekLede : VOICE.lettersLatinLede}
        </p>
      </header>
      <div className="mt-8">
        <TongueStage
          tongue={tongue}
          latin={
            <div>
              <HouseCircle selected={latin} onSelect={setLatin} />
              <div className="mt-10">
                <LetterDetail letter={latin} />
              </div>
            </div>
          }
          greek={
            <div>
              <NightWheel onSelect={setGreek} />
              <p className="mt-6 text-center">
                <Link
                  to="/letters/$mark"
                  params={{ mark: markOf(greek) }}
                  search={{ tongue: "el" }}
                  className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                >
                  Open {book.book.spoken}
                </Link>
              </p>
              <div className="mt-8">
                <LetterBookView portrait={book} />
              </div>
            </div>
          }
        />
      </div>
    </AppShell>
  );
}
