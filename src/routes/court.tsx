import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { CourtTools, type CourtDesk } from "@/components/letterology/CourtTools";
import { useTongue } from "@/components/letterology/TongueProvider";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el"; desk?: CourtDesk };

function deskOf(raw: unknown): CourtDesk {
  if (raw === "portraits" || raw === "threshold" || raw === "overview") return raw;
  return "overview";
}

export const Route = createFileRoute("/court")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
    desk: deskOf(search.desk) === "overview" ? undefined : deskOf(search.desk),
  }),
  head: () =>
    pageCardMeta({
      title: VOICE.courtTitle,
      description: VOICE.courtLede,
      path: "/court",
      imagePath: "/og.jpg",
    }),
  component: CourtPage,
});

function CourtPage() {
  const search = Route.useSearch();
  const tongue = useTongue(search.tongue);
  return (
    <AppShell current="court" wide>
      <CourtTools tongue={tongue} desk={search.desk ?? "overview"} />
    </AppShell>
  );
}
