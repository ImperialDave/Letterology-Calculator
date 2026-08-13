import { createFileRoute } from "@tanstack/react-router";
import { parseIso } from "@/lib/letterology/calendar";
import { dayReadingOf } from "@/lib/letterology/day-reading";
import { portraitSvg } from "@/lib/letterology/share-card";
import { portraitOf } from "@/lib/letterology/share";

async function renderPng(svg: string): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: true },
    background: "#efe6d6",
  });
  return Buffer.from(resvg.render().asPng());
}

export const Route = createFileRoute("/api/card")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const name = (url.searchParams.get("n") ?? "").trim();
        const horoscope = portraitOf(name);
        if (!horoscope) {
          return new Response("Name required", { status: 400 });
        }
        const civil = parseIso(url.searchParams.get("date") ?? undefined);
        const day = dayReadingOf(horoscope, civil ?? new Date());
        try {
          const png = await renderPng(portraitSvg(horoscope, day?.headline));
          return new Response(new Uint8Array(png), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            },
          });
        } catch (error) {
          console.error("[card] render failed", error);
          return new Response("Card failed", { status: 500 });
        }
      },
    },
  },
});
