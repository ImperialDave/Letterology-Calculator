import { createFileRoute } from "@tanstack/react-router";
import { Cinderwell } from "@/components/cinderwell";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

export const Route = createFileRoute("/play")({
  head: () =>
    pageCardMeta({
      title: "Cinderwell",
      description: VOICE.wellLede,
      path: "/play",
      imagePath: "/cinderwell.jpg",
    }),
  component: Play,
});

function Play() {
  return <Cinderwell />;
}
