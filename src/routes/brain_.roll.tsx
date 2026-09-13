import { createFileRoute, Navigate } from "@tanstack/react-router";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/brain_/roll")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: VOICE.courtTitle,
      description: VOICE.courtLede,
      path: "/court",
      imagePath: "/og.jpg",
    }),
  component: function BrainRollRedirect() {
    const search = Route.useSearch();
    return <Navigate to="/court" search={{ tongue: search.tongue, desk: undefined }} />;
  },
});
