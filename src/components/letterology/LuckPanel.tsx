import { houseOf } from "@/lib/letterology/archetypes";
import type { LuckReading } from "@/lib/letterology/luck";
import { cn } from "@/lib/utils";

export function LuckPanel({ luck }: { luck: LuckReading }) {
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            Today's luck · {luck.weekdayName} · {luck.charge === "solar" ? "Solar" : "Lunar"}
          </p>
          <h3 className="mt-1 font-display text-3xl text-ink">{luck.verdict}</h3>
        </div>
        <p className="font-display text-5xl tabular-nums leading-none text-primary">{luck.score}</p>
      </header>

      <p className="max-w-3xl leading-relaxed text-ink/90">{luck.weather}</p>
      <p className="max-w-3xl text-ink">{luck.invitation}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <CounselCard kicker="Do this" body={luck.counsel.do} tone="warm" />
        <CounselCard kicker="Wait on" body={luck.counsel.wait} tone="contrary" />
        <CounselCard kicker="Ask" body={luck.counsel.ask} tone="ink" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CurrentRow label="Favorable currents" letters={luck.favorable} hint="These glyphs run warm. Names and acts that carry them find doors ajar." />
        <CurrentRow label="Contrary currents" letters={luck.contrary} hint="These glyphs withdraw. Proceed gently where they lead." />
      </div>

      <p className="text-sm text-muted">{luck.why}</p>
    </section>
  );
}

function CounselCard({
  kicker,
  body,
  tone,
}: {
  kicker: string;
  body: string;
  tone: "warm" | "contrary" | "ink";
}) {
  return (
    <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
      <p
        className={cn(
          "font-display text-xs tracking-[0.16em] uppercase",
          tone === "warm" && "text-primary",
          tone === "contrary" && "text-muted",
          tone === "ink" && "text-muted",
        )}
      >
        {kicker}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/90">{body}</p>
    </div>
  );
}

function CurrentRow({ label, letters, hint }: { label: string; letters: string[]; hint: string }) {
  return (
    <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <p className="mt-2 font-display text-lg text-ink">
        {letters.map((letter) => `${letter} ${houseOf(letter).noun}`).join(" · ")}
      </p>
    </div>
  );
}
