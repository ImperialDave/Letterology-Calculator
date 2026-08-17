import { createFileRoute, Link } from "@tanstack/react-router";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { PageShare } from "@/components/letterology/PageShare";
import { familyEnglish } from "@/lib/stoicheia/family";
import { horaOf, HORAE } from "@/lib/stoicheia/horae";
import { horaPath, letterFromMark, markOf } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/stoicheia/horae_/$mark")({
  loader: ({ params }) => {
    const letter = letterFromMark(params.mark);
    return {
      letter,
      hora: letter ? horaOf(letter) : null,
      portrait: letter ? portraitOf(letter) : null,
      mark: params.mark,
    };
  },
  head: ({ loaderData }) => {
    const hora = loaderData?.hora;
    const portrait = loaderData?.portrait;
    if (!hora || !portrait) {
      return pageCardMeta({
        title: "Hours",
        description: "Twenty-four hours. Night first.",
        path: "/stoicheia/horae",
        imagePath: "/og.jpg",
      });
    }
    return pageCardMeta({
      title: `${hora.letter} · ${portrait.book.spoken} · ${hora.noun}`,
      description: `${portrait.book.does}. ${portrait.book.elementLine} ${hora.myth}`,
      path: horaPath(hora.letter),
      imagePath: `/og/stoicheia-hora-${markOf(hora.letter)}.jpg`,
    });
  },
  component: HoraPage,
});

function HoraPage() {
  const { hora, mark, portrait } = Route.useLoaderData();
  if (!hora || !portrait) {
    return (
      <StoicheiaFrame current="Hours">
        <h1 className="font-display text-4xl text-ink">That is not one of the twenty-four</h1>
        <p className="mt-3 text-ink/80">Use the marks a, b, g … w. TH is th, Φ is ph.</p>
        <p className="mt-6">
          <Link to="/stoicheia/horae" className="font-display text-xs tracking-[0.14em] text-primary uppercase">
            Back to the hours
          </Link>
        </p>
      </StoicheiaFrame>
    );
  }

  const index = HORAE.findIndex((item) => item.letter === hora.letter);
  const prev = HORAE[(index + 23) % 24];
  const next = HORAE[(index + 1) % 24];

  return (
    <StoicheiaFrame current="Hours">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
          {hora.watch === "night" ? "night watch" : "day watch"} · {familyEnglish(hora.letter)} ·{" "}
          {portrait.book.element}
        </p>
        <h1 className="mt-2 font-display text-5xl text-ink">
          {hora.letter} · {portrait.book.spoken}
        </h1>
        <p className="mt-2 font-display text-2xl text-ink/80">{hora.noun}</p>
        <p className="mt-2 text-sm text-muted">
          {portrait.book.greekName} · {hora.greek} · {hora.realm}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/80">{portrait.glance}</p>
        <PageShare
          path={horaPath(hora.letter)}
          caption={`${hora.letter} · ${portrait.book.spoken} · ${hora.noun}\n${portrait.book.does}`}
          imagePath={`/og/stoicheia-hora-${mark}.jpg`}
        />
      </header>

      <div className="mt-8 max-w-3xl">
        <LetterBookView portrait={portrait} />
      </div>

      <section className="mt-8 max-w-3xl space-y-4 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">The hour it keeps</p>
        <p className="mt-2 leading-relaxed text-ink/90">{hora.myth}</p>
        <p className="text-sm text-ink/80">Gift: {hora.gift}</p>
        <p className="text-sm text-ink/70">When it fails: {hora.shadow}</p>
        <p className="font-display text-ink">{hora.invitation}</p>
        <p className="text-sm text-muted">{hora.cult}</p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Related</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hora.kin.map((letter) => (
              <Link
                key={letter}
                to="/stoicheia/horae/$mark"
                params={{ mark: markOf(letter) }}
                className="inline-flex h-10 items-center rounded-md bg-bg px-3 font-display text-ink shadow-[var(--shadow-border)]"
              >
                {letter} · {horaOf(letter).noun}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Strife-pair</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hora.eris.map((letter) => (
              <Link
                key={letter}
                to="/stoicheia/horae/$mark"
                params={{ mark: markOf(letter) }}
                className="inline-flex h-10 items-center rounded-md bg-bg px-3 font-display text-ink shadow-[var(--shadow-border)]"
              >
                {letter} · {horaOf(letter).noun}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <nav className="mt-10 flex flex-wrap items-center justify-between gap-3">
        {prev ? (
          <Link
            to="/stoicheia/horae/$mark"
            params={{ mark: markOf(prev.letter) }}
            className="font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            ← {prev.letter} {prev.noun}
          </Link>
        ) : null}
        <Link to="/stoicheia/horae" className="font-display text-xs tracking-[0.14em] text-muted uppercase">
          All hours
        </Link>
        {next ? (
          <Link
            to="/stoicheia/horae/$mark"
            params={{ mark: markOf(next.letter) }}
            className="font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            {next.letter} {next.noun} →
          </Link>
        ) : null}
      </nav>
    </StoicheiaFrame>
  );
}
