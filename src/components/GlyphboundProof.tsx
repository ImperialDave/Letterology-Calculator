import type { GameEngine } from "@/glyphbound/engine";
import { listLedgers } from "@/glyphbound/levels";
import { STAGE_COUNT } from "@/glyphbound/types";

export function GlyphboundProof({
  game,
  onClose,
}: {
  game: () => GameEngine | null;
  onClose: () => void;
}) {
  const g = game();
  const ledgers = listLedgers();
  const stageId = g?.stage ?? "hub";
  const proof = g?.proof ?? false;
  const god = g?.debugGod ?? false;
  const kit = g?.debugKit ?? true;
  const write = g?.debugWrite ?? false;

  const jump = (id: string) => {
    g?.proofEnter(id);
    onClose();
  };

  return (
    <div
      data-ui="proof"
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-bg/80 px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-[max(0.8rem,env(safe-area-inset-top))] sm:items-center"
    >
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent">Proof desk</p>
            <h2 className="font-display text-2xl text-fg">Open any ledger</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              A proof copy. Full kit by default, campaign page left on the desk unless you choose to write.
            </p>
          </div>
          <button
            type="button"
            className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-fg"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          <Toggle on={god} label={god ? "God on" : "God off"} onClick={() => g?.toggleGod()} />
          <Toggle on={kit} label={kit ? "Full kit" : "Campaign kit"} onClick={() => g?.toggleDebugKit()} />
          <Toggle on={write} label={write ? "Write save" : "No save"} onClick={() => g?.toggleDebugWrite()} />
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm text-fg" onClick={() => g?.proofFill()}>
            Fill
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm text-fg" onClick={() => g?.proofKill(false)}>
            Clear digits
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm text-fg" onClick={() => g?.proofKill(true)}>
            Slay warden
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm text-fg" onClick={() => g?.toggleMute()}>
            {g?.audio.muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm text-fg" onClick={() => g?.toggleFps()}>
            FPS
          </button>
          {proof && (
            <button type="button" className="h-9 rounded-md border border-accent/40 px-3 text-sm text-accent" onClick={() => { g?.leaveProof(); onClose(); }}>
              Leave proof
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {ledgers.map((l) => {
              const active = l.id === stageId;
              const remainder = l.index >= 30;
              return (
                <button
                  key={l.id}
                  type="button"
                  data-ui={`proof-${l.id}`}
                  className={`h-11 truncate rounded-md border px-2 text-left text-sm ${
                    active
                      ? "border-accent bg-accent/15 text-fg"
                      : remainder
                        ? "border-border bg-elevated/70 text-fg"
                        : "border-border/80 text-muted"
                  }`}
                  onClick={() => jump(l.id)}
                >
                  <span className="block truncate font-medium text-fg">{l.index === 0 ? "Hub" : `${l.index}`}</span>
                  <span className="block truncate text-[11px] text-muted">{l.name}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-subtle">{STAGE_COUNT} ledgers plus the stacks. Remainder begins at 30.</p>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`h-9 rounded-md border px-3 text-sm ${on ? "border-accent/50 bg-accent/15 text-fg" : "border-border text-muted"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
