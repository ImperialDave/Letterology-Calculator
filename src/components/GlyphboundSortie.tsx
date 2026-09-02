import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SortieHud, TouchPads } from "@/glyphbound/sortie/hud";
import { SortieKeys } from "@/glyphbound/sortie/input";
import { SortieCanvas } from "@/glyphbound/sortie/scene";
import { unlockSortieAudio, sortieSfx } from "@/glyphbound/sortie/audio";
import { MISSIONS, missionById, type MissionDef } from "@/glyphbound/sortie/missions";
import { RegisterMap } from "@/glyphbound/sortie/map";
import { createSortie, stepSortie, type SortieState } from "@/glyphbound/sortie/sim";
import { loadSave, writeSave } from "@/glyphbound/save";
import { SKY_CORRIDOR } from "@/glyphbound/sortie/path";

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
  const missionRef = useRef<MissionDef | null>(null);
  const [snap, setSnap] = useState(() => sim.current);
  const [ready, setReady] = useState(false);
  const [picked, setPicked] = useState<MissionDef | null>(null);
  const [best, setBest] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const [proofs, setProofs] = useState<string[]>([]);
  const lastMode = useRef(sim.current.mode);

  const bootMission = (m: MissionDef) => {
    const next = createSortie({
      corridor: m.corridor,
      path: m.path.length ? m.path : SKY_CORRIDOR,
      name: m.name,
      missionId: m.id,
      biome: m.biome,
    });
    next.winKind = m.win;
    next.medal = m.medal;
    sim.current = next;
    missionRef.current = m;
    lastMode.current = "play";
    setSnap(next);
    setPicked(m);
  };

  useEffect(() => {
    const data = loadSave();
    setBest(data.sortieBest ?? 0);
    setCleared(data.sortieCleared ?? []);
    setProofs(data.sortieProofs ?? []);
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
          const id = sim.current.missionId;
          const def = missionById(id);
          const score = Math.max(data.sortieBest ?? 0, sim.current.score);
          const written = data.sortieCleared.includes(id) ? data.sortieCleared : [...data.sortieCleared, id];
          const proved =
            sim.current.hits >= def.medal && !data.sortieProofs.includes(id)
              ? [...data.sortieProofs, id]
              : data.sortieProofs;
          writeSave({ ...data, sortieBest: score, sortieCleared: written, sortieProofs: proved });
          setBest(score);
          setCleared(written);
          setProofs(proved);
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
    const m = missionRef.current ?? MISSIONS[0];
    bootMission(m);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#6a9080] [touch-action:none] ${onLeave ? "h-full" : "h-[100dvh]"}`}>
      {!picked ? (
        <RegisterMap
          cleared={cleared}
          proofs={proofs}
          onPick={bootMission}
          onLeave={leave}
          leaveLabel={leaveLabel}
        />
      ) : !ready ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#07080c] text-[#f4f0e4]">
          <button
            type="button"
            className="relative flex flex-col items-center border border-[#e8d48a]/35 bg-[#121018]/80 px-10 py-12"
            onPointerUp={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              e.stopPropagation();
              unlockSortieAudio();
              setReady(true);
            }}
          >
          <span className="absolute left-2 top-2 h-4 w-4 border-l border-t border-[#5ee0c0]" />
          <span className="absolute right-2 top-2 h-4 w-4 border-r border-t border-[#5ee0c0]" />
          <span className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-[#5ee0c0]" />
          <span className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-[#5ee0c0]" />
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#e8d48a]">{picked.roman} · C-wing</p>
          <h1 className="font-display text-6xl">{picked.name}</h1>
          <p className="mt-3 max-w-sm px-6 text-center text-sm text-[#c9b896]">{picked.blurb}</p>
          <p className="mt-6 text-sm text-[#5ee0c0]">Tap to take off</p>
          <p className="mt-8 max-w-md px-6 text-center text-[12px] leading-relaxed text-[#c8c4b8]">
            <span className="text-[#f4f0e4]">A D</span> bank · hold <span className="text-[#f4f0e4]">W</span> for a loop ·{" "}
            <span className="text-[#f4f0e4]">S</span> dive · hold <span className="text-[#f4f0e4]">J</span> spray · release
            after LOCK for a charge · double-tap <span className="text-[#f4f0e4]">A/D</span> or <span className="text-[#f4f0e4]">R</span> barrel
            · <span className="text-[#f4f0e4]">K</span> boost · <span className="text-[#f4f0e4]">X</span> brake
          </p>
          </button>
          <button
            type="button"
            className="mt-8 h-11 rounded-md border border-[#f4f0e4]/40 px-4 text-sm"
            onPointerUp={(e) => {
              e.stopPropagation();
              setPicked(null);
            }}
          >
            Register
          </button>
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
            onStick={(roll, pitch) => {
              keys.current.stick.x = roll;
              keys.current.stick.y = pitch;
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
            onBarrel={() => {
              keys.current.touchBarrel = 1;
            }}
            onBomb={() => {
              keys.current.touchBomb = true;
            }}
          />
        </>
      )}
    </div>
  );
}
