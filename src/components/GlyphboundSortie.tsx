import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SortieHud, TouchPads } from "@/glyphbound/sortie/hud";
import { SortieKeys } from "@/glyphbound/sortie/input";
import { SortieCanvas } from "@/glyphbound/sortie/scene";
import { unlockSortieAudio, sortieSfx } from "@/glyphbound/sortie/audio";
import { createSortie, stepSortie, type SortieState } from "@/glyphbound/sortie/sim";
import { loadSave, writeSave } from "@/glyphbound/save";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getRoll: () => number;
      getSpeed: () => number;
      getX: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}

export function GlyphboundSortie({
  onLeave,
  leaveLabel = "Title",
}: {
  onLeave?: () => void;
  leaveLabel?: string;
} = {}) {
  const nav = useNavigate();
  const leave = () => {
    if (onLeave) onLeave();
    else void nav({ to: "/glyphbound" });
  };
  const sim = useRef<SortieState>(createSortie());
  const keys = useRef(new SortieKeys());
  const [snap, setSnap] = useState(() => sim.current);
  const [ready, setReady] = useState(false);
  const [best, setBest] = useState(0);
  const lastMode = useRef(sim.current.mode);

  useEffect(() => {
    setBest(loadSave().sortieBest ?? 0);
    const off = keys.current.attach();
    window.__controlsTest = {
      getYaw: () => sim.current.yaw,
      getRoll: () => sim.current.roll,
      getSpeed: () => sim.current.speed,
      getX: () => sim.current.x,
      setKeys: (codes) => keys.current.setKeys(codes),
    };
    return () => {
      off();
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let id = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const k = keys.current.poll(dt);
      if (k.pause && sim.current.mode === "play") sim.current.mode = "pause";
      const before = sim.current.shots.length;
      const barrel = sim.current.barrel;
      stepSortie(sim.current, k, dt);
      if (sim.current.shots.length > before && k.fire) sortieSfx.laser();
      if (sim.current.barrel > barrel) sortieSfx.roll();
      if (sim.current.splash > 0.4) sortieSfx.splash();
      if (lastMode.current !== sim.current.mode) {
        if (sim.current.mode === "win") {
          sortieSfx.win();
          const data = loadSave();
          const score = Math.max(data.sortieBest ?? 0, sim.current.score);
          writeSave({ ...data, sortieBest: score });
          setBest(score);
        }
        if (sim.current.mode === "dead") sortieSfx.dead();
        lastMode.current = sim.current.mode;
      }
      setSnap({ ...sim.current });
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [ready]);

  const retry = () => {
    sim.current = createSortie();
    lastMode.current = "play";
    setSnap(sim.current);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#6a9080] [touch-action:none] ${onLeave ? "h-full" : "h-[100dvh]"}`}>
      {!ready ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#121018] text-[#f4f0e4]">
          <button
            type="button"
            className="flex flex-col items-center"
            onPointerUp={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              e.stopPropagation();
              unlockSortieAudio();
              setReady(true);
            }}
          >
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#e8d48a]">Drop Cap</p>
          <h1 className="font-display text-6xl">Sortie</h1>
          <p className="mt-3 max-w-sm px-6 text-center text-sm text-[#c9b896]">
            All-range. Fly the C-wing over the ink sea. Dualis waits on the Press.
          </p>
          <p className="mt-6 text-sm text-[#5ee0c0]">Tap to take off</p>
          <p className="mt-8 max-w-md px-6 text-center text-[12px] leading-relaxed text-[#c8c4b8]">
            <span className="text-[#f4f0e4]">A D</span> bank · <span className="text-[#f4f0e4]">W</span> pull-up ·{" "}
            <span className="text-[#f4f0e4]">S</span> dive · <span className="text-[#f4f0e4]">J</span> laser · hold{" "}
            <span className="text-[#f4f0e4]">J</span> lock · double-tap <span className="text-[#f4f0e4]">A/D</span> barrel
            · <span className="text-[#f4f0e4]">K</span> boost · <span className="text-[#f4f0e4]">X</span> brake
          </p>
          </button>
          {onLeave && (
            <button
              type="button"
              className="mt-8 h-11 rounded-md border border-[#f4f0e4]/40 px-4 text-sm"
              onPointerUp={(e) => {
                e.stopPropagation();
                leave();
              }}
            >
              {leaveLabel}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="h-full w-full origin-top-left scale-[1] [image-rendering:pixelated]">
            <SortieCanvas sim={sim} />
          </div>
          <SortieHud
            s={snap}
            best={best}
            onRetry={retry}
            onTitle={leave}
            leaveLabel={leaveLabel}
            onResume={() => {
              sim.current.mode = "play";
              setSnap({ ...sim.current });
            }}
          />
          <TouchPads
            onStick={(x, y) => {
              keys.current.stick.x = -x;
              keys.current.stick.y = y;
            }}
            onFire={(v) => {
              keys.current.touchFire = v;
            }}
            onBoost={(v) => {
              keys.current.touchBoost = v;
            }}
            onBrake={(v) => {
              keys.current.touchBrake = v;
            }}
          />
        </>
      )}
    </div>
  );
}
