import { createFileRoute } from "@tanstack/react-router";
import { UnwrittenWild } from "@/components/UnwrittenWild";
import { pageCardMeta } from "@/lib/letterology/share";

const ALT = "The Unwritten Wild — Sable Quill on the Vellum Steppe, staff in hand, a branded stag on the trail";

export const Route = createFileRoute("/wild")({
  head: () => {
    const card = pageCardMeta({
      title: "The Unwritten Wild",
      description: "Play the steppe. Cut the brand, keep the stag, carry the serif to the spire.",
      path: "/wild",
      imagePath: "/wild/house.png",
    });
    return {
      ...card,
      meta: card.meta.map((item) => {
        if (item.property === "og:type") return { property: "og:type", content: "x:game" };
        if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
          return { ...item, content: ALT };
        }
        return item;
      }),
    };
  },
  component: UnwrittenWild,
});
