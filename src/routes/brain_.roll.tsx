import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { BrainRoll } from "@/components/letterology/BrainRoll";
import { useTongue } from "@/components/letterology/TongueProvider";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/brain_/roll")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: VOICE.rollTitle,
      description: VOICE.rollLede,
      path: "/brain/roll",
      imagePath: "/og.jpg",
    }),
  component: BrainRollPage,
});

function BrainRollPage() {
  const search = Route.useSearch();
  const tongue = useTongue(search.tongue);
  return (
    <AppShell current="brain" wide>
      <BrainRoll tongue={tongue} />
    </AppShell>
  );
}
