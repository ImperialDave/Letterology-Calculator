import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { BrainLanding, BrainQuiz } from "@/components/letterology/BrainQuiz";
import { BrainResult } from "@/components/letterology/BrainResult";
import { useTongue } from "@/components/letterology/TongueProvider";
import { brainCardFile, brainPath, decodeAnswers, readBrain } from "@/lib/letterology/brain";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el"; a?: string; n?: string };

export const Route = createFileRoute("/brain")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
    a: typeof search.a === "string" ? search.a : undefined,
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  loader: ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    const a = params.get("a") ?? undefined;
    const n = params.get("n") ?? undefined;
    const answers = decodeAnswers(a);
    const reading = answers ? readBrain(answers, n ?? undefined) : null;
    return { reading };
  },
  head: ({ loaderData }) => {
    const reading = loaderData?.reading;
    if (!reading) {
      return pageCardMeta({
        title: VOICE.brainTitle,
        description: VOICE.brainLede,
        path: "/brain",
        imagePath: "/og.jpg",
      });
    }
    return pageCardMeta({
      title: reading.title,
      description: reading.headline,
      path: brainPath(reading.token, reading.guest ? undefined : reading.name),
      imagePath: `/og/${brainCardFile(reading.token)}`,
    });
  },
  component: BrainPage,
});

function BrainPage() {
  const search = Route.useSearch();
  const loaded = Route.useLoaderData();
  const tongue = useTongue(search.tongue);
  const reading = loaded.reading ?? (decodeAnswers(search.a) ? readBrain(decodeAnswers(search.a)!, search.n) : null);
  const [started, setStarted] = useState(Boolean(reading));

  if (reading) {
    return (
      <AppShell current="brain">
        <BrainResult reading={reading} tongue={tongue} />
      </AppShell>
    );
  }

  return (
    <AppShell current="brain">
      {started ? <BrainQuiz tongue={tongue} /> : <BrainLanding onStart={() => setStarted(true)} />}
    </AppShell>
  );
}
