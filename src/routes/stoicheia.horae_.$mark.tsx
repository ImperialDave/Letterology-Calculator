import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/horae_/$mark")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/letters/$mark",
      params: { mark: params.mark },
      search: { tongue: "el" },
    });
  },
});
