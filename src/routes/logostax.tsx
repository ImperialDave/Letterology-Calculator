import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/logostax/game";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const ALT = "Logostax — cream, teal, and copper letter tiles stacked on a black board";

function logostaxCard() {
  const card = pageCardMeta({
    title: "Logostax",
    description: VOICE.logostaxLede,
    path: "/logostax",
    imagePath: "/logostax.jpg",
  });
  return {
    ...card,
    meta: [
      ...card.meta.map((item) => {
        if (item.property === "og:type") return { property: "og:type", content: "x:game" };
        if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
          return { ...item, content: ALT };
        }
        return item;
      }),
      { name: "theme-color", content: "#12110e" },
      { name: "apple-mobile-web-app-title", content: "Logostax" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&display=swap",
      },
    ],
  };
}

export const Route = createFileRoute("/logostax")({
  head: () => logostaxCard(),
  component: PlayLogostax,
});

function PlayLogostax() {
  return (
    <div className="stx">
      <Game />
    </div>
  );
}
