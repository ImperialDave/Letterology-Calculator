import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/SiteChrome";
import { DOCTRINE, DOCTRINE_PREFACE } from "@/lib/letterology/doctrine";
import { pageCardMeta } from "@/lib/letterology/share";
import { useTongue } from "@/components/letterology/TongueProvider";
import { VOICE } from "@/lib/letterology/voice";
import { STOICHEIA_DOCTRINE } from "@/lib/stoicheia/doctrine";

type Search = { tongue?: "la" | "el" };

export const Route = createFileRoute("/why")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  head: () =>
    pageCardMeta({
      title: "Why",
      description: VOICE.doctrineAbstract,
      path: "/why",
      imagePath: "/og.jpg",
    }),
  component: WhyPage,
});

function WhyPage() {
  const tongue = useTongue(Route.useSearch().tongue);

  useEffect(() => {
    const id = tongue === "el" ? "greek" : "latin";
    if (tongue === "la" && !window.location.hash) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tongue]);

  return (
    <AppShell current="why">
      <header>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Why</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">{VOICE.doctrineAbstract}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Latin: first letter is the role; the next two by how often they return are how and where.
          Greek: first and last are the road; vowels are a song in order; consonants are public
          work; the total is an old number written as letters. The Count writes amounts as A–Z.
          Luck is the day's willingness. Letterize an act to time it.
        </p>
      </header>

      <section id="latin" className="mt-10 space-y-4 scroll-mt-24">
        {DOCTRINE_PREFACE.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </section>

      {DOCTRINE.map((section) => (
        <section key={section.title} className="mt-10">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{section.kicker}</p>
          <h2 className="mt-1 font-display text-2xl text-ink">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-3 leading-relaxed text-ink/90">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section id="greek" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl text-ink">The Greek warrant</h2>
        {STOICHEIA_DOCTRINE.map((section) => (
          <article key={section.title} className="mt-8">
            <h3 className="font-display text-2xl text-ink">{section.title}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-3 leading-relaxed text-ink/90">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </section>
    </AppShell>
  );
}
