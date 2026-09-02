import type { GameEngine } from "@/glyphbound/engine";
import { DECADES, decadePlaque } from "@/glyphbound/arcade";
import { beatenLedgers, lastClearedId, nextStageId } from "@/glyphbound/levels";
import { STAGE_COUNT } from "@/glyphbound/types";

const BANDS: { title: string; from: number; to: number }[] = [
  { title: "First Book", from: 1, to: 5 },
  { title: "Unbound Sentence", from: 6, to: 30 },
  { title: "The Remainder", from: 31, to: 60 },
  ...DECADES.map((d) => ({ title: decadePlaque(d.lo), from: d.lo, to: d.hi })),
];

export function GlyphboundReplay({
  game,
  progress,
}: {
  game: () => GameEngine | null;
  progress: number;
}) {
  const g = game();
  const closed = beatenLedgers(progress);
  const last = lastClearedId(progress);
  const lastMeta = closed.find((l) => l.id === last);

  const open = (id: string) => g?.replayEnter(id);

  return (
    <div
      data-ui="replay"
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-bg/80 px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-[max(0.8rem,env(safe-area-inset-top))] sm:items-center"
    >
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent">Last Page</p>
            <h2 className="font-display text-2xl text-fg">Reread a closed ledger</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Closed pages, the next unread, and the Second Century by decade. The Rest of the Book still turns the campaign.
            </p>
          </div>
          <button
            type="button"
            className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-fg"
            onClick={() => g?.closeReplay()}
          >
            Close
          </button>
        </div>

        {progress < STAGE_COUNT && (
          <div className="border-b border-border px-4 py-3">
            <button
              type="button"
              data-ui="replay-next"
              className="flex h-12 w-full items-center justify-between rounded-md border border-accent/40 bg-accent/10 px-3 text-left"
              onClick={() => open(nextStageId(progress))}
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-accent">Next unread</span>
                <span className="font-display text-lg text-fg">
                  {progress + 1}. Walk the Rest of the Book from here
                </span>
              </span>
              <span className="text-sm text-accent">Enter</span>
            </button>
          </div>
        )}

        {last && lastMeta && (
          <div className="border-b border-border px-4 py-3">
            <button
              type="button"
              data-ui="replay-last"
              className="flex h-12 w-full items-center justify-between rounded-md border border-accent/40 bg-accent/10 px-3 text-left"
              onClick={() => open(last)}
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-accent">Most recently closed</span>
                <span className="font-display text-lg text-fg">
                  {lastMeta.index}. {lastMeta.name}
                </span>
              </span>
              <span className="text-sm text-accent">Enter</span>
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {BANDS.map((band) => {
            const rows = closed.filter((l) => l.index >= band.from && l.index <= band.to);
            if (!rows.length) return null;
            return (
              <section key={band.title} className="mb-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-subtle">{band.title}</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {rows.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      data-ui={`replay-${l.id}`}
                      className={`h-12 truncate rounded-md border px-2 text-left ${
                        l.id === last ? "border-accent/50 bg-accent/10" : "border-border bg-elevated/60"
                      }`}
                      onClick={() => open(l.id)}
                    >
                      <span className="block truncate text-sm font-medium text-fg">
                        {l.index}. {l.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted">{l.theme}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-subtle">Esc closes the shelf. Progress stays. The book does not turn.</p>
      </div>
    </div>
  );
}
