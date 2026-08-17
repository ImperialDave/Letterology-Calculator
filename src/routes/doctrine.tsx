import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShare } from "@/components/letterology/PageShare";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { letterAt } from "@/lib/letterology/calendar";
import { DOCTRINE, DOCTRINE_CLOSE, DOCTRINE_PREFACE } from "@/lib/letterology/doctrine";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/doctrine")({
  head: () =>
    pageCardMeta({
      title: "The Doctrine",
      description:
        "Letterology is a discipline of attention. Why the handle sits a house, why numbers must become letters, and why this is a portrait, not a prediction.",
      path: "/doctrine",
      imagePath: "/og.jpg",
    }),
  component: DoctrinePage,
});

function DoctrinePage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="key" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
        <header className="border-b border-ink/10 pb-10">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.08] text-ink sm:text-6xl">The Doctrine</h1>
          <p className="mt-4 font-display text-xl leading-snug text-primary sm:text-2xl">
            Why the system is shaped the way it is.
          </p>
          <div className="mt-8 space-y-5 text-base leading-[1.7] text-ink/90 sm:text-lg">
            {DOCTRINE_PREFACE.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
          <PageShare
            path="/doctrine"
            caption={"The Doctrine\nA portrait, not a prediction. The letters you already carry are the material."}
            imagePath="/og.jpg"
          />
        </header>

        <div className="mt-6">
          {DOCTRINE.map((section, index) => (
            <article
              key={section.title}
              className="border-b border-ink/10 py-12 first:pt-10 last:border-b-0"
            >
              <p className="font-display text-xs tracking-[0.2em] text-primary uppercase">
                {letterAt(index)} · {section.kicker}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
                {section.title}
              </h2>
              <div className="mt-6 space-y-5 text-base leading-[1.7] text-ink/90 sm:text-[1.05rem]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 56)}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 border-t border-ink/10 pt-10 text-center font-display text-xl leading-snug text-ink sm:text-2xl">
          {DOCTRINE_CLOSE}
        </p>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            to="/key"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            The Key
          </Link>
          <Link
            to="/"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Read a username
          </Link>
          <Link
            to="/count"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            The Count
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
