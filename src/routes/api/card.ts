import { createFileRoute } from "@tanstack/react-router";
import { cardImageUrl, publicSiteOrigin } from "@/lib/letterology/share";

export const Route = createFileRoute("/api/card")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const name = (url.searchParams.get("n") ?? "").trim();
        if (!name) return new Response("Name required", { status: 400 });
        const dest = cardImageUrl(name, publicSiteOrigin(), url.searchParams.get("date") ?? undefined);
        return Response.redirect(dest, 301);
      },
    },
  },
});
