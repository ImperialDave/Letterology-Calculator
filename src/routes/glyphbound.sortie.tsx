import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/glyphbound/sortie")({
  beforeLoad: () => {
    throw redirect({ to: "/starwords" });
  },
});

