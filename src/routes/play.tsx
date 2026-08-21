import { createFileRoute } from "@tanstack/react-router";
import { Cinderwell } from "@/components/cinderwell";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const playCard = () =>
  pageCardMeta({
    title: "Cinderwell",
    description: VOICE.wellLede,
    path: "/play",
    imagePath: "/og.jpg",
  });

export const Route = createFileRoute("/play")({
  head: () => {
    const card = playCard();
    return {
      ...card,
      meta: [
        ...card.meta,
        { name: "theme-color", content: "#100e0c" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
      ],
    };
  },
  component: Play,
});

function Play() {
  return <Cinderwell />;
}
