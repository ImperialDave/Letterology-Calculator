import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { GameEngine } from "@/glyphbound/engine";
import type { UiSnap } from "@/glyphbound/types";
import { STAGE_COUNT } from "@/glyphbound/types";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { KITS, skillName } from "@/glyphbound/roster";
import { GlyphboundStudio } from "@/components/GlyphboundStudio";
import { GlyphboundProof } from "@/components/GlyphboundProof";

const INTRO = [
  "Calculara was a manuscript before it was an equation. Letters walked it. Words were weather.",
  "G opened the ports. Ships of digits landed overnight. The Decimal Dominion rounded magic down and filed every letter that would stand in line.",
  "Five letters, five elements. You are c, Aether. The Exchange hides Gale. The Fort holds Stone. Tide waits in the Press. Ember runs the Coil. After the Drop Cap, Shift capitalizes whoever is in play.",
  "End-Mark is not the end. After the point come the operators: plus, minus, times, divide, remainder. Sixty ledgers. Willingness still turns them.",
];

function ControlsCard() {
  return (
    <div className="rounded-lg border border-border bg-elevated/90 p-3 text-left">
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-accent">Controls</p>
      <div className="grid gap-3 text-sm">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Move</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <span className="text-fg">A D · ← →</span>
            <span>Walk</span>
            <span className="text-fg">Space W ↑</span>
            <span>Jump · tap hop, hold full</span>
            <span className="text-fg">S ↓</span>
            <span>Drop through shelves · aim dash down</span>
            <span className="text-fg">Stick</span>
            <span>Walk · tilt down to drop · tilt up + skill to dash up</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Fight</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <span className="text-fg">J Z</span>
            <span>Fang · hold to fire</span>
            <span className="text-fg">K X</span>
            <span>Skill of the letter in play</span>
            <span className="text-fg">Ward</span>
            <span>Always on · eats a hit before health</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Letters · K</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <span className="text-fg">c Dash</span>
            <span>Eight-way. Through shot and digit. Once in the air, refresh on land. Hold a direction.</span>
            <span className="text-fg">C Cage</span>
            <span>Stand still and skill: a stem wall. Move or jump while skill: still Dash, a little harder.</span>
            <span className="text-fg">s Cut</span>
            <span>Gale blade · air hop is Space in the air</span>
            <span className="text-fg">S Scythe</span>
            <span>Two arcs · hold Space to glide</span>
            <span className="text-fg">b Brace</span>
            <span>Stone shell</span>
            <span className="text-fg">B Bulwark</span>
            <span>Heavier shell · Meteor if used in the air</span>
            <span className="text-fg">e Pulse</span>
            <span>Stun, ink, ice shelf · swim in sluice</span>
            <span className="text-fg">E Well</span>
            <span>Heal a mark · wider freeze</span>
            <span className="text-fg">r Flare</span>
            <span>Burning dash that leaves fire</span>
            <span className="text-fg">R Inferno</span>
            <span>Longer, hotter</span>
            <span className="text-fg">1–8</span>
            <span>Direct swap to that letter in the cell · tap portraits</span>
            <span className="text-fg">Tab Q ]</span>
            <span>Cycle next letter</span>
            <span className="text-fg">` [ R</span>
            <span>Cycle previous letter</span>
            <span className="text-fg">Shift</span>
            <span>Capital after the Drop Cap · same button on touch</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Write</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <span className="text-fg">L I</span>
            <span>Stem · a wall you can stand beside</span>
            <span className="text-fg">↓ + L</span>
            <span>Shelf · a floor you can stand on</span>
            <span className="text-fg">Words</span>
            <span>WALL RISE LOCK BURN FOLD TIDE as you collect them. FOLD wall-jumps off stems. TIDE drifts shelves.</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Talk · Menu</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <span className="text-fg">E</span>
            <span>Talk, enter, pick up · the Talk button only appears when something is in reach</span>
            <span className="text-fg">Esc P</span>
            <span>Pause · this list lives there</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-subtle">
        Touch: left stick to move. Jump under the right thumb. Fang beside it. Skill above Jump, named for who is in play.
        Stem and Shelf are separate so you do not fight the stick while you write. Tilt the stick and tap Skill to dash eight ways. When the cell grows, cycle with ↻ / ↺ beside the portraits.
      </p>
    </div>
  );
}

let lastPress = 0;
function press(fn: () => void) {
  return {
    onPointerUp: (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
      const n = performance.now();
      if (n - lastPress < 280) return;
      lastPress = n;
      fn();
    },
  };
}

const emptyUi = (): UiSnap => ({
  mode: "title",
  hp: 6,
  maxHp: 6,
  ink: 0,
  maxInk: 40,
  letter: "c",
  capital: false,
  party: ["c"],
  words: [],
  selectedWord: 0,
  objective: "",
  tasks: [],
  boss: null,
  toast: "",
  dialogue: null,
  stage: "",
  muted: false,
  shake: true,
  hard: false,
  canContinue: false,
  introPage: 0,
  hasCapital: false,
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
  stage5: false,
  progress: 0,
  transforming: 0,
  shield: 3,
  maxShield: 3,
  shotLevel: 1,
  hint: "",
  lore: [],
  sandbox: false,
  stageId: "hub",
  proof: false,
  god: false,
});

export function Glyphbound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [ui, setUi] = useState<UiSnap>(emptyUi);
  const [showControls, setShowControls] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [objOpen, setObjOpen] = useState(true);
  const [perf, setPerf] = useState<{
    fps: number;
    frameMs: number;
    drawMs: number;
    stage: string;
    solids: number;
    grid: number;
    enemies: number;
    bullets: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let dead = false;
    let game: GameEngine | null = null;
    const wake = () => game?.audio.unlock();
    void import("@/glyphbound/engine").then(({ GameEngine }) => {
      if (dead || !canvasRef.current || !wrapRef.current) return;
      game = new GameEngine(canvasRef.current, setUi);
      gameRef.current = game;
      game.input.attach(wrapRef.current);
      game.start();
      wrapRef.current.addEventListener("pointerdown", wake);
    });
    return () => {
      dead = true;
      wrap.removeEventListener("pointerdown", wake);
      game?.destroy();
      gameRef.current = null;
    };
  }, []);

  // Title-screen cheat: type "Chief69" to unlock all ledgers, letters, words, relics.
  useEffect(() => {
    if (ui.mode !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1) gameRef.current?.feedCheat(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.mode]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) setObjOpen(false);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const game = gameRef.current;
      if (!game?.showFps) {
        setPerf(null);
        return;
      }
      setPerf(game.snapshot());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const g = () => gameRef.current;
  const playing = ui.mode === "play" || ui.mode === "hub" || ui.mode === "transform" || ui.mode === "dialogue";
  const padOn = (ui.mode === "play" || ui.mode === "hub") && !ui.sandbox;

  return (
    <div
      ref={wrapRef}
      className="gb-shell relative w-full overflow-hidden bg-bg text-fg touch-none select-none"
      style={{ touchAction: "none", WebkitUserSelect: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ touchAction: "none" }}
      />

      {ui.mode === "studio" && <GlyphboundStudio game={g} />}
      {showProof && <GlyphboundProof game={g} onClose={() => setShowProof(false)} />}

      {ui.proof && playing && !showProof && (
        <div className="pointer-events-auto absolute left-1/2 top-2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-md border border-accent/40 bg-surface/90 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-accent">
            Proof{ui.god ? " · god" : ""}
          </span>
          <button type="button" className="h-8 rounded-md border border-border bg-surface/90 px-2 text-xs text-fg" {...press(() => g()?.proofShift(-1))}>
            Prev
          </button>
          <button type="button" className="h-8 rounded-md border border-border bg-surface/90 px-2 text-xs text-fg" {...press(() => g()?.proofShift(1))}>
            Next
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-border bg-surface/90 px-2 text-xs text-fg"
            {...press(() => {
              g()?.pauseGame();
              setShowProof(true);
            })}
          >
            Desk
          </button>
          <button type="button" className="h-8 rounded-md border border-border bg-surface/90 px-2 text-xs text-fg" {...press(() => g()?.leaveProof())}>
            Title
          </button>
        </div>
      )}

      {ui.sandbox && ui.mode === "play" && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <button
            type="button"
            data-ui="studio-stop"
            className="h-10 rounded-md border border-[#e8d48a]/50 bg-[#121018]/90 px-4 text-sm text-[#e8d48a]"
            {...press(() => g()?.studioStop())}
          >
            Back to desk · Esc
          </button>
        </div>
      )}

      {perf && (
        <div
          data-ui="fps"
          className="pointer-events-none absolute bottom-2 left-2 z-30 rounded-md px-2 py-1 font-mono text-[11px] leading-tight"
          style={{ background: "rgba(7,8,12,0.78)" }}
        >
          <p style={{ color: perf.fps < 45 ? "#d45a4a" : perf.fps < 55 ? "#e8d48a" : "#9af8de" }}>
            {perf.fps.toFixed(0)} fps  {perf.frameMs.toFixed(1)}ms  draw {perf.drawMs.toFixed(1)}ms
          </p>
          <p className="text-[#c9b896]">
            {perf.stage}  solids {perf.solids}  grid {perf.grid}  mobs {perf.enemies}  shot {perf.bullets}
          </p>
        </div>
      )}

      {ui.mode === "title" && (
        <div
          data-ui="title"
          className="pointer-events-auto absolute inset-0 z-20 flex flex-col px-5 pb-[max(1.6rem,env(safe-area-inset-bottom))] pt-[max(1.2rem,env(safe-area-inset-top))]"
        >
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.42em] text-[#e8d48a] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              A letter rebellion
            </p>
            <h1 className="mt-2 font-display text-[3.4rem] font-semibold leading-[0.9] tracking-tight text-[#f4f0e4] sm:text-7xl md:text-8xl [text-shadow:0_2px_0_#1a1208,0_10px_32px_rgba(0,0,0,0.9)]">
              Glyphbound
            </h1>
            <p className="mt-3 font-display text-xl italic text-[#e8d48a] [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
              Case of the Crescent
            </p>
            {ui.progress > 0 && (
              <p className="mt-3 text-sm tracking-wide text-[#d8d4c8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Ledger {ui.progress} of {STAGE_COUNT} closed
              </p>
            )}
          </div>
          <div className="mx-auto mt-auto flex w-full max-w-sm flex-col gap-2.5">
            <button
              type="button"
              data-ui="begin"
              className="h-12 rounded-lg bg-[#f4f0e4] text-base font-semibold text-[#121018] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
              {...press(() => g()?.begin())}
            >
              Begin
            </button>
            {ui.canContinue && (
              <button
                type="button"
                data-ui="continue"
                className="h-12 rounded-lg border border-[#e8d48a]/50 bg-[#1a1814]/90 font-medium text-[#f4f0e4]"
                {...press(() => g()?.continueGame())}
              >
                Continue
              </button>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                data-ui="hard"
                className="h-11 flex-1 rounded-md border border-[#f4f0e4]/25 bg-[#121018]/85 text-sm text-[#f4f0e4]"
                {...press(() => g()?.toggleHard())}
              >
                {ui.hard ? "Precision Grid on" : "Precision Grid off"}
              </button>
              <button
                type="button"
                data-ui="mute"
                className="h-11 flex-1 rounded-md border border-[#f4f0e4]/25 bg-[#121018]/85 text-sm text-[#f4f0e4]"
                {...press(() => g()?.toggleMute())}
              >
                {ui.muted ? "Sound off" : "Sound on"}
              </button>
            </div>
            <button
              type="button"
              data-ui="studio"
              className="h-11 rounded-md border border-[#5ee0c0]/40 bg-[#10241c]/90 text-sm text-[#9af8de]"
              {...press(() => g()?.enterStudio())}
            >
              Studio
            </button>
            <button
              type="button"
              data-ui="proof"
              className="h-11 rounded-md border border-[#e8d48a]/40 bg-[#1a1410]/90 text-sm text-[#e8d48a]"
              {...press(() => setShowProof(true)}
            >
              Proof desk
            </button>
            <button
              type="button"
              data-ui="controls"
              className="h-11 rounded-md border border-[#f4f0e4]/25 bg-[#121018]/85 text-sm text-[#f4f0e4]"
              {...press(() => setShowControls((v) => !v))}
            >
              {showControls ? "Hide controls" : "Controls"}
            </button>
            {showControls && <ControlsCard />}
            {ui.lore.length > 0 && (
              <>
                <button
                  type="button"
                  data-ui="codex"
                  className="h-11 rounded-md border border-[#5ee0c0]/40 bg-[#10241c]/90 text-sm text-[#9af8de]"
                  {...press(() => setShowLore((v) => !v))}
                >
                  {showLore ? "Hide codex" : `Codex · ${ui.lore.length} letter${ui.lore.length === 1 ? "" : "s"}`}
                </button>
                {showLore && (
                  <CodexList
                    lore={ui.lore}
                    openId={openLetter}
                    onOpen={setOpenLetter}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {ui.mode === "intro" && (
        <div
          data-ui="intro"
          className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-bg/55 px-6 pb-16"
          {...press(() => g()?.advanceIntro())}
        >
          <div className="max-w-lg rounded-xl border border-border bg-surface/90 p-6">
            <p className="font-display text-2xl leading-snug text-fg">{INTRO[ui.introPage] ?? INTRO[INTRO.length - 1]}</p>
            <p className="mt-4 text-sm text-muted">Tap or press J to continue</p>
          </div>
        </div>
      )}

      {ui.mode === "dialogue" && ui.dialogue && (
        <div data-ui="dialogue" className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="mx-auto block w-full max-w-xl rounded-xl border border-border bg-surface/95 p-4 text-left"
            onClick={() => g()?.nextDialogue()}
          >
            <p className="text-xs uppercase tracking-widest text-accent">{ui.dialogue.name}</p>
            <p className="mt-2 font-display text-xl text-fg">{ui.dialogue.text}</p>
          </button>
        </div>
      )}

      {ui.mode === "pause" && (
        <div data-ui="pause" className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-6">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-3xl">Paused</h2>
            <p className="mt-1 text-sm text-muted">
              {ui.stage}
              {ui.progress > 0 ? ` · ${ui.progress}/${STAGE_COUNT}` : ""}
            </p>
            {ui.tasks.length > 0 && (
              <div className="mt-3 rounded-lg border border-border bg-elevated/80 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-accent">Objectives</p>
                {ui.tasks.map((t) => (
                  <p
                    key={t.id}
                    className={`text-sm ${t.done ? "text-muted line-through" : "text-fg"}`}
                  >
                    {t.done ? "✓" : "○"} {t.text}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4">
              <ControlsCard />
            </div>
            {ui.lore.length > 0 && (
              <div className="mt-4">
                <CodexList lore={ui.lore} openId={openLetter} onOpen={setOpenLetter} />
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <button type="button" className="h-11 rounded-lg bg-fg text-bg" {...press(() => g()?.resume())}>
                Resume
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-border"
                {...press(() => g()?.toggleMute())}
              >
                {ui.muted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-border text-muted"
                {...press(() => g()?.returnHub())}
              >
                Return to Stacks
              </button>
              <button
                type="button"
                data-ui="proof"
                className="h-11 rounded-lg border border-accent/40 text-accent"
                {...press(() => setShowProof(true)}
              >
                Proof desk
              </button>
              {ui.proof && (
                <button
                  type="button"
                  className="h-11 rounded-lg border border-border text-muted"
                  {...press(() => g()?.leaveProof())}
                >
                  Leave proof · title
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {ui.mode === "dead" && (
        <div data-ui="dead" className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-bg/75 px-6">
          <div className="max-w-sm text-center">
            <h2 className="font-display text-5xl">Rounded down</h2>
            <p className="mt-3 text-muted">The census took a bite.</p>
            <button
              type="button"
              className="mt-6 h-12 w-full rounded-lg bg-fg text-bg"
              {...press(() => g()?.respawn())}
            >
              Wake at last Case Font
            </button>
          </div>
        </div>
      )}

      {ui.mode === "win" && (
        <div data-ui="win" className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-bg/80 px-6">
          <div className="max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Remainder filed</p>
            <h2 className="mt-2 font-display text-5xl">The last sentence is yours</h2>
            <p className="mt-4 text-muted leading-relaxed">
              Sixty ledgers. A period, then the operators, then the remainder the Dominion could not file. G opened
              the ports. You kept writing. Willingness, not fate, turned every page.
            </p>
            <button
              type="button"
              className="mt-6 h-12 w-full rounded-lg bg-fg text-bg"
              {...press(() => g()?.returnHub())}
            >
              Back to the Stacks
            </button>
          </div>
        </div>
      )}

      {playing && (
        <>
          <div
            className="pointer-events-none absolute flex items-start justify-between"
            style={{
              left: "max(1rem, env(safe-area-inset-left))",
              right: "max(1rem, env(safe-area-inset-right))",
              top: "max(0.75rem, env(safe-area-inset-top))",
            }}
          >
            <div className="pointer-events-auto flex flex-col gap-2">
              <div className="gb-party flex max-w-[min(22rem,calc(100vw-7rem))] flex-wrap items-center gap-1.5">
                {ui.party.length > 1 && (
                  <button
                    type="button"
                    data-role="cyclePrev"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg text-sm text-fg"
                    aria-label="Previous letter"
                    title="Previous letter (` / [ / R)"
                  >
                    ↺
                  </button>
                )}
                {ui.party.map((L, i) => {
                  const kit = KITS[L] ?? KITS.c;
                  const on = ui.letter === L;
                  return (
                    <button
                      key={L}
                      type="button"
                      data-role={`p${i + 1}`}
                      title={`${kit.element} · ${skillName(L, ui.capital)}`}
                      className={`gb-letter flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 font-display leading-none ${
                        on ? "gb-letter-on" : ""
                      }`}
                      style={{
                        boxShadow: on ? `inset 0 2px 0 ${kit.glow}` : `inset 0 0 0 1px ${kit.glow}66`,
                      }}
                    >
                      <span className="text-lg font-semibold text-fg" style={{ color: kit.core }}>
                        {ui.capital ? L.toUpperCase() : L}
                      </span>
                      <span className="gb-letter-name mt-0.5 text-[8px] uppercase">{kit.element}</span>
                    </button>
                  );
                })}
                {ui.party.length > 1 && (
                  <button
                    type="button"
                    data-role="cycle"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg text-sm text-fg"
                    aria-label="Next letter"
                    title="Next letter (Tab / Q / ])"
                  >
                    ↻
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 pl-1">
                {Array.from({ length: ui.maxShield }).map((_, i) => (
                  <span
                    key={i}
                    className={`block h-2.5 w-2.5 rotate-45 ${i < ui.shield ? "bg-accent" : "bg-elevated"}`}
                  />
                ))}
                <span className="ml-2 text-[10px] tracking-widest text-muted">
                  FANG {"I".repeat(Math.max(1, ui.shotLevel))}
                </span>
              </div>
              {ui.tasks.length > 0 && (
                <button
                  type="button"
                  className="pointer-events-auto mt-1 max-w-[min(15rem,calc(100vw-7rem))] rounded-md border border-border bg-bg/80 px-2 py-1.5 text-left backdrop-blur-sm"
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setObjOpen((v) => !v);
                  }}
                  aria-expanded={objOpen}
                  aria-label={objOpen ? "Hide objectives" : "Show objectives"}
                >
                  <p className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.22em] text-accent">
                    <span>Objectives</span>
                    <span className="text-muted">{objOpen ? "▾" : "▸"}</span>
                  </p>
                  {objOpen ? (
                    ui.tasks.map((t) => (
                      <p
                        key={t.id}
                        className={`text-[11px] leading-snug ${
                          t.done ? "text-muted/70 line-through" : "text-fg"
                        }`}
                      >
                        {t.done ? "✓" : "○"} {t.text}
                      </p>
                    ))
                  ) : (
                    <p className="truncate text-[11px] leading-snug text-fg">
                      {ui.tasks.find((t) => !t.done)?.text ?? "All closed"}
                    </p>
                  )}
                </button>
              )}
            </div>
            <div className="pointer-events-auto flex gap-2">
              {ui.hasCapital && (
                <button
                  type="button"
                  data-role="case"
                  className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface/80 px-2 font-display text-sm text-accent"
                >
                  {ui.capital ? ui.letter.toUpperCase() : ui.letter}
                </button>
              )}
              <button
                type="button"
                data-role="pause"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface/80"
                aria-label="Pause"
              >
                <Pause className="size-4" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface/80"
                onClick={() => g()?.toggleMute()}
                aria-label="Mute"
              >
                {ui.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          </div>
          {ui.boss && (
            <div className="pointer-events-none absolute left-1/2 top-16 w-64 -translate-x-1/2">
              <p className="mb-1 text-center text-xs tracking-widest text-muted uppercase">{ui.boss.name}</p>
              <div className="h-2 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full bg-danger"
                  style={{ width: `${Math.max(0, (100 * ui.boss.hp) / ui.boss.max)}%` }}
                />
              </div>
            </div>
          )}
          <div className="pointer-events-auto absolute right-4 top-20 hidden flex-col items-end gap-1 gb-fine:flex">
            <button
              type="button"
              data-role="word"
              className="rounded-sm bg-accent px-2 py-1 text-xs tracking-wider text-bg"
            >
              STEM
            </button>
            {ui.words.map((w) => (
              <span key={w} className="rounded-sm bg-surface/70 px-2 py-1 text-[10px] tracking-wider text-muted">
                {w}
              </span>
            ))}
          </div>
        </>
      )}

      {padOn && <MobilePad hint={ui.hint} letter={ui.letter} capital={ui.capital} inputRef={gameRef} />}
    </div>
  );
}

function CodexList({
  lore,
  openId,
  onOpen,
}: {
  lore: UiSnap["lore"];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated/90 p-3 text-left">
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-accent">Codex</p>
      {lore.length === 0 ? (
        <p className="text-sm text-muted">No letters heard yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lore.map((entry) => {
            const open = openId === entry.id;
            return (
              <div key={entry.id} className="rounded-md border border-border/80 bg-surface/70">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                  onClick={() => onOpen(open ? null : entry.id)}
                >
                  <span className="font-display text-lg text-fg">
                    <span className="mr-2 text-accent">{entry.glyph}</span>
                    {entry.name}
                  </span>
                  <span className="text-xs text-muted">{open ? "hide" : "read"}</span>
                </button>
                {open && (
                  <div className="space-y-2 border-t border-border px-3 py-2">
                    {entry.lines.map((line) => (
                      <p key={line} className="font-display text-base leading-snug text-fg">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function interactLabel(hint: string) {
  if (!hint) return "";
  if (/shut/i.test(hint) && !/enter/i.test(hint) && !/gate/i.test(hint)) return hint.replace(/^E\s+/, "").trim();
  if (/enter/i.test(hint)) return hint.replace(/^E\s+/, "").replace(/\s+/g, " ").trim();
  if (/drop cap/i.test(hint)) return "";
  if (/case/i.test(hint)) return /need/i.test(hint) ? "Need Drop Cap" : "Shift case";
  if (/talk|hear/i.test(hint)) return "Talk";
  if (/^E\s/.test(hint)) return hint.replace(/^E\s+/, "").trim() || "Use";
  return "";
}

function skillLabel(letter: UiSnap["letter"], capital: boolean) {
  return skillName(letter, capital);
}

function MobilePad({
  hint,
  letter,
  capital,
  inputRef,
}: {
  hint: string;
  letter: UiSnap["letter"];
  capital: boolean;
  inputRef: RefObject<GameEngine | null>;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false, ox: 0.48, oy: 0.55 });
  const last = useRef("");

  const rest = useRef({ ox: 0.48, oy: 0.55 });

  useEffect(() => {
    let id = 0;
    const tick = () => {
      const inp = inputRef.current?.input;
      const zone = zoneRef.current;
      if (inp && zone) {
        const landscape =
          window.matchMedia("(orientation: landscape) and (max-height: 560px)").matches;
        const restOx = landscape ? 0.52 : 0.46;
        const restOy = landscape ? 0.55 : 0.6;
        rest.current = { ox: restOx, oy: restOy };
        if (!inp.stick.active) {
          const next = { x: 0, y: 0, on: false, ox: restOx, oy: restOy };
          const key = `off|${restOx}|${restOy}`;
          if (key !== last.current) {
            last.current = key;
            setKnob(next);
          }
        } else {
          const r = zone.getBoundingClientRect();
          const ox = (inp.stick.ox - r.left) / r.width;
          const oy = (inp.stick.oy - r.top) / r.height;
          const next = {
            x: inp.stick.x,
            y: inp.stick.y,
            on: true,
            ox: Math.min(0.82, Math.max(0.18, ox)),
            oy: Math.min(0.82, Math.max(0.18, oy)),
          };
          const key = `on|${next.x.toFixed(2)}|${next.y.toFixed(2)}|${next.ox.toFixed(2)}|${next.oy.toFixed(2)}`;
          if (key !== last.current) {
            last.current = key;
            setKnob(next);
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [inputRef]);

  const use = interactLabel(hint);
  const skill = skillLabel(letter, capital);
  const kx = knob.x * 28;
  const ky = knob.y * 28;

  return (
    <div className="gb-pad pointer-events-none absolute inset-0 z-20">
      {use ? (
        <button
          type="button"
          data-role="interact"
          className="gb-pad-btn pointer-events-auto absolute left-1/2 z-30 h-11 -translate-x-1/2 rounded-full border border-accent/50 bg-accent px-5 text-sm font-medium text-bg shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          style={{ bottom: "calc(7.25rem + env(safe-area-inset-bottom))" }}
        >
          {use}
        </button>
      ) : null}

      <div
        ref={zoneRef}
        data-role="stick"
        className="gb-stick-zone pointer-events-auto"
        aria-label="Move"
      >
        <div
          className={`absolute h-[6.6rem] w-[6.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            knob.on ? "border-fg/40 bg-elevated/55 opacity-100" : "border-fg/30 bg-elevated/40 opacity-90"
          }`}
          style={{ left: `${knob.ox * 100}%`, top: `${knob.oy * 100}%` }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(232,236,232,0.08),transparent_70%)]" />
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg/50 bg-fg/90 shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
            style={{ transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))` }}
          />
        </div>
        <div className="pointer-events-auto absolute bottom-[0.7rem] right-[0.2rem] flex flex-col gap-2">
          <button
            type="button"
            data-role="shelf"
            className="gb-pad-btn flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-bg text-[10px] font-medium tracking-wide text-accent"
          >
            Shelf
          </button>
          <button
            type="button"
            data-role="down"
            className="gb-pad-btn flex h-10 w-10 items-center justify-center rounded-full border border-fg/30 bg-bg text-sm text-fg"
            aria-label="Down"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="gb-actions">
        <button
          type="button"
          data-role="jump"
          className="gb-pad-btn pointer-events-auto absolute bottom-3 right-3 flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-full bg-fg text-[13px] font-semibold tracking-wide text-bg shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
        >
          Jump
        </button>
        <button
          type="button"
          data-role="attack"
          className="gb-pad-btn pointer-events-auto absolute bottom-4 right-[5.5rem] flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full border border-accent bg-accent text-[12px] font-semibold text-bg"
        >
          Fang
        </button>
        <button
          type="button"
          data-role="stem"
          className="gb-pad-btn pointer-events-auto absolute bottom-[5.6rem] right-[5.7rem] flex h-[2.85rem] w-[2.85rem] items-center justify-center rounded-full border border-accent/50 bg-bg text-[10px] font-semibold tracking-wide text-accent"
        >
          Stem
        </button>
        <button
          type="button"
          data-role="special"
          className="gb-pad-btn pointer-events-auto absolute bottom-[5.7rem] right-4 flex h-[2.85rem] w-[2.85rem] items-center justify-center rounded-full border border-fg/35 bg-bg text-[10px] font-semibold tracking-wide text-fg"
        >
          {skill}
        </button>
      </div>
    </div>
  );
}
