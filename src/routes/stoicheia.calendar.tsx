import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/calendar")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: { n: undefined, name: undefined, tongue: "el" } });
  },
});
