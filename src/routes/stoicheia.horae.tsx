import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/horae")({
  beforeLoad: () => {
    throw redirect({ to: "/letters", search: { tongue: "el" } });
  },
});
