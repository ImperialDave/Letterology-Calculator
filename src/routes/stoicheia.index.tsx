import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/")({
  validateSearch: (search: Record<string, unknown>) => ({
    n: typeof search.n === "string" ? search.n : undefined,
  }),
  beforeLoad: ({ search, location }) => {
    const n = search.n ?? new URL(location.href, "https://www.letterology.club").searchParams.get("n") ?? undefined;
    throw redirect({
      to: "/",
      search: { n: n ?? undefined, name: undefined, tongue: "el" },
    });
  },
});
