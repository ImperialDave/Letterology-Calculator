import type { BrainReading } from "@/lib/letterology/brain";

export function BrainCertificate({ reading }: { reading: BrainReading }) {
  return (
    <section
      id="brain-certificate"
      className="relative mx-auto max-w-xl rounded-xl bg-raised p-6 text-ink shadow-[var(--shadow-border)] sm:p-8"
    >
      <span className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t border-l border-primary/40" />
      <span className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t border-r border-primary/40" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-primary/40" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-primary/40" />
      <p className="text-center font-display text-[0.65rem] tracking-[0.28em] text-primary uppercase">CC33</p>
      <p className="mt-2 text-center font-display text-xs tracking-[0.2em] text-muted uppercase">
        Certificate of Looking
      </p>
      <h2 className="mt-5 text-center font-display text-3xl leading-tight text-ink">{reading.name}</h2>
      <p className="mt-2 text-center font-display text-xl text-primary">{reading.title}</p>
      <p className="mt-2 text-center font-display text-sm text-ink/80">{reading.pattern}</p>
      <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-ink/85">{reading.headline}</p>
      <p className="mt-4 text-center font-display text-3xl text-primary">{reading.grade}</p>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-muted">{reading.gradeCaption}</p>
      <ul className="mt-6 space-y-2">
        {reading.domains.map((row) => (
          <li key={row.id} className="flex items-baseline justify-between gap-3 border-t border-ink/10 pt-2 text-sm">
            <span className="font-display text-ink">
              {row.name}
              <span className="ml-2 text-muted">{row.louderName}</span>
            </span>
            <span className="font-display text-primary">{row.markName}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        {reading.aspects.map((row) => (
          <li key={row.id} className="flex justify-between gap-2">
            <span>{row.name}</span>
            <span className="font-display text-ink">{row.markName}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm leading-relaxed text-ink/85">{reading.invitation}</p>
      <img
        src="/seal.jpg"
        alt=""
        width={56}
        height={56}
        className="mx-auto mt-5 size-14 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
      />
      <p className="mt-4 text-center font-display text-[0.65rem] tracking-[0.18em] text-muted uppercase">
        Certified by CC33 · letterology.club
      </p>
      <p className="mt-2 text-center text-xs text-muted">This is a portrait, not a fate.</p>
    </section>
  );
}
