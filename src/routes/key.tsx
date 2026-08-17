import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PageShare } from "@/components/letterology/PageShare";
import { CALENDAR_PLAIN, GLOSSARY, METHOD_PLAIN } from "@/lib/letterology/glossary";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/key")({
  head: () =>
    pageCardMeta({
      title: "The Key",
      description: "How a reading works. The first letter is the role. The next two are how you work and where.",
      path: "/key",
      imagePath: "/og.jpg",
    }),
  component: KeyPage,
});

const STEPS = [
  {
    term: "Role",
    detail:
      "The first letter of the username names a role. L is the Lover. That is who the reading starts as — an entrance, not a cage. The rest of the spelling may argue, complete, or betray that entrance. It does not get to pretend the entrance did not happen.",
  },
  {
    term: "How you work",
    detail:
      "The letter that weighs most after the first is how you work. Repeats count because insistence is information. First and last letters of a word count extra because edges are where a name touches the air. Order after the first letter is an accident of spelling. Weight is not.",
  },
  {
    term: "Where you work",
    detail:
      "The next letter by weight is where the work happens — the kind of place, not a job title. Hearth, road, threshold, forge: a field is a climate for the work, not an office on a door.",
  },
  {
    term: "Letter Path",
    detail:
      "Three letters together: the role, how you work, and where. That path has a name and a mixed color — the house leads the mix. Read the title as a likeness. Do not spend it as an excuse.",
  },
  {
    term: "Allies and enemies",
    detail:
      "Each house has three complements and three counterweights. Allies complete a job this role cannot finish alone. An enemy is a blind spot, not a villain — the work you will not look at.",
  },
  {
    term: "Bond",
    detail:
      "Two usernames, compared. Houses, how they work, shared letters, and missing allies the other already carries. The card is only this pair’s. The number is a fit, not a forecast. A high fit can be a trap.",
  },
  {
    term: "The Count",
    detail:
      "We write amounts as letters so we can count without digits. A is one. Z is twenty-six. AA is twenty-seven. The Fool is the blank page. We do not fold a year into one digit. You can add two letter-counts and stay in letters.",
  },
];

function KeyPage() {
  const high = GLOSSARY.filter((item) => item.opacity === "high");
  const rest = GLOSSARY.filter((item) => item.opacity !== "high");

  return (
    <div className="min-h-dvh">
      <SiteHeader current="key" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            A dictionary for the uninitiated
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The Key</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
            How a reading works. The first letter of a username is the role. The next two by
            weight are how you work and where. Allies complete a job. Enemies are the blind
            spot, not the villain. This page names the few words we still keep — Seeker,
            Letter Path, allies — and says what they mean, twice if needed. The argument for
            why the machine is shaped this way lives in{" "}
            <Link to="/doctrine" className="text-primary">
              The Doctrine
            </Link>
            .
          </p>
          <div className="mt-4 border-t border-ink/10 pt-4">
            <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">In other words</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{METHOD_PLAIN}</p>
          </div>
          <PageShare
            path="/key"
            caption={"The Key\nHow to read CC33 Letterology without already being a wizard."}
            imagePath="/og.jpg"
          />
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <article key={step.term} className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
              <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{step.term}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{step.detail}</p>
              {step.term === "The Count" ? (
                <p className="mt-3">
                  <Link
                    to="/count"
                    className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
                  >
                    Open the Count
                  </Link>
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">The year</p>
          <h2 className="mt-2 font-display text-2xl text-ink">How a day is read</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{CALENDAR_PLAIN}</p>
          <p className="mt-4">
            <Link
              to="/almanac"
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              Open the almanac
            </Link>
          </p>
        </section>

        <section className="mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Two handles</p>
          <h2 className="mt-2 font-display text-2xl text-ink">How a bond is read</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">
            Type two usernames. We compare the role each first letter names, then how each tends
            to work, then where. Allies complete a job. Enemies keep it honest. Shared letters are
            common ground. If one name already carries an ally the other is missing, that is a
            gift. The number is a fit, not a forecast.
          </p>
          <p className="mt-4">
            <Link
              to="/bond"
              className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
            >
              Compare two handles
            </Link>
          </p>
        </section>

        <section className="mt-12">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {high.length} terms that need a translation
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">The opaque ones</h2>
          <ul className="mt-6 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)] sm:px-7">
            {high.map((item) => (
              <li key={item.id} className="py-5">
                <p className="font-display text-xl text-ink">{item.term}</p>
                <p className="mt-1 text-sm italic text-ink/65">“{item.metaphor}”</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">{item.plain}</p>
                <p className="mt-2 font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase">
                  {item.surfaces.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            Already closer to English
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">The rest of the tongue</h2>
          <ul className="mt-6 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)] sm:px-7">
            {rest.map((item) => (
              <li key={item.id} className="py-5">
                <p className="font-display text-lg text-ink">{item.term}</p>
                <p className="mt-1 text-sm italic text-ink/65">“{item.metaphor}”</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">{item.plain}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
