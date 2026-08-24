import { createFileRoute } from "@tanstack/react-router";
import { Glyphbound } from "@/components/Glyphbound";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const GLYPH_ALT = "Glyphbound — the letter c facing a mechanical number wyrm in the rain";

const glyphCard = () => {
  const card = pageCardMeta({
    title: "Glyphbound",
    description: VOICE.glyphLede,
    path: "/glyphbound",
    imagePath: "/glyphbound.jpg",
  });
  return {
    ...card,
    meta: card.meta.map((item) => {
      if (item.property === "og:type") return { property: "og:type", content: "x:game" };
      if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
        return { ...item, content: GLYPH_ALT };
      }
      return item;
    }),
  };
};

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
