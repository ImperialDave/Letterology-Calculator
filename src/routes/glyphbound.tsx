import { createFileRoute } from "@tanstack/react-router";
import { Glyphbound } from "@/components/Glyphbound";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const glyphCard = () =>
  pageCardMeta({
    title: "Glyphbound",
    description: VOICE.glyphLede,
    path: "/glyphbound",
    imagePath: "/og.jpg",
  });

export const Route = createFileRoute("/glyphbound")({
  head: () => {
    const card = glyphCard();
    return {
      ...card,
      meta: [
        ...card.meta,
        { name: "theme-color", content: "#07080c" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
      ],
    };
  },
  component: PlayGlyphbound,
});

function PlayGlyphbound() {
  return <Glyphbound />;
}
