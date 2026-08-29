import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { GameEngine } from "@/glyphbound/engine";
import type { LetterId, SlotInfo, UiSnap } from "@/glyphbound/types";
import { gradeLabel } from "@/glyphbound/difficulty";
import { STAGE_COUNT } from "@/glyphbound/types";
import { LEVELS } from "@/glyphbound/levels";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { KITS, skillName } from "@/glyphbound/roster";
import { KEY_DEFS, prettyCode, type KeyAction } from "@/glyphbound/keys";
import { WEAPONS } from "@/glyphbound/weapons";
import { GlyphboundStudio } from "@/components/GlyphboundStudio";
import { GlyphboundProof } from "@/components/GlyphboundProof";
import { GlyphboundReplay } from "@/components/GlyphboundReplay";

const STRIKE_LETTERS: LetterId[] = ["c", "s", "b", "e", "r", "k", "n", "t"];
const FLOURISH_LINE = STRIKE_LETTERS.map((id) => `${id} ${WEAPONS[id].flourish.name}`).join(" · ");

function KeyRow({ keys, text }: { keys: string; text: string }) {
  return (
    <>
      <span className="text-fg">{keys}</span>
      <span>{text}</span>
    </>
  );
}

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
      <p className="mb-3 text-[12px] leading-snug text-muted">
        <span className="text-fg">A D</span> walk · <span className="text-fg">Space</span> jump ·{" "}
        <span className="text-fg">J</span> strike · <span className="text-fg">F</span> fang ·{" "}
        <span className="text-fg">K</span> skill
      </p>
      <div className="grid gap-3 text-sm">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Move</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="A D · ← →" text="Walk · D / → is right on the page" />
            <KeyRow keys="Space" text="Jump · tap hop, hold full · always hops" />
            <KeyRow keys="W ↑" text="Jump, or aim up for Strike" />
            <KeyRow keys="S ↓" text="Drop through shelves · down-tilt · fast-fall in air" />
            <KeyRow keys="Stick" text="Walk and aim Strike · down drops · up + skill dashes up" />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Strike · J Z</p>
          <div className="mb-2 rounded-md border border-border/80 bg-bg/40 px-2 py-2 text-center text-[12px] text-muted">
            <p className="text-fg">↑ · up-tilt · uair</p>
            <p>
              <span className="text-fg">←</span> back / jab{" "}
              <span className="mx-1 text-accent">J</span> f-tilt / fair{" "}
              <span className="text-fg">→</span>
            </p>
            <p className="text-fg">↓ · down-tilt · dair · fast-fall</p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="Tap J" text="Jab combo · tap again for jab 2, then a finisher" />
            <KeyRow keys="Run + J" text="Dash attack · 0.5s cool · air dash holds height · s scythe · t lance · r fire skate · c disk" />
            <KeyRow keys="Hold J + dir" text="Charge a smash · gold bar · release to fire" />
            <KeyRow keys="Hold J" text="No direction: that letter's flourish" />
            <KeyRow keys="Air + J" text="Nair, fair, bair, uair, dair · run then jump + J is a dash attack" />
            <KeyRow keys="Combo" text="Jab → up-tilt → Space uair. Hits build percent." />
            <KeyRow keys="↑ + J" text="Up-tilt hops forward. Jump then up-Strike lifts higher than a jump. Up-tilt, then Space, hops into a full jump." />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Fang · Skill · Ward</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="F H" text="Fang · ink-heavy ranged · never the same key as Strike" />
            <KeyRow keys="K X" text="Skill of the letter in play" />
            <KeyRow keys="Flourish" text={FLOURISH_LINE} />
            <KeyRow keys="Heat" text="f,f + Strike Heat Smash · hold Skill Case Art when the gold bar is full" />
            <KeyRow keys="Ward" text="Always on · eats a hit before health" />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Letters · K</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="c Dash" text="Eight-way. Through shot and digit. Once in the air, refresh on land. Hold a direction." />
            <KeyRow keys="C Cage" text="Stand still and skill: a stem wall. Move or jump while skill: still Dash, a little harder." />
            <KeyRow keys="s Cut" text="Gale blade · air hop is Space in the air" />
            <KeyRow keys="S Scythe" text="Two arcs · hold Space to glide" />
            <KeyRow keys="b Brace" text="Stone shell" />
            <KeyRow keys="B Bulwark" text="Heavier shell · Meteor if used in the air" />
            <KeyRow keys="e Pulse" text="Stun, ink, ice shelf · swim in sluice" />
            <KeyRow keys="E Well" text="Heal a mark · wider freeze" />
            <KeyRow keys="r Flare" text="Burning dash that leaves fire" />
            <KeyRow keys="R Inferno" text="Longer, hotter" />
            <KeyRow keys="1–8" text="Direct swap to that letter in the cell · tap portraits" />
            <KeyRow keys="Tab Q ]" text="Cycle next letter" />
            <KeyRow keys="` [ R" text="Cycle previous letter" />
            <KeyRow keys="Shift" text="Capital after the Drop Cap · same button on touch" />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Write</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="L I" text="Stem · a wall you can stand beside" />
            <KeyRow keys="↓ + L" text="Shelf · a floor you can stand on" />
            <KeyRow keys="Words" text="WALL RISE LOCK BURN FOLD TIDE as you collect them. FOLD wall-jumps off stems. TIDE drifts shelves." />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Talk · Menu</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
            <KeyRow keys="E" text="Talk, enter, pick up · the Talk button only appears when something is in reach" />
            <KeyRow keys="Esc P" text="Pause · this list lives there" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-subtle">
        Touch: left stick walks and aims Strike. Jump under the right thumb. Strike beside it — tap with a tilt
        for tilts and aerials, hold with a tilt to charge a smash, hold still for that letter's flourish. Fang
        under Skill. Skill above Jump, named for who is in play. Stem and Shelf stay separate so you do not fight
        the stick while you write. Tilt the stick and tap Skill to dash eight ways. When the cell grows, cycle with
        ↻ / ↺ beside the portraits.
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
  shakeAmt: 2,
  sfxVol: 1,
  musicVol: 1,
  reducedMotion: false,
  keys: {},
  difficulty: "easy",
  lives: -1,
  livesMax: -1,
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
  heat: 0,
  hint: "",
  lore: [],
  sandbox: false,
  stageId: "hub",
  proof: false,
  god: false,
  replayOpen: false,
  slot: 0,
  slots: [],
});

const FILE_MARK = ["I", "II", "III"];

function fileBlurb(s: SlotInfo) {
  if (s.empty) return "No pages written.";
  const name = LEVELS[s.stage]?.name ?? (s.stage === "hub" ? "Lower Register Stacks" : "A ledger");
  const grade = gradeLabel(s.difficulty ?? "easy");
  if (s.progress > 0) return `${name} · ${s.progress} closed · ${grade}`;
  return `${name} · ${grade}`;
}

export function Glyphbound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [ui, setUi] = useState<UiSnap>(emptyUi);
  const [showControls, setShowControls] = useState(false);
  const [wipe, setWipe] = useState<{ slot: number; inGame: boolean } | null>(null);
  const [showProof, setShowProof] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [objOpen, setObjOpen] = useState(true);
  const [partyOpen, setPartyOpen] = useState(false);
  const [capturing, setCapturing] = useState<KeyAction | null>(null);
  const [portrait, setPortrait] = useState(false);
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
    const check = () => setPortrait(window.innerHeight > window.innerWidth * 1.15);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapturing(null);
        return;
      }
      gameRef.current?.bindKey(capturing, e.code);
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    const inp = gameRef.current?.input;
    if (inp) inp.capturing = true;
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (inp) inp.capturing = false;
    };
  }, [capturing]);

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
      {ui.replayOpen && <GlyphboundReplay game={g} progress={ui.progress} />}

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
                File {FILE_MARK[ui.slot] ?? ui.slot + 1} · Ledger {ui.progress} of {STAGE_COUNT} closed
              </p>
            )}
          </div>
          <div className="mx-auto mt-auto flex w-full max-w-sm flex-col gap-2.5">
            <div className="rounded-xl border border-[#e8d48a]/25 bg-[#121018]/80 p-2.5">
              <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-[#e8d48a]">Files</p>
              <div className="flex flex-col gap-2">
                {(ui.slots.length ? ui.slots : [0, 1, 2].map((index) => ({
                  index,
                  empty: true,
                  progress: 0,
                  stage: "hub",
                  letter: "c" as const,
                  party: 0,
                  updated: 0,
                  difficulty: "easy" as const,
                }))).map((s) => {
                  const on = s.index === ui.slot;
                  return (
                    <div
                      key={s.index}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                        on ? "border-[#e8d48a]/70 bg-[#1a1814]" : "border-[#f4f0e4]/15 bg-[#0c0a10]/80"
                      }`}
                    >
                      <button
                        type="button"
                        data-ui={`file-${s.index}`}
                        className="min-w-0 flex-1 text-left"
                        {...press(() => (s.empty ? g()?.newGame(s.index) : g()?.openSlot(s.index)))}
                      >
                        <p className="text-sm font-semibold text-[#f4f0e4]">File {FILE_MARK[s.index] ?? s.index + 1}</p>
                        <p className="truncate text-xs text-[#c9b896]">{fileBlurb(s)}</p>
                      </button>
                      {s.empty ? (
                        <button
                          type="button"
                          className="h-10 shrink-0 rounded-md bg-[#f4f0e4] px-3 text-sm font-semibold text-[#121018]"
                          {...press(() => g()?.newGame(s.index))}
                        >
                          New
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="h-10 shrink-0 rounded-md border border-[#f4f0e4]/30 px-3 text-sm text-[#f4f0e4]"
                          {...press(() => setWipe({ slot: s.index, inGame: false }))}
                        >
                          New
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                data-ui="hard"
                className="h-11 flex-1 rounded-md border border-[#f4f0e4]/25 bg-[#121018]/85 text-sm text-[#f4f0e4]"
                {...press(() => g()?.cycleDifficulty())}
              >
                {gradeLabel(ui.difficulty ?? "easy")}
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
              {...press(() => setShowProof(true))}
            >
              Proof desk
            </button>
            <p className="rounded-md border border-[#f4f0e4]/20 bg-[#121018]/70 px-3 py-2 text-left text-[12px] leading-snug text-[#c8c4b8]">
              <span className="text-[#f4f0e4]">A D</span> walk · <span className="text-[#f4f0e4]">Space</span> jump ·{" "}
              <span className="text-[#f4f0e4]">J</span> strike · <span className="text-[#f4f0e4]">F</span> fang ·{" "}
              <span className="text-[#f4f0e4]">K</span> skill
            </p>
            <button
              type="button"
              data-ui="controls"
              className="h-11 rounded-md border border-[#f4f0e4]/25 bg-[#121018]/85 text-sm text-[#f4f0e4]"
              {...press(() => setShowControls((v) => !v))}
            >
              {showControls ? "Hide the Strike kit" : "Strike kit · full controls"}
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
            <div className="mt-4 rounded-lg border border-border bg-elevated/80 p-3">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-accent">Options</p>
              <label className="flex items-center justify-between gap-3 text-sm text-fg">
                SFX
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((ui.sfxVol ?? 1) * 100)}
                  className="w-36"
                  onChange={(e) => g()?.setSfxVol(Number(e.target.value) / 100)}
                />
              </label>
              <label className="mt-2 flex items-center justify-between gap-3 text-sm text-fg">
                Music
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((ui.musicVol ?? 1) * 100)}
                  className="w-36"
                  onChange={(e) => g()?.setMusicVol(Number(e.target.value) / 100)}
                />
              </label>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                <span className="text-fg">Shake</span>
                <span className="flex gap-1">
                  {([0, 1, 2] as const).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`h-8 rounded-md px-2 text-[11px] ${
                        (ui.shakeAmt ?? 2) === amt ? "bg-fg text-bg" : "border border-border text-muted"
                      }`}
                      onClick={() => g()?.setShakeAmt(amt)}
                    >
                      {amt === 0 ? "Off" : amt === 1 ? "Low" : "Full"}
                    </button>
                  ))}
                </span>
              </div>
              <label className="mt-2 flex items-center justify-between gap-3 text-sm text-fg">
                Reduced motion
                <input
                  type="checkbox"
                  checked={!!ui.reducedMotion}
                  onChange={(e) => g()?.setReducedMotion(e.target.checked)}
                />
              </label>
              <p className="mt-2 text-[11px] text-fg">Grade: {gradeLabel(ui.difficulty ?? "easy")}</p>
              <p className="mt-2 text-[11px] text-subtle">Pad: stick walk · A jump · X/B strike · Y fang · RB skill · Start pause</p>
              <p className="mt-3 mb-1 text-[10px] uppercase tracking-[0.2em] text-accent">Keys</p>
              <div className="grid max-h-40 gap-1 overflow-y-auto">
                {KEY_DEFS.map((d) => {
                  const code = ui.keys?.[d.id] || d.code;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className="flex h-8 items-center justify-between rounded-md border border-border bg-bg/60 px-2 text-[11px] text-fg"
                      onClick={() => setCapturing(d.id)}
                    >
                      <span>{d.label}</span>
                      <span className="text-accent">
                        {capturing === d.id ? "press a key" : prettyCode(code)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="mt-2 h-8 w-full rounded-md border border-border text-[11px] text-muted"
                onClick={() => g()?.resetKeys()}
              >
                Restore default keys
              </button>
            </div>
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
                className="h-11 rounded-lg border border-border text-muted"
                {...press(() => g()?.toTitle())}
              >
                Title · files
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-accent/40 text-accent"
                {...press(() => setWipe({ slot: ui.slot, inGame: true }))}
              >
                New game
              </button>
              <button
                type="button"
                data-ui="proof"
                className="h-11 rounded-lg border border-accent/40 text-accent"
                {...press(() => setShowProof(true))}
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
            {ui.lives === 0 ? (
              <>
                <h2 className="font-display text-5xl">Filed away</h2>
                <p className="mt-3 text-muted">The census closed this page.</p>
                <button
                  type="button"
                  className="mt-6 h-12 w-full rounded-lg bg-fg text-bg"
                  {...press(() => g()?.retryLedger())}
                >
                  Retry ledger
                </button>
                <button
                  type="button"
                  className="mt-3 h-12 w-full rounded-lg border border-border bg-surface text-fg"
                  {...press(() => g()?.returnHub())}
                >
                  Back to the Stacks
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-5xl">Rounded down</h2>
                <p className="mt-3 text-muted">
                  {ui.livesMax >= 0 ? `${ui.lives} remaining.` : "The census took a bite."}
                </p>
                <button
                  type="button"
                  className="mt-6 h-12 w-full rounded-lg bg-fg text-bg"
                  {...press(() => g()?.respawn())}
                >
                  Wake at last Case Font
                </button>
              </>
            )}
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
              <div className="gb-party relative">
                {(() => {
                  const L = ui.letter;
                  const kit = KITS[L] ?? KITS.c;
                  return (
                    <button
                      type="button"
                      className="gb-letter gb-letter-on flex h-12 min-w-12 flex-col items-center justify-center rounded-md px-2 font-display leading-none"
                      style={{ boxShadow: `inset 0 2px 0 ${kit.glow}` }}
                      onPointerUp={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPartyOpen((v) => !v);
                      }}
                      aria-expanded={partyOpen}
                      aria-label="Party letters"
                    >
                      <span className="text-xl font-semibold" style={{ color: kit.core }}>
                        {ui.capital ? L.toUpperCase() : L}
                      </span>
                      <span className="gb-letter-name mt-0.5 text-[8px] uppercase">{kit.element}</span>
                    </button>
                  );
                })()}
                {partyOpen && (
                  <div className="absolute left-0 top-14 z-40 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface/95 p-1.5 shadow-lg">
                    {ui.party.length > 1 && (
                      <button
                        type="button"
                        data-role="cyclePrev"
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-bg text-sm text-fg"
                        aria-label="Previous letter"
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
                          className={`gb-letter flex h-12 min-w-12 flex-col items-center justify-center rounded-md px-2 font-display leading-none ${
                            on ? "gb-letter-on" : ""
                          }`}
                          style={{
                            boxShadow: on ? `inset 0 2px 0 ${kit.glow}` : `inset 0 0 0 1px ${kit.glow}66`,
                          }}
                          onPointerUp={() => setPartyOpen(false)}
                        >
                          <span className="text-lg font-semibold" style={{ color: kit.core }}>
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
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-bg text-sm text-fg"
                        aria-label="Next letter"
                        onPointerUp={() => setPartyOpen(false)}
                      >
                        ↻
                      </button>
                    )}
                  </div>
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

      {padOn && portrait && (
        <div className="pointer-events-none absolute inset-x-0 top-[42%] z-30 text-center">
          <p className="inline-block rounded-md border border-border bg-surface/90 px-3 py-1.5 text-[12px] tracking-wide text-fg">
            Turn the page sideways
          </p>
        </div>
      )}
      {padOn && (
        <MobilePad hint={ui.hint} letter={ui.letter} capital={ui.capital} heat={ui.heat ?? 0} inputRef={gameRef} />
      )}

      {wipe && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-bg/80 px-6">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-2xl text-fg">Start a new game?</h2>
            <p className="mt-2 text-sm text-muted">
              File {FILE_MARK[wipe.slot] ?? wipe.slot + 1} will be rewritten from the first page. Other files stay.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="h-11 rounded-lg bg-fg text-bg"
                {...press(() => {
                  const ask = wipe;
                  setWipe(null);
                  g()?.newGame(ask.slot);
                })}
              >
                New game
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-border text-muted"
                {...press(() => setWipe(null))}
              >
                Keep this file
              </button>
            </div>
          </div>
        </div>
      )}
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
  heat,
  inputRef,
}: {
  hint: string;
  letter: UiSnap["letter"];
  capital: boolean;
  heat: number;
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
          className="gb-pad-btn pointer-events-auto absolute left-1/2 z-30 h-12 -translate-x-1/2 rounded-full border border-accent/50 bg-accent px-5 text-sm font-medium text-bg shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          style={{ bottom: "calc(8.4rem + env(safe-area-inset-bottom))" }}
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
          className={`absolute h-[7.2rem] w-[7.2rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
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
            className="gb-pad-btn flex h-12 w-12 items-center justify-center rounded-full border border-accent/50 bg-bg text-[10px] font-medium tracking-wide text-accent"
          >
            Shelf
          </button>
          <button
            type="button"
            data-role="down"
            className="gb-pad-btn flex h-11 w-11 items-center justify-center rounded-full border border-fg/30 bg-bg text-sm text-fg"
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
          className="gb-pad-btn pointer-events-auto absolute bottom-3 right-3 flex h-[5.2rem] w-[5.2rem] items-center justify-center rounded-full bg-fg text-[13px] font-semibold tracking-wide text-bg shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
        >
          Jump
        </button>
        <button
          type="button"
          data-role="attack"
          className="gb-pad-btn pointer-events-auto absolute bottom-4 right-[6.4rem] flex h-[4.3rem] w-[4.3rem] flex-col items-center justify-center rounded-full border border-accent bg-accent text-bg"
        >
          <span className="text-[12px] font-semibold leading-none">Strike</span>
          <span className="mt-0.5 text-[8px] font-medium tracking-wide opacity-80">
            {heat >= 50 ? "HEAT" : "hold smash"}
          </span>
        </button>
        <button
          type="button"
          data-role="fang"
          className="gb-pad-btn pointer-events-auto absolute bottom-[6.4rem] right-[10.2rem] flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-accent/60 bg-bg text-[10px] font-semibold tracking-wide text-accent"
        >
          Fang
        </button>
        <button
          type="button"
          data-role="stem"
          className="gb-pad-btn pointer-events-auto absolute bottom-[6.4rem] right-[6.5rem] flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-accent/50 bg-bg text-[10px] font-semibold tracking-wide text-accent"
        >
          Stem
        </button>
        <button
          type="button"
          data-role="special"
          className={`gb-pad-btn pointer-events-auto absolute bottom-[6.5rem] right-3 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border text-[10px] font-semibold tracking-wide ${
            heat >= 100 ? "border-accent bg-accent/20 text-accent gb-art-hold" : "border-fg/35 bg-bg text-fg"
          }`}
        >
          {heat >= 100 ? "ART" : skill}
        </button>
      </div>
    </div>
  );
}
