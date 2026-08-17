import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctrine")({
  beforeLoad: () => {
    throw redirect({ to: "/why", search: { tongue: undefined } });
  },
});
