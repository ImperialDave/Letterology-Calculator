import { createFileRoute } from "@tanstack/react-router";
import { jpegResponse, renderPortraitJpeg } from "@/lib/letterology/render-card";

async function handle({ request, params }: { request: Request; params: { file: string } }) {
  const jpeg = await renderPortraitJpeg(params.file);
  if (!jpeg) {
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  return jpegResponse(jpeg, request.method);
}

export const Route = createFileRoute("/og/$file")({
  server: {
    handlers: {
      GET: handle,
      HEAD: handle,
    },
  },
});
