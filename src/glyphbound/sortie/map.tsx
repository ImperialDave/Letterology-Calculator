import { MISSIONS, unlockedIds, type MissionDef } from "./missions";

export function RegisterMap({
  cleared,
  proofs,
  forks = [],
  onPick,
  onLeave,
  leaveLabel,
}: {
  cleared: string[];
  proofs: string[];
  forks?: string[];
  onPick: (m: MissionDef) => void;
  onLeave: () => void;
  leaveLabel: string;
}) {
  const open = unlockedIds(cleared, proofs, forks);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#121018] text-[#f4f0e4]">
      <p className="text-[11px] uppercase tracking-[0.4em] text-[#e8d48a]">Drop Cap Sortie</p>
      <h1 className="font-display text-5xl">The Register</h1>
      <p className="mt-2 max-w-md px-6 text-center text-sm text-[#c9b896]">
        Letters on the wing. Lizards in the count. Dualis waits at the Press.
      </p>
      <div className="mt-8 grid w-full max-w-xl gap-2 px-5">
        {MISSIONS.map((m) => {
          const locked = !open.has(m.id);
          const proof = proofs.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              disabled={locked}
              className="rounded-md border border-[#f4f0e4]/20 bg-[#1a1814] px-4 py-3 text-left disabled:opacity-35"
              onPointerUp={(e) => {
                if (locked) return;
                e.stopPropagation();
                onPick(m);
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#5ee0c0]">
                {m.roman} {proof ? "· Proof" : cleared.includes(m.id) ? "· written" : ""}
              </p>
              <p className="font-display text-2xl">{m.name}</p>
              <p className="text-sm text-[#c9b896]">{locked ? "Still counted shut." : m.blurb}</p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-6 h-11 rounded-md border border-[#f4f0e4]/40 px-4 text-sm"
        onPointerUp={(e) => {
          e.stopPropagation();
          onLeave();
        }}
      >
        {leaveLabel}
      </button>
    </div>
  );
}
