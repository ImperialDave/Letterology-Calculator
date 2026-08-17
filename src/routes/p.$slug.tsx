import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { LatinPortrait } from "@/components/letterology/LatinPortrait";
import { AppShell } from "@/components/SiteChrome";
import {
  cardImageUrl,
  nameToSlug,
  portraitDescription,
  portraitOf,
  portraitTitle,
  publicSiteOrigin,
  slugToName,
} from "@/lib/letterology/share";

export const Route = createFileRoute("/p/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  beforeLoad: ({ params }) => {
    const name = slugToName(params.slug);
    const canonical = nameToSlug(name);
    if (canonical && params.slug !== canonical) {
      throw redirect({
        to: "/p/$slug",
        params: { slug: canonical },
        search: { date: undefined },
      });
    }
  },
  loader: ({ params, location }) => {
    const name = slugToName(params.slug);
    const date = new URL(location.href, "https://www.letterology.club").searchParams.get("date") ?? undefined;
    return { name, horoscope: portraitOf(name), date };
  },
  head: ({ loaderData }) => {
    const origin = publicSiteOrigin();
    const horoscope = loaderData?.horoscope;
    if (!horoscope) {
      return { title: "CC33", meta: [{ title: "CC33" }] };
    }
    const title = portraitTitle(horoscope);
    const description = portraitDescription(horoscope);
    const image = cardImageUrl(horoscope.displayName, origin);
    const url = `${origin}/p/${nameToSlug(horoscope.displayName)}`;
    return {
      title,
      meta: [
        { title },
        { name: "description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: title },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "CC33" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:alt", content: title },
      ],
    };
  },
  component: PortraitPage,
});

function PortraitPage() {
  const { name, horoscope } = Route.useLoaderData();

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
      <LatinPortrait key={horoscope.normalized} horoscope={horoscope} />
    </AppShell>
  );
}
