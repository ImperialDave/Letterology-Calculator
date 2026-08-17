import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/doctrine")({
  beforeLoad: () => {
    throw redirect({ to: "/why", search: { tongue: "el" } });
  },
});
