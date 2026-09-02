import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StarWords } from "@/components/GlyphboundSortie";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const STAR_ALT = "StarWords — the C-wing banking through an asteroid field";

const starCard = () => {
  const card = pageCardMeta({
    title: "StarWords",
    description: VOICE.starWordsLede,
    path: "/starwords",
    imagePath: "/starwords.jpg",
  });
  return {
    ...card,
    meta: card.meta.map((item) => {
      if (item.property === "og:type") return { property: "og:type", content: "x:game" };
      if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
        return { ...item, content: STAR_ALT };
      }
      return item;
    }),
  };
};

export const Route = createFileRoute("/starwords")({
  head: () => {
    const card = starCard();
    return {
      ...card,
      meta: [
        ...card.meta,
        { name: "theme-color", content: "#07080c" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "StarWords" },
      ],
    };
  },
  component: PlayStarWords,
});

function PlayStarWords() {
  const navigate = useNavigate();
  return (
    <StarWords
      onLeave={() => {
        void navigate({ to: "/", search: { n: undefined, name: undefined, tongue: undefined, club: true } });
      }}
      leaveLabel="Back to the club"
    />
  );
}
