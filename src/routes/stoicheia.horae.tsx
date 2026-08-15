import { createFileRoute } from "@tanstack/react-router";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { HORAE } from "@/lib/stoicheia/horae";
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
    <StoicheiaFrame current="Horae">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">νυχθήμερον</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The twenty-four hours</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          The civic day begins at sunset. The first twelve stoicheia sit the night offices.
          The next twelve sit the Olympians walking with Helios. This is not the Latin
          circle. There is no twenty-fifth or twenty-sixth seat.
        </p>
      </header>
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
        {items.map((hora) => (
          <li key={hora.letter} className="py-6">
            <p className="font-display text-3xl text-ink">
              {hora.letter} · {hora.noun}
            </p>
            <p className="mt-1 text-sm text-muted">
              {hora.greek} · {hora.realm}
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{hora.myth}</p>
            <p className="mt-2 text-sm text-ink/75">{hora.invitation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
