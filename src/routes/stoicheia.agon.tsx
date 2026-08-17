import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stoicheia/agon")({
  validateSearch: (search: Record<string, unknown>) => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/two",
      search: { a: search.a, b: search.b, tongue: "el", mode: "agon" },
    });
  },
});
