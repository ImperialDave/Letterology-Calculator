import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wild")({
  beforeLoad: () => {
    throw redirect({ to: "/guess" });
  },
});
