import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wild_/edit")({
  beforeLoad: () => {
    throw redirect({ to: "/guess" });
  },
});
