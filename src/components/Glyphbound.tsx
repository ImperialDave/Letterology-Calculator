import { useEffect, useRef, useState, type RefObject } from "react";
import { GameEngine } from "@/glyphbound/engine";
import type { UiSnap } from "@/glyphbound/types";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { KITS, skillName } from "@/glyphbound/roster";

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
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-muted">
        <span className="text-fg">A / D</span>
        <span>Move · left stick on touch</span>
        <span className="text-fg">Space</span>
        <span>Jump · tap hop, hold full</span>
        <span className="text-fg">J</span>
        <span>Fang shot · hold to fire</span>
        <span className="text-fg">K</span>
        <span>Skill unique to the letter in play — Gale cut, Stone brace, Tide pulse, Ember flare, Aether dash</span>
        <span className="text-fg">L</span>
        <span>Stem wall · hold down, then L, for a Shelf</span>
        <span className="text-fg">E</span>
        <span>Talk / enter · appears on touch when you can</span>
        <span className="text-fg">1–8</span>
        <span>Swap letters · tap portraits</span>
        <span className="text-fg">Shift</span>
        <span>Case shift any letter (after Drop Cap)</span>
        <span className="text-fg">Ward</span>
        <span>Always on · blocks every hit</span>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-subtle">
        Touch: left stick to move. Jump under the right thumb. Fang beside it. Stem and Shelf are separate so you do not fight the stick while you write. Talk only shows when something is in reach.
      </p>
    </div>
  );
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
});

export function Glyphbound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [ui, setUi] = useState<UiSnap>(emptyUi);
  const [showControls, setShowControls] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [openLetter, setOpenLetter] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const game = new GameEngine(canvas, setUi);
    gameRef.current = game;
    game.input.attach(wrap);
    game.start();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const g = () => gameRef.current;
  const playing = ui.mode === "play" || ui.mode === "hub" || ui.mode === "transform" || ui.mode === "dialogue";
  const padOn = ui.mode === "play" || ui.mode === "hub";

  return (
    <div
      ref={wrapRef}
      className="relative h-dvh w-full overflow-hidden bg-bg text-fg touch-none select-none"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {ui.mode === "title" && (
        <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-16">
          <div className="mb-auto mt-8 text-center gb-motion">
            <p className="text-sm tracking-[0.28em] text-muted uppercase">A letter rebellion</p>
            <h1 className="mt-2 font-display text-6xl font-semibold tracking-tight text-fg md:text-7xl">
              Glyphbound
            </h1>
            <p className="mt-2 font-display text-xl italic text-accent">Case of the Crescent</p>
            {ui.progress > 0 && (
              <p className="mt-3 text-sm tracking-wide text-muted">Ledger {ui.progress} of 30 closed</p>
            )}
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              className="h-12 rounded-lg bg-fg text-bg text-base font-medium"
              onClick={() => g()?.begin()}
            >
              Begin
            </button>
            {ui.canContinue && (
              <button
                type="button"
                className="h-12 rounded-lg border border-border bg-surface text-fg"
                onClick={() => g()?.continueGame()}
              >
                Continue
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                className="h-12 flex-1 rounded-md border border-border bg-elevated text-sm text-muted"
                onClick={() => g()?.toggleHard()}
              >
                {ui.hard ? "Precision Grid on" : "Precision Grid off"}
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-md border border-border bg-elevated text-sm text-muted"
                onClick={() => g()?.toggleMute()}
              >
                {ui.muted ? "Sound off" : "Sound on"}
              </button>
            </div>
            <button
              type="button"
              className="h-12 rounded-md border border-border bg-surface text-sm text-fg"
              onClick={() => setShowControls((v) => !v)}
            >
              {showControls ? "Hide controls" : "Controls"}
            </button>
            {showControls && <ControlsCard />}
            {ui.lore.length > 0 && (
              <>
                <button
                  type="button"
                  className="h-12 rounded-md border border-accent/40 bg-accent-dim text-sm text-accent"
                  onClick={() => setShowLore((v) => !v)}
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
          className="absolute inset-0 flex items-end justify-center bg-bg/55 px-6 pb-16"
          onClick={() => g()?.advanceIntro()}
        >
          <div className="max-w-lg rounded-xl border border-border bg-surface/90 p-6">
            <p className="font-display text-2xl leading-snug text-fg">{INTRO[ui.introPage] ?? INTRO[INTRO.length - 1]}</p>
            <p className="mt-4 text-sm text-muted">Tap or press J to continue</p>
          </div>
        </div>
      )}

      {ui.mode === "dialogue" && ui.dialogue && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
        <div className="absolute inset-0 flex items-center justify-center bg-bg/70 px-6">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-3xl">Paused</h2>
            <p className="mt-1 text-sm text-muted">
              {ui.stage}
              {ui.progress > 0 ? ` · ${ui.progress}/30` : ""}
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
              <button type="button" className="h-11 rounded-lg bg-fg text-bg" onClick={() => g()?.resume()}>
                Resume
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-border"
                onClick={() => g()?.toggleMute()}
              >
                {ui.muted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-border text-muted"
                onClick={() => g()?.returnHub()}
              >
                Return to Stacks
              </button>
            </div>
          </div>
        </div>
      )}

      {ui.mode === "dead" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/75 px-6">
          <div className="max-w-sm text-center">
            <h2 className="font-display text-5xl">Rounded down</h2>
            <p className="mt-3 text-muted">The census took a bite.</p>
            <button
              type="button"
              className="mt-6 h-12 w-full rounded-lg bg-fg text-bg"
              onClick={() => g()?.respawn()}
            >
              Wake at last Case Font
            </button>
          </div>
        </div>
      )}

      {ui.mode === "win" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/80 px-6">
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
              onClick={() => g()?.returnHub()}
            >
              Back to the Stacks
            </button>
          </div>
        </div>
      )}

      {playing && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 right-4 flex items-start justify-between">
            <div className="pointer-events-auto flex flex-col gap-2">
              <div className="flex max-w-[22rem] flex-wrap gap-1.5">
                {ui.party.map((L, i) => {
                  const kit = KITS[L] ?? KITS.c;
                  const on = ui.letter === L;
                  return (
                    <button
                      key={L}
                      type="button"
                      data-role={`p${i + 1}`}
                      title={`${kit.element} · ${skillName(L, ui.capital)}`}
                      className={`flex h-11 min-w-11 flex-col items-center justify-center rounded-md border px-1.5 font-display leading-none ${
                        on ? "bg-elevated" : "border-border bg-surface/80 text-muted"
                      }`}
                      style={{
                        color: kit.glow,
                        borderColor: on ? kit.glow : undefined,
                      }}
                    >
                      <span className="text-lg">{ui.capital ? L.toUpperCase() : L}</span>
                      <span className="mt-0.5 text-[8px] tracking-[0.14em] uppercase opacity-80">{kit.element}</span>
                    </button>
                  );
                })}
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
                <div className="pointer-events-none mt-1 max-w-[15rem] rounded-md bg-bg/50 px-2 py-1.5 backdrop-blur-sm">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-accent">Objectives</p>
                  {ui.tasks.map((t) => (
                    <p
                      key={t.id}
                      className={`text-[11px] leading-snug ${
                        t.done ? "text-muted/70 line-through" : "text-fg"
                      }`}
                    >
                      {t.done ? "✓" : "○"} {t.text}
                    </p>
                  ))}
                </div>
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
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false, ox: 0.36, oy: 0.62 });
  const last = useRef("");

  useEffect(() => {
    let id = 0;
    const tick = () => {
      const inp = inputRef.current?.input;
      const zone = zoneRef.current;
      if (inp && zone) {
        const r = zone.getBoundingClientRect();
        const ox = inp.stick.active ? (inp.stick.ox - r.left) / r.width : 0.36;
        const oy = inp.stick.active ? (inp.stick.oy - r.top) / r.height : 0.62;
        const next = {
          x: inp.stick.x,
          y: inp.stick.y,
          on: inp.stick.active,
          ox: Math.min(0.82, Math.max(0.18, ox)),
          oy: Math.min(0.82, Math.max(0.18, oy)),
        };
        const key = `${next.on}|${next.x.toFixed(2)}|${next.y.toFixed(2)}|${next.ox.toFixed(2)}|${next.oy.toFixed(2)}`;
        if (key !== last.current) {
          last.current = key;
          setKnob(next);
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
        className="pointer-events-auto absolute bottom-0 left-0 h-[42%] w-[42%] max-w-64"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Move"
      >
        <div
          className={`absolute h-[6.6rem] w-[6.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-opacity duration-150 ${
            knob.on ? "border-fg/35 bg-elevated/45 opacity-100" : "border-fg/20 bg-elevated/25 opacity-70"
          }`}
          style={{ left: `${knob.ox * 100}%`, top: `${knob.oy * 100}%` }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(232,236,232,0.08),transparent_70%)]" />
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg/40 bg-fg/80 shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
            style={{ transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))` }}
          />
        </div>
        <button
          type="button"
          data-role="down"
          className="gb-pad-btn pointer-events-auto absolute bottom-[0.85rem] left-[6.8rem] flex h-10 w-10 items-center justify-center rounded-full border border-fg/20 bg-surface/40 text-sm text-muted"
          aria-label="Down"
        >
          ↓
        </button>
        <button
          type="button"
          data-role="shelf"
          className="gb-pad-btn pointer-events-auto absolute bottom-[4.1rem] left-[6.6rem] flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-surface/55 text-[10px] font-medium tracking-wide text-accent"
        >
          Shelf
        </button>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[11.5rem] w-[12.2rem]"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))", paddingRight: "max(0.4rem, env(safe-area-inset-right))" }}
      >
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
          className="gb-pad-btn pointer-events-auto absolute bottom-4 right-[5.5rem] flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full border border-accent/45 bg-accent-dim text-[12px] font-medium text-accent"
        >
          Fang
        </button>
        <button
          type="button"
          data-role="stem"
          className="gb-pad-btn pointer-events-auto absolute bottom-[5.6rem] right-[5.7rem] flex h-[2.85rem] w-[2.85rem] items-center justify-center rounded-full border border-accent/35 bg-surface/55 text-[10px] font-medium tracking-wide text-accent"
        >
          Stem
        </button>
        <button
          type="button"
          data-role="special"
          className="gb-pad-btn pointer-events-auto absolute bottom-[5.7rem] right-4 flex h-[2.85rem] w-[2.85rem] items-center justify-center rounded-full border border-fg/20 bg-surface/55 text-[10px] font-medium tracking-wide text-fg"
        >
          {skill}
        </button>
      </div>
    </div>
  );
}
