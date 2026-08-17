import { createFileRoute, Link } from "@tanstack/react-router";
import { NightWheel } from "@/components/stoicheia/NightWheel";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { bookGlance } from "@/lib/stoicheia/book";
import { HORAE } from "@/lib/stoicheia/horae";
import { markOf } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/stoicheia/horae")({
  head: () =>
    pageCardMeta({
      title: "The Horae",
      description: "Twenty-four hours. Night first. Twelve night offices, twelve Olympian day-faces.",
      path: "/stoicheia/horae",
      imagePath: "/og.jpg",
    }),
  component: HoraePage,
});

function HoraePage() {
  const night = HORAE.filter((item) => item.watch === "night");
  const day = HORAE.filter((item) => item.watch === "day");
  return (
    <StoicheiaFrame current="Hours">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">night first</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The twenty-four hours</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          The civic day begins at sunset. The first twelve letters keep the night offices.
          The next twelve keep the Olympians walking with Helios. Each mark is a sound,
          an hour, and a number — not a personality type. This is not the Latin circle.
          There is no twenty-fifth or twenty-sixth seat.
        </p>
      </header>
      <div className="mt-10">
        <NightWheel />
      </div>
      <Watch title="Night" items={night} />
      <Watch title="Day" items={day} />
    </StoicheiaFrame>
  );
}

function Watch({ title, items }: { title: string; items: typeof HORAE }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xs tracking-[0.18em] text-muted uppercase">{title}</h2>
      <ul className="mt-4 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)] sm:px-7">
        {items.map((hora) => {
          const portrait = portraitOf(hora.letter);
          return (
          <li key={hora.letter} className="py-6">
            <p className="font-display text-3xl text-ink">
              <Link
                to="/stoicheia/horae/$mark"
                params={{ mark: markOf(hora.letter) }}
                className="hover:text-primary"
              >
                {hora.letter} · {portrait.book.spoken} · {hora.noun}
              </Link>
            </p>
            <p className="mt-1 text-sm text-muted">
              {portrait.book.greekName} · {hora.greek} · {hora.realm} · {portrait.book.element} ·{" "}
              {portrait.milesianSpell}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{bookGlance(hora.letter)}</p>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{hora.myth}</p>
            <p className="mt-2 text-sm text-ink/80">Gift: {hora.gift}</p>
            <p className="mt-1 text-sm text-ink/70">When it fails: {hora.shadow}</p>
            <p className="mt-2 text-sm text-ink/75">{hora.invitation}</p>
            <p className="mt-2 text-xs text-muted">
              Related {hora.kin.join(" · ")} · strife {hora.eris.join(" · ")} · {hora.cult}
            </p>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
