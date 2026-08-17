import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/key")({
  beforeLoad: () => {
    throw redirect({ to: "/why", search: { tongue: undefined } });
  },
});
