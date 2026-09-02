import { createFileRoute } from "@tanstack/react-router";
import { GlyphboundSortie } from "@/components/GlyphboundSortie";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/glyphbound/sortie")({
  head: () => {
    const card = pageCardMeta({
      title: "Drop Cap Sortie",
      description: "Pilot the C-wing over the ink sea. Hunt Dualis. All-range.",
      path: "/glyphbound/sortie",
      imagePath: "/glyphbound.jpg",
    });
    return {
      ...card,
      meta: [...card.meta, { property: "og:type", content: "x:game" }, { name: "theme-color", content: "#07080c" }],
    };
  },
  component: GlyphboundSortie,
});
