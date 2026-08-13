import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { BondForm } from "@/components/letterology/BondForm";
import { BondView } from "@/components/letterology/BondView";
import { PageShare } from "@/components/letterology/PageShare";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { compareNames } from "@/lib/letterology/compatibility";
import { saveRecent, saveRecentBond } from "@/lib/letterology/recent";
import {
  bondCardFile,
  bondDescription,
  bondPath,
  bondTitle,
  pageCardMeta,
} from "@/lib/letterology/share";

type Search = { a?: string; b?: string };

export const Route = createFileRoute("/bond")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  loader: ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    return {
      a: params.get("a") ?? undefined,
      b: params.get("b") ?? undefined,
    };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.a;
    const b = loaderData?.b;
    if (a && b) {
      const bond = compareNames(a, b);
      if (bond) {
        return pageCardMeta({
          title: bondTitle(bond.a.displayName, bond.b.displayName, bond.title),
          description: bondDescription(bond.title, bond.plainly),
          path: bondPath(bond.a.displayName, bond.b.displayName),
          imagePath: `/og/${bondCardFile(bond.a.displayName, bond.b.displayName)}`,
        });
      }
    }
    return pageCardMeta({
      title: "Certificate of Bond",
      description: "Compare two usernames. Houses, manners, letters — then a card you can post.",
      path: "/bond",
      imagePath: "/og.jpg",
    });
  },
  component: BondPage,
});

function BondPage() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate({ from: "/bond" });
  const bond = useMemo(() => (a && b ? compareNames(a, b) : null), [a, b]);
  const missing = Boolean(a && b) && !bond;

  useEffect(() => {
    if (!bond) return;
    saveRecent(bond.a.displayName);
    saveRecent(bond.b.displayName);
    saveRecentBond(bond.a.displayName, bond.b.displayName);
  }, [bond]);

  function readPair(nextA: string, nextB: string) {
    navigate({ search: { a: nextA, b: nextB } });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="bond" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!bond ? (
          <section className="mx-auto max-w-2xl">
            <div className="text-center sm:text-left">
              <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
                Two handles, one wheel
              </p>
              <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Certificate of Bond</h1>
              <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
                Type two usernames. We read eight measures: the role each first letter names,
                how each tends to work, where, how the spellings overlap, the allies one already
                carries for the other, inward versus outward, the court, and the honest argument.
                The title is unique to the pair. The number is a fit, not a forecast.
              </p>
              <PageShare
                path="/bond"
                caption={"Certificate of Bond\nCompare two usernames on the wheel."}
                imagePath="/og.jpg"
              />
            </div>
            <div className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <BondForm initialA={a ?? ""} initialB={b ?? ""} onSubmit={readPair} />
              {missing ? (
                <p className="mt-4 text-sm text-primary">
                  One of those handles has no A–Z in it. Give the bond two names it can read.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5">
              <BondForm
                initialA={bond.a.displayName}
                initialB={bond.b.displayName}
                onSubmit={readPair}
                compact
              />
            </div>
            <BondView key={`${bond.a.normalized}:${bond.b.normalized}`} bond={bond} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
