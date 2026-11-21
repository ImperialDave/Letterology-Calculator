import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const ALT = "Logostax — cream, teal, and copper letter tiles stacked on a black board";
const PLAY = "https://logostax.grok.me/";

function logostaxCard() {
  const card = pageCardMeta({
    title: "Logostax",
    description: VOICE.logostaxLede,
    path: "/logostax",
    imagePath: "/logostax.jpg",
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
}

export const Route = createFileRoute("/logostax")({
  head: () => logostaxCard(),
  component: OpenLogostax,
});

function OpenLogostax() {
  useEffect(() => {
    window.location.replace(PLAY);
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16 text-center">
      <img src="/logostax.jpg" alt={ALT} width={1200} height={630} className="w-full rounded-lg" />
      <h1 className="mt-6 font-display text-4xl text-ink">Logostax</h1>
      <p className="mt-3 text-muted">{VOICE.logostaxLede}</p>
      <a href={PLAY} className="mt-6 font-display text-lg text-primary">
        Play
      </a>
    </main>
  );
}
