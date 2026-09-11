import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { BrainRollSitting } from "@/components/letterology/BrainRoll";
import { useTongue } from "@/components/letterology/TongueProvider";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/brain_/roll_/$id")({
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
  component: BrainRollSittingPage,
});

function BrainRollSittingPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const tongue = useTongue(search.tongue);
  return (
    <AppShell current="brain" wide>
      <BrainRollSitting id={id} tongue={tongue} />
    </AppShell>
  );
}
