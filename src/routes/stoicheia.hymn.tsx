import { createFileRoute } from "@tanstack/react-router";
import { StoicheiaFrame } from "@/components/stoicheia/StoicheiaFrame";
import { CHOIR } from "@/lib/stoicheia/hymn";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/stoicheia/hymn")({
  head: () =>
    pageCardMeta({
      title: "The Hymn",
      description: "Seven vowels. Seven planets. Sung in order, never by weight.",
      path: "/stoicheia/hymn",
      imagePath: "/og.jpg",
    }),
  component: HymnPage,
});

function HymnPage() {
  return (
    <StoicheiaFrame current="Hymn">
      <header className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">φωνήεντα</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">The Choir</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Late antique practice bound the seven Greek vowels to the seven planets. A name’s
          hymn is those vowels in the order they appear. Breath has sequence. We do not weigh
          a song.
        </p>
      </header>
      <ol className="mt-10 divide-y divide-ink/10 rounded-xl bg-raised px-5 shadow-[var(--shadow-border)] sm:px-7">
        {Object.entries(CHOIR).map(([letter, face]) => (
          <li key={letter} className="py-6">
            <p className="font-display text-4xl text-ink">{letter}</p>
            <p className="mt-1 font-display text-xl text-ink">
              {face.face} · {face.god}
            </p>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink/85">{face.line}</p>
          </li>
        ))}
      </ol>
    </StoicheiaFrame>
  );
}
