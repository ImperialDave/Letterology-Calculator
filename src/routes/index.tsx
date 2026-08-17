import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { noteHandle, parseTongue } from "@/lib/letterology/tongue";
import { VOICE } from "@/lib/letterology/voice";
import { stoicheiaCardFile, stoicheiaNamePath } from "@/lib/stoicheia/copy";
import { readStoicheion } from "@/lib/stoicheia/engine";

type Search = { n?: string; name?: string; tongue?: "el" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : typeof search.name === "string" ? search.name : undefined,
    name: typeof search.name === "string" ? search.name : undefined,
    tongue: search.tongue === "el" ? "el" : undefined,
  }),
  loader: ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    return {
      n: params.get("n") ?? params.get("name") ?? undefined,
      tongue: params.get("tongue") === "el" ? ("el" as const) : undefined,
    };
  },
  head: ({ loaderData }) => {
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const sittingUser = useCurrentUser();
  const sitting = useHouseHoroscope();
  const handle = loaded.n ?? search.n ?? sittingUser?.displayHandle ?? "";
  const tongue = parseTongue(loaded.tongue ?? search.tongue);
  const [value, setValue] = useState(handle);
  const latin = useMemo(() => (handle ? buildHoroscope(handle) : null), [handle]);
  const greek = useMemo(() => (handle ? readStoicheion(handle) : null), [handle]);
  const empty = Boolean(handle) && !latin && !greek;
  const door = !handle && !sitting;

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
        tongue: tongue === "el" ? "el" : undefined,
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
          <p className="mt-3 text-base leading-relaxed text-ink/80">{VOICE.homeHero}</p>
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
