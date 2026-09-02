import { useRef, useState, type PointerEvent } from "react";
import type { SortieState } from "./sim";
import { CHARGE_LOCK, HULL_MAX, INNER_R, OUTER_R } from "./sim";
import { analogFromDelta } from "./stick";
import { missionById } from "./missions";
import { crewOf } from "./story";

const SORTIE_CONTROLS: { keys: string; does: string }[] = [
  { keys: "A D  ← →", does: "Stick left / right. Bank. On a rail, sit in the window." },
  { keys: "W S  ↑ ↓", does: "Pull-up / dive." },
  { keys: "Space / click", does: "Tap laser. Hold charge. Release bolt." },
  { keys: "Shift", does: "Boost." },
  { keys: "Ctrl", does: "Brake." },
  { keys: "B", does: "Em-dash. Tap again to pop." },
  { keys: "Q / E", does: "Barrel (eats orbs). One tap." },
  { keys: "Boost + W", does: "Somersault." },
  { keys: "Brake + W", does: "U-turn (all-range)." },
  { keys: "Mouse", does: "Aims the squares. Click takeoff to lock." },
  { keys: "Tab", does: "Break lock." },
  { keys: "V", does: "Cockpit cam." },
  { keys: "Esc", does: "Pause / resume." },
  { keys: "Two squares", does: "Sit a lizard in both. Hold fire to lock. Lasers go through the tunnel." },
];

export function SortieHud({
  s,
  best,
  onRetry,
  onRegister,
  onResume,
}: {
  s: SortieState;
  best: number;
  onRetry: () => void;
  onRegister: () => void;
  onResume: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-display text-[#f4f0e4]">
      <span className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-[#e8d48a]/70" />
      <span className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-[#e8d48a]/70" />
      <span className="absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-[#e8d48a]/70" />
      <span className="absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-[#e8d48a]/70" />
      <div className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.28em] text-[#e8d48a] drop-shadow-[0_2px_8px_#000]">
        <p>C-wing</p>
        <p className="mt-1 tracking-[0.18em] text-[#f4f0e4]">{s.missionName}</p>
      </div>
      <div className="absolute right-5 top-5 text-right text-sm tabular-nums drop-shadow-[0_2px_8px_#000]">
        <p style={{ color: s.proofLive ? "#e8d48a" : "#f4f0e4" }}>{s.hits}</p>
        <p className="text-[10px] text-[#c9b896]">
          hits · Proof {s.medal} · {s.score} · best {best}
        </p>
        <p className="text-[10px] text-[#5ee0c0]">
          Stem {["I", "II", "III"][s.stem] ?? "I"} · dash {s.bombs}
        </p>
      </div>
      <div className="absolute bottom-6 left-6 flex gap-1">
        {Array.from({ length: HULL_MAX }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-5 rounded-sm border border-[#e8d48a]/50"
            style={{ background: i < s.hull ? "#5ee0c0" : "transparent" }}
          />
        ))}
        <span className="ml-2 flex gap-0.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="h-2.5 w-3 rounded-sm border border-[#5ee0c0]/50"
              style={{ background: i < s.wings ? "#5ee0c0" : "transparent" }}
            />
          ))}
        </span>
      </div>
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1">
        <div className="h-1.5 w-28 overflow-hidden rounded-sm border border-[#e8d48a]/40">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, s.boostMeter * 100)}%`,
              background: s.boostMeter < 0.2 ? "#d45a4a" : "#e8d48a",
            }}
          />
        </div>
        <div className="h-1 w-28 overflow-hidden rounded-sm border border-[#5ee0c0]/35">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, s.gunHeat * 100)}%`,
              background: s.gunHeat > 0.85 ? "#d45a4a" : "#5ee0c0",
            }}
          />
        </div>
      </div>
      {s.radio && <RadioCall who={s.radio.who} text={s.radio.text} />}
      <Reticle s={s} />
      {s.flight === "allrange" && <Radar s={s} />}
      {(s.mode === "win" || s.mode === "dead" || s.mode === "pause") && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-[#07080c]/70">
          <p className="font-display text-4xl text-[#f4f0e4]">
            {s.mode === "win" ? (s.proofLive ? "Proof" : "Written") : s.mode === "dead" ? "Hull gone" : "Hold"}
          </p>
          <p className="mt-2 text-[#e8d48a]">{s.score} scored · {s.hits} hits</p>
          {s.mode === "win" ? (
            <p className="mt-3 max-w-md px-6 text-center text-sm leading-relaxed text-[#c9b896]">
              {missionById(s.missionId).debrief}
            </p>
          ) : null}
          {s.mode === "dead" ? (
            <p className="mt-3 max-w-md px-6 text-center text-sm text-[#c9b896]">
              The census took a bite. Wake at the Register.
            </p>
          ) : null}
          {s.mode === "pause" && (
            <dl className="mt-5 grid max-h-[42vh] w-[min(94%,36rem)] grid-cols-1 gap-x-8 gap-y-1.5 overflow-y-auto px-4 text-left text-[12px] leading-snug sm:grid-cols-2">
              {SORTIE_CONTROLS.map((row) => (
                <div key={row.keys} className="flex gap-3 border-b border-[#e8d48a]/15 py-1">
                  <dt className="w-[9.5rem] shrink-0 font-display tracking-wide text-[#5ee0c0]">{row.keys}</dt>
                  <dd className="text-[#f4f0e4]/90">{row.does}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-5 flex gap-2">
            {s.mode === "pause" && (
              <button
                type="button"
                className="h-11 rounded-md bg-[#f4f0e4] px-4 text-[#121018]"
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onResume();
                }}
              >
                Resume
              </button>
            )}
            <button
              type="button"
              className="h-11 rounded-md bg-[#5ee0c0] px-4 text-[#121018]"
              onPointerUp={(e) => {
                e.stopPropagation();
                onRetry();
              }}
            >
              Fly again
            </button>
            <button
              type="button"
              className="h-11 rounded-md border border-[#f4f0e4]/40 px-4"
              onPointerUp={(e) => {
                e.stopPropagation();
                onRegister();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRegister();
              }}
            >
              Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RadioCall({ who, text }: { who: string; text: string }) {
  const crew = crewOf(who);
  return (
    <div className="absolute bottom-10 left-1/2 flex w-[min(92%,30rem)] -translate-x-1/2 items-center gap-3 rounded-md border border-[#e8d48a]/30 bg-[#121018]/88 px-3 py-2">
      <img
        src={crew.portrait}
        alt=""
        width={48}
        height={48}
        className="sw-talk h-12 w-12 shrink-0 rounded-md object-cover outline outline-1 -outline-offset-1"
        style={{ outlineColor: crew.color }}
      />
      <div className="min-w-0 text-left">
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: crew.color }}>
          {crew.title}
        </p>
        <p className="text-sm leading-snug text-[#f4f0e4]">{text}</p>
      </div>
    </div>
  );
}

function Reticle({ s }: { s: SortieState }) {
  if (s.mode !== "play") return null;
  const hard = s.lockHard;
  const soft = s.lockId >= 0 && s.lockOn;
  const charging = s.charge >= CHARGE_LOCK * 0.35;
  const outerC = hard ? "#d45a4a" : charging ? "#e8d48a" : "rgba(232,212,138,0.92)";
  const innerC = hard ? "#d45a4a" : charging ? "#e8d48a" : "rgba(94,224,192,0.95)";
  const cx = 50 + s.sightX * 50;
  const cy = 50 - s.sightY * 50;
  const ix = 50 + s.innerSx * 50;
  const iy = 50 - s.innerSy * 50;
  const off = s.lockId >= 0 && (Math.abs(s.lockSx) > 1.02 || Math.abs(s.lockSy) > 1.02);
  const lead = soft && Math.hypot(s.leadSx - s.lockSx, s.leadSy - s.lockSy) > 0.035;
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${cx}%`,
          top: `${cy}%`,
          width: `${OUTER_R * 100}vh`,
          height: `${OUTER_R * 100}vh`,
          border: `2px solid ${outerC}`,
        }}
      />
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${ix}%`,
          top: `${iy}%`,
          width: `${INNER_R * 100}vh`,
          height: `${INNER_R * 100}vh`,
          border: `1.5px solid ${innerC}`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full border border-[#e8d48a]/55"
          style={{
            clipPath: `inset(${100 - Math.min(100, (s.charge / CHARGE_LOCK) * 100)}% 0 0 0)`,
            opacity: s.charge > 0.05 ? 1 : 0.22,
          }}
        />
        {soft && (
          <span
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: innerC }}
          >
            {hard ? "LOCK" : "TGT"}
          </span>
        )}
      </div>
      <div
        className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8d48a]"
        style={{ left: `${cx}%`, top: `${cy}%` }}
      />
      {s.incoming > 0 && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] text-[#d45a4a]">
          Break
        </div>
      )}
      {lead && (
        <div
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8d48a]"
          style={{ left: `${50 + s.leadSx * 50}%`, top: `${50 - s.leadSy * 50}%` }}
        />
      )}
      {off && (
        <div
          className="absolute h-0 w-0 border-x-[6px] border-x-transparent border-b-[10px] border-b-[#e8d48a]"
          style={{
            left: `${Math.max(8, Math.min(92, 50 + Math.sign(s.lockSx) * 42))}%`,
            top: `${Math.max(10, Math.min(88, 50 - Math.sign(s.lockSy) * 36))}%`,
          }}
        />
      )}
    </div>
  );
}

function Radar({ s }: { s: SortieState }) {
  const scale = 52 / 420;
  const cy = Math.cos(s.yaw);
  const sy = Math.sin(s.yaw);
  const toRadar = (x: number, z: number) => {
    const dx = x - s.x;
    const dz = z - s.z;
    const right = dx * cy - dz * sy;
    const fwd = -dx * sy - dz * cy;
    return { cx: 56 + right * scale, cy: 56 - fwd * scale };
  };
  return (
    <svg className="absolute right-5 top-[4.6rem] h-28 w-28 opacity-85" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r="52" fill="#121018" stroke="#e8d48a" strokeWidth="1.4" />
      <circle cx="56" cy="56" r="26" fill="none" stroke="#5ee0c0" strokeWidth="0.6" opacity="0.45" />
      <line x1="56" y1="8" x2="56" y2="104" stroke="#e8d48a" strokeWidth="0.4" opacity="0.35" />
      <line x1="8" y1="56" x2="104" y2="56" stroke="#e8d48a" strokeWidth="0.4" opacity="0.35" />
      {s.enemies
        .filter((e) => e.alive)
        .map((e) => {
          const p = toRadar(e.x, e.z);
          return (
            <circle
              key={e.id}
              cx={p.cx}
              cy={p.cy}
              r={e.kind === "dualis" || e.kind === "mothership" || e.kind === "mech" ? 4 : 2}
              fill={e.kind === "dualis" ? "#e8d48a" : "#d45a4a"}
            />
          );
        })}
      <circle cx="56" cy="56" r="3" fill="#5ee0c0" />
    </svg>
  );
}

export function TouchPads({
  onStick,
  onAim,
  onFire,
  onBoost,
  onBrake,
  onBarrel,
  onBomb,
}: {
  onStick: (roll: number, pitch: number) => void;
  onAim?: (x: number, y: number) => void;
  onFire: (v: boolean) => void;
  onBoost: (v: boolean) => void;
  onBrake: (v: boolean) => void;
  onBarrel: () => void;
  onBomb?: () => void;
}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const aimOrigin = useRef<{ x: number; y: number; id: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false, ox: 0.22, oy: 0.72 });
  const [aimKnob, setAimKnob] = useState({ x: 0, y: 0, on: false });
  const radius = 64;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const o = origin.current;
    if (!o || o.id !== e.pointerId) return;
    const a = analogFromDelta(e.clientX - o.x, e.clientY - o.y, radius);
    onStick(a.roll, a.pitch);
    const zone = e.currentTarget.getBoundingClientRect();
    setKnob({
      x: a.kx,
      y: a.ky,
      on: true,
      ox: (o.x - zone.left) / zone.width,
      oy: (o.y - zone.top) / zone.height,
    });
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (origin.current?.id !== e.pointerId) return;
    origin.current = null;
    onStick(0, 0);
    setKnob((k) => ({ ...k, x: 0, y: 0, on: false }));
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[15] [@media(hover:hover)_and_(pointer:fine)]:hidden">
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[58%] w-[46%]"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
          const zone = e.currentTarget.getBoundingClientRect();
          setKnob({
            x: 0,
            y: 0,
            on: true,
            ox: (e.clientX - zone.left) / zone.width,
            oy: (e.clientY - zone.top) / zone.height,
          });
          onStick(0, 0);
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div
          className="absolute h-[7.2rem] w-[7.2rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f4f0e4]/35 bg-[#121018]/45"
          style={{ left: `${knob.ox * 100}%`, top: `${knob.oy * 100}%` }}
        >
          <span
            className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5ee0c0]/70 bg-[#5ee0c0]/80"
            style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${knob.y * 36}px))` }}
          />
        </div>
      </div>
      {onAim && (
        <div
          className="pointer-events-auto absolute bottom-[22%] right-[26%] h-[34%] w-[30%]"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            aimOrigin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
            e.currentTarget.setPointerCapture(e.pointerId);
            setAimKnob({ x: 0, y: 0, on: true });
            onAim(0, 0);
          }}
          onPointerMove={(e) => {
            const o = aimOrigin.current;
            if (!o || o.id !== e.pointerId) return;
            const a = analogFromDelta(e.clientX - o.x, e.clientY - o.y, radius);
            onAim(a.kx, -a.ky);
            setAimKnob({ x: a.kx, y: a.ky, on: true });
          }}
          onPointerUp={(e) => {
            if (aimOrigin.current?.id !== e.pointerId) return;
            aimOrigin.current = null;
            onAim(0, 0);
            setAimKnob({ x: 0, y: 0, on: false });
          }}
          onPointerCancel={(e) => {
            if (aimOrigin.current?.id !== e.pointerId) return;
            aimOrigin.current = null;
            onAim(0, 0);
            setAimKnob({ x: 0, y: 0, on: false });
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-[6.4rem] w-[6.4rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8d48a]/40 bg-[#121018]/40">
            <span
              className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8d48a]/70 bg-[#e8d48a]/75"
              style={{ transform: `translate(calc(-50% + ${aimKnob.x * 32}px), calc(-50% + ${aimKnob.y * 32}px))` }}
            />
          </div>
        </div>
      )}
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
      <button
        type="button"
        className="pointer-events-auto absolute bottom-44 right-16 h-11 rounded-md border border-[#5ee0c0]/50 px-3 text-[#5ee0c0]"
        onPointerDown={() => onBarrel()}
      >
        Roll
      </button>
      {onBomb && (
        <button
          type="button"
          className="pointer-events-auto absolute bottom-44 right-36 h-11 rounded-md border border-[#e8d48a]/50 px-3 text-[#e8d48a]"
          onPointerDown={() => onBomb()}
        >
          Dash
        </button>
      )}
    </div>
  );
}
