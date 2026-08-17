import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/almanac")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: { n: undefined, name: undefined, tongue: undefined } });
  },
});
