import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { LatinPortrait } from "@/components/letterology/LatinPortrait";
import { AppShell } from "@/components/SiteChrome";
import { parseIso } from "@/lib/letterology/calendar";
import { portraitOf, portraitPageMeta, nameToSlug, slugToName } from "@/lib/letterology/share";

export const Route = createFileRoute("/p/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  beforeLoad: ({ params, search }) => {
    const name = slugToName(params.slug);
    const canonical = nameToSlug(name);
    if (canonical && params.slug !== canonical) {
      throw redirect({
        to: "/p/$slug",
        params: { slug: canonical },
        search: { date: search.date },
      });
    }
  },
  loader: ({ params, location }) => {
    const name = slugToName(params.slug);
    const date = new URL(location.href, "https://www.letterology.club").searchParams.get("date") ?? undefined;
    return { name, horoscope: portraitOf(name), date };
  },
  head: ({ loaderData }) => {
    const horoscope = loaderData?.horoscope;
    if (!horoscope) {
      return { title: "CC33", meta: [{ title: "CC33" }] };
    }
    return (
      portraitPageMeta(horoscope.displayName, loaderData?.date) ?? {
        title: "CC33",
        meta: [{ title: "CC33" }],
      }
    );
  },
  component: PortraitPage,
});

function PortraitPage() {
  const { name, horoscope, date } = Route.useLoaderData();
  const civil = parseIso(date);

  if (!horoscope) {
    return (
      <AppShell current="read">
        <div className="py-16 text-center">
          <h1 className="font-display text-4xl text-ink">That username has nothing to read.</h1>
          <p className="mt-3 text-muted">{name || "Give the portrait a username with A–Z in it."}</p>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Read a username
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell current="read">
      <LatinPortrait key={horoscope.normalized} horoscope={horoscope} date={civil ?? undefined} />
    </AppShell>
  );
}
