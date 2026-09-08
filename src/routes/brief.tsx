import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { BriefDeck } from "@/components/letterology/BriefDeck";
import { useTongue } from "@/components/letterology/TongueProvider";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el"; s?: number };

export const Route = createFileRoute("/brief")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.s === "number" ? search.s : typeof search.s === "string" ? Number(search.s) : undefined;
    const s = raw != null && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : undefined;
    return {
      tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
      s,
    };
  },
  head: () =>
    pageCardMeta({
      title: VOICE.briefTitle,
      description: VOICE.briefLede,
      path: "/brief",
      imagePath: "/og.jpg",
    }),
  component: BriefPage,
});

function BriefPage() {
  const search = Route.useSearch();
  const tongue = useTongue(search.tongue);
  return (
    <AppShell current="brief" wide>
      <BriefDeck index={search.s ?? 0} tongue={tongue} />
    </AppShell>
  );
}
