import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/circle")({
  beforeLoad: () => {
    throw redirect({ to: "/letters", search: { tongue: undefined } });
  },
});
