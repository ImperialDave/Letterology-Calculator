import { useEffect, useRef, useState, type PointerEvent } from "react";
import { aimScreen } from "./cam";
import type { SortieState } from "./sim";
import { CHARGE_LOCK, HULL_MAX, INNER_R, OUTER_R, TGT_FAR, TGT_NEAR, WARN_FAR } from "./sim";
import { analogFromDelta, isTap, TAP_PX, TAP_S } from "./stick";
import { kitOf, romanRank } from "./kits";
import { missionById, objectiveLine } from "./missions";
import { crewOf, endCopy } from "./story";

const SORTIE_CONTROLS: { keys: string; does: string }[] = [
  { keys: "A D  ← →", does: "Stick left / right. Bank. On a rail, sit in the window." },
  { keys: "W S  ↑ ↓", does: "The stick is the tip. W climbs. S dives. The nose holds." },
  { keys: "Space / click", does: "Tap laser. Hold charge. Release bolt." },
  { keys: "Shift", does: "Boost." },
  { keys: "Ctrl", does: "Brake." },
  { keys: "B", does: "Em-dash. Tap again to pop." },
  { keys: "Q / E", does: "Barrel (eats orbs). One tap." },
  { keys: "Boost + W", does: "Climb faster. Full-stick pull + boost loops." },
  { keys: "Brake + W", does: "U-turn (all-range)." },
  { keys: "Mouse", does: "Aims the squares. They hold. Click the sky if Escape drops the lock." },
  { keys: "Phone", does: "Left flies. Right drag aims. Tap writes three. Hold still to charge." },
  { keys: "Tab", does: "Break lock." },
  { keys: "V", does: "Cockpit cam." },
  { keys: "Esc", does: "Pause / resume." },
  { keys: "Two squares", does: "Sit a lizard in both. Hold fire to lock. Lasers go through the tunnel." },
  { keys: "Blue box", does: "The fight. Amber is a warning. Sit the blue in the squares." },
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
  const ended = s.mode === "win" || s.mode === "dead" ? endCopy(s.mode === "win" ? "win" : s.endWhy, s.proofLive) : null;
  const objective = objectiveLine(s);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-display text-[#f4f0e4]">
      <span className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-[#e8d48a]/70" />
      <span className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-[#e8d48a]/70" />
      <span className="absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-[#e8d48a]/70" />
      <span className="absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-[#e8d48a]/70" />
      <div className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.28em] text-[#e8d48a] drop-shadow-[0_2px_8px_#000]">
        <p>C-wing</p>
        <p className="mt-1 tracking-[0.18em] text-[#f4f0e4]">{s.missionName}</p>
        {objective ? (
          <p className="mt-2 max-w-[16rem] text-[10px] normal-case tracking-[0.08em] text-[#c9b896]">{objective}</p>
        ) : null}
      </div>
      <div className="absolute right-5 top-5 text-right text-sm tabular-nums drop-shadow-[0_2px_8px_#000]">
        <p style={{ color: s.proofLive ? "#e8d48a" : "#f4f0e4" }}>{s.hits}</p>
        {s.popT > 0 && (
          <p className="text-[11px] text-[#5ee0c0]" style={{ opacity: Math.min(1, s.popT * 2.4) }}>
            +{s.popN}
          </p>
        )}
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
        <div
          className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-[#07080c]/70"
          onPointerDown={(e) => {
            if (s.mode !== "pause") return;
            if ((e.target as HTMLElement).closest("button")) return;
            e.preventDefault();
            e.stopPropagation();
            onResume();
          }}
        >
          <p className="font-display text-4xl text-[#f4f0e4]">
            {ended ? ended.title : "Hold"}
          </p>
          <p className="mt-2 text-[#e8d48a]">{s.score} scored · {s.hits} hits</p>
          {ended ? (
            <p className="mt-3 max-w-md px-6 text-center text-sm leading-relaxed text-[#c9b896]">
              {ended.line}
            </p>
          ) : null}
          {s.mode === "win" ? (
            <p className="mt-2 max-w-md px-6 text-center text-sm leading-relaxed text-[#c9b896]">
              {missionById(s.missionId).debrief}
            </p>
          ) : null}
          {s.mode === "win" && s.kitGained.length > 0 ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#e8d48a]">
              {s.kitGained
                .map((id) => {
                  const k = kitOf(id);
                  return k ? `${k.name} ${romanRank(s.kitRanks[id] ?? 1)}` : id;
                })
                .join(" · ")}
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
          border: `4px solid ${outerC}`,
          boxShadow: "0 0 0 1.5px rgba(10,18,32,0.7)",
        }}
      />
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${ix}%`,
          top: `${iy}%`,
          width: `${INNER_R * 100}vh`,
          height: `${INNER_R * 100}vh`,
          border: `3px solid ${innerC}`,
          boxShadow: "0 0 0 1.5px rgba(10,18,32,0.7)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full border border-[#e8d48a]/55"
          style={{
            clipPath: `inset(${100 - Math.min(100, (s.charge / CHARGE_LOCK) * 100)}% 0 0 0)`,
            opacity: s.charge > 0.05 ? 1 : 0.22,
          }}
        />
      </div>
      <div
        className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8d48a]"
        style={{ left: `${cx}%`, top: `${cy}%` }}
      />
      <TargetBoxes s={s} />
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
    </div>
  );
}

function TargetBoxes({ s }: { s: SortieState }) {
  const marks = [];
  const chevs: { id: number; z: number; sx: number; sy: number; hot: boolean }[] = [];
  for (const e of s.enemies) {
    if (!e.alive) continue;
    const pip = aimScreen(s, e.x, e.y, e.z);
    if (pip.z < TGT_NEAR || pip.z > WARN_FAR) continue;
    const hot = pip.z <= TGT_FAR && e.kind !== "dualis";
    const warn = pip.z > TGT_FAR || e.kind === "dualis";
    if (!pip.on) {
      if (pip.z < 8) continue;
      chevs.push({ id: e.id, z: pip.z, sx: pip.sx, sy: pip.sy, hot });
      continue;
    }
    if (hot) {
      const locked = e.id === s.lockId && s.lockOn;
      const hard = locked && s.lockHard;
      const color = hard ? "#d45a4a" : "#4aa3ff";
      const px = Math.max(18, Math.min(52, 2800 / pip.z));
      marks.push(
        <div
          key={e.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${50 + pip.sx * 50}%`,
            top: `${50 - pip.sy * 50}%`,
            width: px,
            height: px,
            border: `${hard ? 3.5 : 3}px solid ${color}`,
            boxShadow: `0 0 0 1.5px rgba(10,18,32,0.7)`,
          }}
        >
          {locked && (
            <span
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.18em]"
              style={{ color }}
            >
              {hard ? "LOCK" : "TGT"}
            </span>
          )}
        </div>,
      );
    } else if (warn) {
      const px = Math.max(7, Math.min(14, 2200 / pip.z));
      marks.push(
        <div
          key={e.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse"
          style={{
            left: `${50 + pip.sx * 50}%`,
            top: `${50 - pip.sy * 50}%`,
            width: px,
            height: px,
            border: "2.5px solid #e8a84a",
            boxShadow: "0 0 0 1.5px rgba(10,18,32,0.7)",
            opacity: 0.82,
          }}
        />,
      );
    }
  }
  chevs
    .sort((a, b) => a.z - b.z)
    .slice(0, 4)
    .forEach((c) => {
      const limX = 0.84;
      const limY = 0.78;
      const m = Math.max(Math.abs(c.sx) / limX, Math.abs(c.sy) / limY, 1);
      const sx = c.sx / m;
      const sy = c.sy / m;
      marks.push(
        <div
          key={`c${c.id}`}
          className="absolute h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-x-[5px] border-x-transparent border-b-[8px]"
          style={{
            left: `${50 + sx * 50}%`,
            top: `${50 - sy * 50}%`,
            borderBottomColor: c.hot ? "#4aa3ff" : "#e8a84a",
          }}
        />,
      );
    });
  return <>{marks}</>;
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

function silencePtr(e: PointerEvent<HTMLElement>) {
  e.preventDefault();
  e.stopPropagation();
  const ae = typeof document !== "undefined" ? document.activeElement : null;
  if (ae instanceof HTMLElement && ae !== e.currentTarget) ae.blur();
  e.currentTarget.blur();
}

/** iOS/Android long-press select is tied to touchstart, not pointerdown. */
export function bindNoSelect(el: HTMLElement) {
  const stop = (e: Event) => {
    e.preventDefault();
  };
  el.addEventListener("touchstart", stop, { passive: false });
  el.addEventListener("touchmove", stop, { passive: false });
  el.addEventListener("selectstart", stop);
  el.addEventListener("gesturestart", stop);
  return () => {
    el.removeEventListener("touchstart", stop);
    el.removeEventListener("touchmove", stop);
    el.removeEventListener("selectstart", stop);
    el.removeEventListener("gesturestart", stop);
  };
}

function PadBtn({
  label,
  className,
  hold,
  onHold,
  onTap,
}: {
  label: string;
  className: string;
  hold?: boolean;
  onHold?: (v: boolean) => void;
  onTap?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return bindNoSelect(el);
  }, []);
  const end = () => onHold?.(false);
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      draggable={false}
      aria-label={label}
      className={`gb-pad-btn pointer-events-auto select-none ${className}`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        silencePtr(e);
        e.currentTarget.setPointerCapture(e.pointerId);
        if (hold) onHold?.(true);
        else onTap?.();
      }}
      onPointerUp={(e) => {
        silencePtr(e);
        if (hold) end();
      }}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <span className="pointer-events-none select-none" aria-hidden>
        {label}
      </span>
    </button>
  );
}

export function TouchPads({
  onStick,
  onAim,
  onFire,
  onBurst,
  onBoost,
  onBrake,
  onBarrel,
  onBomb,
}: {
  onStick: (roll: number, pitch: number) => void;
  onAim?: (x: number, y: number) => void;
  onFire: (v: boolean) => void;
  onBurst?: () => void;
  onBoost: (v: boolean) => void;
  onBrake: (v: boolean) => void;
  onBarrel: () => void;
  onBomb?: () => void;
}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const rightPtrs = useRef(
    new Map<number, { x0: number; y0: number; t0: number; role: "pending" | "aim" | "charge"; timer: number }>(),
  );
  const aimId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false, ox: 0.22, oy: 0.72 });
  const [aimKnob, setAimKnob] = useState({ x: 0, y: 0, on: false, ox: 0.78, oy: 0.72 });
  const radius = 64;
  const padRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = padRoot.current;
    if (!el) return;
    return bindNoSelect(el);
  }, []);
  const zoneStyle = {
    touchAction: "none" as const,
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  };

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

  const clearTimer = (p: { timer: number }) => {
    if (p.timer) window.clearTimeout(p.timer);
    p.timer = 0;
  };

  const aimMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = rightPtrs.current.get(e.pointerId);
    if (!p) return;
    const dist = Math.hypot(e.clientX - p.x0, e.clientY - p.y0);
    if (p.role === "pending" && dist >= TAP_PX) {
      clearTimer(p);
      p.role = "aim";
      if (aimId.current == null) aimId.current = e.pointerId;
    }
    if (p.role === "charge" && dist >= TAP_PX) {
      clearTimer(p);
      onFire(false);
      p.role = "aim";
      if (aimId.current == null) aimId.current = e.pointerId;
    }
    if (p.role !== "aim" || aimId.current !== e.pointerId) return;
    const a = analogFromDelta(e.clientX - p.x0, e.clientY - p.y0, radius);
    if (a.mag > 0) onAim?.(a.kx, -a.ky);
    const zone = e.currentTarget.getBoundingClientRect();
    setAimKnob({
      x: a.kx,
      y: a.ky,
      on: true,
      ox: (p.x0 - zone.left) / zone.width,
      oy: (p.y0 - zone.top) / zone.height,
    });
  };
  const aimEnd = (e: PointerEvent<HTMLDivElement>) => {
    const p = rightPtrs.current.get(e.pointerId);
    if (!p) return;
    clearTimer(p);
    const dt = (performance.now() - p.t0) / 1000;
    if (p.role === "pending" && isTap(e.clientX - p.x0, e.clientY - p.y0, dt)) onBurst?.();
    if (p.role === "charge") onFire(false);
    if (aimId.current === e.pointerId) {
      aimId.current = null;
      setAimKnob((k) => ({ ...k, x: 0, y: 0, on: false }));
    }
    rightPtrs.current.delete(e.pointerId);
  };

  return (
    <div
      ref={padRoot}
      className="pointer-events-none absolute inset-0 z-[15] select-none [@media(hover:hover)_and_(pointer:fine)]:hidden"
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
    >
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[62%] w-[48%]"
        style={zoneStyle}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          silencePtr(e);
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
      <div
        className="pointer-events-auto absolute bottom-0 right-0 h-[62%] w-[48%]"
        style={zoneStyle}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          silencePtr(e);
          e.currentTarget.setPointerCapture(e.pointerId);
          const rec = {
            x0: e.clientX,
            y0: e.clientY,
            t0: performance.now(),
            role: "pending" as const,
            timer: window.setTimeout(() => {
              const p = rightPtrs.current.get(e.pointerId);
              if (!p || p.role !== "pending") return;
              p.role = "charge";
              onFire(true);
            }, TAP_S * 1000),
          };
          rightPtrs.current.set(e.pointerId, rec);
        }}
        onPointerMove={aimMove}
        onPointerUp={aimEnd}
        onPointerCancel={aimEnd}
      >
        {aimKnob.on && (
          <div
            className="absolute h-[7.2rem] w-[7.2rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8d48a]/35 bg-[#121018]/45"
            style={{ left: `${aimKnob.ox * 100}%`, top: `${aimKnob.oy * 100}%` }}
          >
            <span
              className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8d48a]/70 bg-[#e8d48a]/80"
              style={{ transform: `translate(calc(-50% + ${aimKnob.x * 36}px), calc(-50% + ${aimKnob.y * 36}px))` }}
            />
          </div>
        )}
      </div>
      <PadBtn
        label="Brake"
        hold
        onHold={onBrake}
        className="absolute left-3 top-[36%] z-10 h-12 min-w-[44px] -translate-y-1/2 rounded-md border border-[#f4f0e4]/40 bg-[#121018]/55 px-3 text-sm text-[#f4f0e4]"
      />
      <PadBtn
        label="Boost"
        hold
        onHold={onBoost}
        className="absolute right-3 top-[36%] z-10 h-12 min-w-[44px] -translate-y-1/2 rounded-md border border-[#e8d48a]/50 bg-[#121018]/55 px-3 text-sm text-[#e8d48a]"
      />
      <PadBtn
        label="Roll"
        onTap={onBarrel}
        className="absolute bottom-[11.5rem] right-[6.8rem] z-10 h-12 min-w-[44px] rounded-md border border-[#5ee0c0]/50 bg-[#121018]/55 px-3 text-sm text-[#5ee0c0]"
      />
      {onBomb && (
        <PadBtn
          label="Dash"
          onTap={onBomb}
          className="absolute bottom-[11.5rem] right-3 z-10 h-12 min-w-[44px] rounded-md border border-[#e8d48a]/50 bg-[#121018]/55 px-3 text-sm text-[#e8d48a]"
        />
      )}
    </div>
  );
}
