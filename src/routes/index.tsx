import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LatinPortrait } from "@/components/letterology/LatinPortrait";
import { TongueStage } from "@/components/letterology/TongueStage";
import { AppShell } from "@/components/SiteChrome";
import { GreekPortrait } from "@/components/stoicheia/GreekPortrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useHouseHoroscope } from "@/lib/firebase/house-provider";
import { buildHoroscope } from "@/lib/letterology/engine";
import { pageCardMeta } from "@/lib/letterology/share";
import { isGameFirstLocation, resolvePlayHost } from "@/lib/play-host";
import { useTongue } from "@/components/letterology/TongueProvider";
import { noteHandle } from "@/lib/letterology/tongue";
import { VOICE } from "@/lib/letterology/voice";
import { stoicheiaCardFile, stoicheiaNamePath } from "@/lib/stoicheia/copy";
import { readStoicheion } from "@/lib/stoicheia/engine";

type Search = { n?: string; name?: string; tongue?: "la" | "el"; club?: boolean };

function glyphCard() {
  return pageCardMeta({
    title: "Glyphbound",
    description: VOICE.glyphLede,
    path: "/",
    imagePath: "/glyphbound.jpg",
  });
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : typeof search.name === "string" ? search.name : undefined,
    name: typeof search.name === "string" ? search.name : undefined,
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
    club: search.club === true || search.club === "1" || search.club === 1 ? true : undefined,
  }),
  loader: async ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    const n = params.get("n") ?? params.get("name") ?? undefined;
    const club = params.get("club") === "1" || params.get("club") === "true";
    let host = resolvePlayHost(location.href);
    if (!host && import.meta.env.SSR) {
      try {
        const start = await import("@tanstack/react-start/server");
        host = start.getRequestHost({ xForwardedHost: true });
      } catch {
        /* preview / static */
      }
    }
    return {
      n,
      tongue: params.get("tongue") === "el" ? ("el" as const) : params.get("tongue") === "la" ? ("la" as const) : undefined,
      gameFirst: isGameFirstLocation(host, { n, club }),
    };
  },
  head: ({ loaderData }) => {
    if (loaderData?.gameFirst) return glyphCard();
    const handle = loaderData?.n ?? "";
    const tongue = loaderData?.tongue === "el" ? "el" : "la";
    if (!handle) {
      return pageCardMeta({
        title: "CC33",
        description: VOICE.homeHero,
        path: "/",
        imagePath: "/og.jpg",
      });
    }
    if (tongue === "el") {
      const reading = readStoicheion(handle);
      return pageCardMeta({
        title: reading ? `${reading.raw} · ${reading.road.title}` : handle,
        description: reading?.epithet ?? VOICE.stoicheiaLede,
        path: stoicheiaNamePath(handle),
        imagePath: reading ? `/og/${stoicheiaCardFile("name", reading.raw)}` : "/og.jpg",
      });
    }
    const horoscope = buildHoroscope(handle);
    return pageCardMeta({
      title: horoscope ? `${horoscope.displayName} · ${horoscope.archetype.title}` : handle,
      description: horoscope?.archetype.myth ?? VOICE.homeHero,
      path: `/?n=${encodeURIComponent(handle)}`,
      imagePath: "/og.jpg",
    });
  },
  component: Home,
});

function Home() {
  const loaded = Route.useLoaderData();
  if (loaded.gameFirst) return <OpenGlyphbound />;
  return <ClubHome />;
}

function OpenGlyphbound() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/glyphbound", replace: true });
  }, [navigate]);
  return null;
}

function ClubHome() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const sittingUser = useCurrentUser();
  const sitting = useHouseHoroscope();
  const handle = loaded.n ?? search.n ?? sittingUser?.displayHandle ?? "";
  const tongue = useTongue(search.tongue ?? loaded.tongue);
  const [value, setValue] = useState(handle);
  const latin = useMemo(() => (handle ? buildHoroscope(handle) : null), [handle]);
  const greek = useMemo(() => (handle ? readStoicheion(handle) : null), [handle]);
  const empty = Boolean(handle) && !latin && !greek;
  const door = !handle && !sitting;

  useEffect(() => {
    if (!isGameFirstLocation(window.location.host, { n: handle || undefined, club: search.club })) {
      return;
    }
    void navigate({ to: "/glyphbound", replace: true });
  }, [handle, navigate, search.club]);

  useEffect(() => {
    if (handle) setValue(handle);
  }, [handle]);

  useEffect(() => {
    noteHandle(value);
  }, [value]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({
      search: {
        n: value.trim() || undefined,
        name: undefined,
        tongue: tongue === "el" ? "el" : "la",
      },
    });
  }

  return (
    <AppShell current="read">
      {door ? (
        <section className="mx-auto max-w-xl pt-8 text-center sm:pt-16">
          <img
            src="/seal.jpg"
            alt=""
            width={96}
            height={96}
            className="mx-auto size-20 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
          />
          <h1 className="mt-6 font-display text-5xl text-ink sm:text-7xl">CC33</h1>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            {tongue === "el" ? VOICE.stoicheiaLede : VOICE.homeHero}
          </p>
          <form onSubmit={onSubmit} className="mt-8 text-left">
            <Label htmlFor="username">Your username</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="username"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="@lovelace"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
              />
              <Button type="submit" className="h-12 shrink-0">
                Read
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted">{VOICE.nameFormHint}</p>
          </form>
          <ClubGames />
        </section>
      ) : (
        <div className="space-y-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Your username"
              autoCapitalize="none"
              spellCheck={false}
              aria-label="Your username"
            />
            <Button type="submit" className="h-12 shrink-0">
              Read
            </Button>
          </form>
          {empty ? <p className="text-sm text-primary">{VOICE.stoicheiaEmpty}</p> : null}
          {latin || greek ? (
            <TongueStage
              tongue={tongue}
              latin={latin ? <LatinPortrait horoscope={latin} /> : <p className="text-sm text-muted">No Latin letters in this handle.</p>}
              greek={greek ? <GreekPortrait reading={greek} /> : <p className="text-sm text-muted">{VOICE.stoicheiaEmpty}</p>}
            />
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function ClubGames() {
  return (
    <section className="mt-16 text-left" aria-label="Games">
      <p className="text-center text-sm text-muted">{VOICE.gamesHome}</p>
      <div className="mt-4 space-y-3">
        <GameCard
          to="/glyphbound"
          title="Glyphbound"
          lede={VOICE.glyphLede}
          image="/glyphbound.jpg"
          alt="Glyphbound — the letter c facing a mechanical number wyrm in the rain"
        />
        <GameCard
          to="/starwords"
          title="StarWords"
          lede={VOICE.starWordsLede}
          image="/starwords.jpg"
          alt="StarWords — the C-wing banking through an asteroid field"
        />
      </div>
    </section>
  );
}

function GameCard({
  to,
  title,
  lede,
  image,
  alt,
}: {
  to: "/glyphbound" | "/starwords";
  title: string;
  lede: string;
  image: string;
  alt: string;
}) {
  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-lg bg-raised shadow-border transition-[box-shadow] duration-150 ease-out hover:shadow-border-hover"
    >
      <img
        src={image}
        alt={alt}
        width={1200}
        height={630}
        className="h-40 w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
      />
      <div className="px-4 py-3">
        <p className="font-display text-xl text-ink">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{lede}</p>
      </div>
    </Link>
  );
}
