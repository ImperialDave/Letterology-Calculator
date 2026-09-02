import type { SortieState } from "./sim";
import { HULL_MAX } from "./sim";

export function SortieHud({
  s,
  best,
  onRetry,
  onTitle,
  onResume,
}: {
  s: SortieState;
  best: number;
  onRetry: () => void;
  onTitle: () => void;
  onResume: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-display text-[#f4f0e4]">
      <div className="absolute left-3 top-3 text-[11px] uppercase tracking-[0.28em] text-[#e8d48a] drop-shadow-[0_2px_8px_#000]">
        Lower Case Sky
      </div>
      <div className="absolute right-3 top-3 text-right text-sm tabular-nums drop-shadow-[0_2px_8px_#000]">
        <p className="text-[#e8d48a]">{s.score}</p>
        <p className="text-[10px] text-[#c9b896]">best {best}</p>
      </div>
      <div className="absolute bottom-3 left-3 flex gap-1">
        {Array.from({ length: HULL_MAX }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-5 rounded-sm border border-[#e8d48a]/50"
            style={{ background: i < s.hull ? "#5ee0c0" : "transparent" }}
          />
        ))}
      </div>
      <div className="absolute bottom-3 right-3 h-1.5 w-28 overflow-hidden rounded-sm border border-[#e8d48a]/40">
        <div className="h-full bg-[#e8d48a]" style={{ width: `${Math.min(100, (s.charge / 0.6) * 100)}%` }} />
      </div>
      {s.radio && (
        <div className="absolute bottom-10 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 rounded-md border border-[#e8d48a]/30 bg-[#121018]/80 px-3 py-2 text-center text-sm">
          <span className="mr-2 uppercase tracking-[0.2em] text-[#5ee0c0]">{s.radio.who}</span>
          {s.radio.text}
        </div>
      )}
      {s.lockId >= 0 && s.charge >= 0.2 && (
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8d48a]" />
      )}
      <Radar s={s} />
      {(s.mode === "win" || s.mode === "dead" || s.mode === "pause") && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-[#07080c]/70">
          <p className="font-display text-4xl text-[#f4f0e4]">
            {s.mode === "win" ? "Press clear" : s.mode === "dead" ? "Hull gone" : "Hold"}
          </p>
          <p className="mt-2 text-[#e8d48a]">{s.score} scored</p>
          <div className="mt-5 flex gap-2">
            {s.mode === "pause" && (
              <button type="button" className="h-11 rounded-md bg-[#f4f0e4] px-4 text-[#121018]" onClick={onResume}>
                Resume
              </button>
            )}
            <button type="button" className="h-11 rounded-md bg-[#5ee0c0] px-4 text-[#121018]" onClick={onRetry}>
              Fly again
            </button>
            <button type="button" className="h-11 rounded-md border border-[#f4f0e4]/40 px-4" onClick={onTitle}>
              Title
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Radar({ s }: { s: SortieState }) {
  const scale = 52 / 420;
  const px = 56 + s.x * scale;
  const pz = 56 + s.z * scale;
  const dual = s.enemies.find((e) => e.kind === "dualis" && e.alive);
  return (
    <svg className="absolute right-3 top-16 h-28 w-28 opacity-80" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r="52" fill="#121018" stroke="#e8d48a" strokeWidth="1" />
      <circle cx={px} cy={pz} r="3" fill="#5ee0c0" />
      {dual && <circle cx={56 + dual.x * scale} cy={56 + dual.z * scale} r="4" fill="#d45a4a" />}
    </svg>
  );
}

export function TouchPads({
  onStick,
  onFire,
  onBoost,
  onBrake,
}: {
  onStick: (x: number, y: number) => void;
  onFire: (v: boolean) => void;
  onBoost: (v: boolean) => void;
  onBrake: (v: boolean) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 md:hidden">
      <div
        className="pointer-events-auto absolute bottom-8 left-6 h-28 w-28 rounded-full border border-[#f4f0e4]/30 bg-[#121018]/40"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onStick((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
        }}
        onPointerUp={() => onStick(0, 0)}
        onPointerCancel={() => onStick(0, 0)}
      />
      <button
        type="button"
        className="pointer-events-auto absolute bottom-10 right-6 h-16 w-16 rounded-full bg-[#5ee0c0] text-sm text-[#121018]"
        onPointerDown={() => onFire(true)}
        onPointerUp={() => onFire(false)}
        onPointerCancel={() => onFire(false)}
      >
        Fire
      </button>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-28 right-8 h-11 rounded-md border border-[#e8d48a]/50 px-3 text-[#e8d48a]"
        onPointerDown={() => onBoost(true)}
        onPointerUp={() => onBoost(false)}
      >
        Boost
      </button>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-28 right-28 h-11 rounded-md border border-[#f4f0e4]/40 px-3"
        onPointerDown={() => onBrake(true)}
        onPointerUp={() => onBrake(false)}
      >
        Brake
      </button>
    </div>
  );
}
