import { createFileRoute, Link } from "@tanstack/react-router";
import { HoroscopeView } from "@/components/letterology/HoroscopeView";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  cardImageUrl,
  nameToSlug,
  portraitDescription,
  portraitOf,
  portraitTitle,
  serverOrigin,
  slugToName,
} from "@/lib/letterology/share";

export const Route = createFileRoute("/p/$slug")({
  loader: ({ params }) => {
    const name = slugToName(params.slug);
    return { name, horoscope: portraitOf(name) };
  },
  head: ({ loaderData }) => {
    const origin = serverOrigin();
    const horoscope = loaderData?.horoscope;
    if (!horoscope) {
      return {
        meta: [{ title: "Letterology" }],
      };
    }
    const title = portraitTitle(horoscope);
    const description = portraitDescription(horoscope);
    const image = cardImageUrl(horoscope.displayName, origin);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: title },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${origin}/p/${encodeURIComponent(nameToSlug(horoscope.displayName))}` },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
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
      <div className="min-h-dvh">
        <SiteHeader current="read" />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">No letters</p>
          <h1 className="mt-3 font-display text-4xl text-ink">That name has nothing to read.</h1>
          <p className="mt-3 text-muted">{name || "Give the portrait a name with A–Z in it."}</p>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Read a name
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="read" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <HoroscopeView key={horoscope.normalized} horoscope={horoscope} />
      </main>
      <SiteFooter />
    </div>
  );
}
