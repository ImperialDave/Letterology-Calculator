import { fittedKits, KIT_BY_CLEAR, kitOf, romanRank, type KitRanks } from "./kits";
import { lockCopy, MISSIONS, nextRequired, unlockedIds, type MissionDef } from "./missions";
import { CAMPAIGN, CREW_LINE, crewOf } from "./story";

export function RegisterMap({
  cleared,
  proofs,
  forks = [],
  kits = {},
  onPick,
  onLeave,
  leaveLabel,
}: {
  cleared: string[];
  proofs: string[];
  forks?: string[];
  kits?: KitRanks;
  onPick: (m: MissionDef) => void;
  onLeave: () => void;
  leaveLabel: string;
}) {
  const open = unlockedIds(cleared, proofs, forks);
  const next = nextRequired(cleared);
  const caseRow = fittedKits(kits);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#121018] text-[#f4f0e4]">
      <p className="text-[11px] uppercase tracking-[0.4em] text-[#e8d48a]">StarWords</p>
      <h1 className="font-display text-5xl">The Register</h1>
      <p className="mt-2 max-w-md px-6 text-center text-sm text-[#c9b896]">{CAMPAIGN}</p>
      <div className="mt-4 flex justify-center gap-3">
        {CREW_LINE.map((id) => {
          const crew = crewOf(id);
          return (
            <img
              key={id}
              src={crew.portrait}
              alt={crew.title}
              title={`${crew.title} — ${crew.job}`}
              width={48}
              height={48}
              className="size-12 rounded-md object-cover outline outline-1 -outline-offset-1"
              style={{ outlineColor: crew.color }}
            />
          );
        })}
      </div>
      {caseRow.length > 0 && (
        <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2 px-5">
          {caseRow.map((k) => (
            <span
              key={k.id}
              className="rounded-sm border border-[#e8d48a]/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#e8d48a]"
            >
              {k.name} {k.roman}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6 grid w-full max-w-xl gap-2 px-5">
        {MISSIONS.map((m) => {
          const locked = !open.has(m.id);
          const proof = proofs.includes(m.id);
          const piece = KIT_BY_CLEAR[m.id];
          const owned = piece ? kitOf(piece) : undefined;
          const rank = piece ? romanRank(kits[piece] ?? 0) : "";
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
              onClick={(e) => {
                if (locked) return;
                e.stopPropagation();
                onPick(m);
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#5ee0c0]">
                {m.roman}
                {proof ? " · Proof" : cleared.includes(m.id) ? " · written" : ""}
                {!locked && next === m.id ? " · next" : ""}
              </p>
              <p className="font-display text-2xl">{m.name}</p>
              <p className="text-sm text-[#c9b896]">{locked ? lockCopy(m.id) : m.blurb}</p>
              {!locked && owned && rank ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#e8d48a]">
                  {owned.name} {rank}
                </p>
              ) : null}
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
        onClick={(e) => {
          e.stopPropagation();
          onLeave();
        }}
      >
        {leaveLabel}
      </button>
    </div>
  );
}
