import { createFileRoute } from "@tanstack/react-router";
import { FieldSheet } from "@/components/letterology/FieldSheet";
import { AppShell } from "@/components/SiteChrome";
import { useTongue } from "@/components/letterology/TongueProvider";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/sheet")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Cheat sheet",
      description: VOICE.sheetLede,
      path: "/sheet",
      imagePath: "/og.jpg",
    }),
  component: SheetPage,
});

function SheetPage() {
  const tongue = useTongue(Route.useSearch().tongue);
  return (
    <AppShell current="sheet" wide>
      <FieldSheet tongue={tongue} />
    </AppShell>
  );
}
