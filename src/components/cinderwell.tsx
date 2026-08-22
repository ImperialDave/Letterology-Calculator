import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Anchor,
  Aperture,
  Box,
  Flame,
  Fuel,
  Hexagon,
  Pause,
  Radio,
  Shield,
  Snowflake,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Bomb,
} from "lucide-react";
import { Game, getGame, setGame } from "@/game/engine";
import { type Cardinal, STICK_THROW } from "@/game/input";
import {
  BASE_SLOTS,
  CONSUMABLES,
  FUEL_PRICE,
  HULL_PRICE,
  KILN_BASE_MAX,
  KILN_MODULE_SLOTS,
  LATTICE_SLOTS,
  ORES,
  RIGWORKS_MAX,
  SLOT_BLURB,
  SLOT_LABEL,
  CLAIM_NAMES,
  SLOT_COUNT,
  UPGRADES,
  cargoValue,
  visibleBuildings,
  type ConsumableId,
  type ShopId,
  type Slot,
} from "@/game/data";
import { useGameUI } from "@/game/store";
import { wellXPost } from "@/lib/letterology/share";

function fingerUiNow(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const anyCoarse = window.matchMedia("(any-pointer: coarse)").matches;
  const hoverNone = window.matchMedia("(hover: none)").matches;
  const points = navigator.maxTouchPoints > 0;
  const compact = window.matchMedia("(max-width: 1024px), (max-height: 640px)").matches;
  return coarse || anyCoarse || hoverNone || (points && compact);
}

function useFingerUi(): boolean {
  const [on, setOn] = useState(fingerUiNow);
  useEffect(() => {
    const compute = () => setOn(fingerUiNow());
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener?.("change", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
      mq.removeEventListener?.("change", compute);
    };
  }, []);
  return on;
}

export function Cinderwell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finger = useFingerUi();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas);
    setGame(game);
    game.start();
    return () => {
      game.destroy();
      setGame(null);
    };
  }, []);

  return (
    <div
      data-cinderwell
      className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none overscroll-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Cinderwell mine"
      />
      <SteerField />
      <Hud finger={finger} />
      <TitleScreen />
      <HelpScreen />
      <SettingsScreen />
      <PauseScreen />
      <ClaimsScreen />
      <ShopScreen />
      <DeadScreen />
      <TouchPad finger={finger} />
    </div>
  );
}

function Hud({ finger }: { finger: boolean }) {
  const phase = useGameUI((s) => s.phase);
  const fuel = useGameUI((s) => s.fuel);
  const maxFuel = useGameUI((s) => s.maxFuel);
  const hull = useGameUI((s) => s.hull);
  const maxHull = useGameUI((s) => s.maxHull);
  const money = useGameUI((s) => s.money);
  const cargo = useGameUI((s) => s.cargo);
  const cargoMax = useGameUI((s) => s.cargoMax);
  const depth = useGameUI((s) => s.depth);
  const stratum = useGameUI((s) => s.stratum);
  const prompt = useGameUI((s) => s.prompt);
  const items = useGameUI((s) => s.items);
  const muted = useGameUI((s) => s.muted);
  const hellUnlocked = useGameUI((s) => s.hellUnlocked);
  const coolantT = useGameUI((s) => s.coolantT);

  if (phase === "title" || phase === "help") return null;

  const hellish =
    stratum === "Emberward" || stratum === "Brimdeep" || stratum === "Heartfire";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-3 pl-[max(0.75rem,env(safe-area-inset-left))]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 short:flex-row short:flex-wrap short:gap-1">
          <Meter
            icon={<Shield className="size-3.5" />}
            label="Hull"
            value={hull}
            max={maxHull}
            tone="hull"
          />
          <Meter
            icon={<Fuel className="size-3.5" />}
            label="Fuel"
            value={fuel}
            max={maxFuel}
            tone="fuel"
          />
          <Meter
            icon={<Box className="size-3.5" />}
            label="Cargo"
            value={cargo.length}
            max={cargoMax}
            tone="cargo"
            discrete
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 short:flex-row-reverse short:items-start">
          <div className="flex gap-1.5">
            {finger ? (
              <button
                type="button"
                className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-border bg-surface text-fg"
                onClick={() => getGame()?.setMuted(!muted)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            ) : null}
            <button
              type="button"
              className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-border bg-surface text-fg"
              onClick={() => getGame()?.setPhase("paused")}
              aria-label="Pause"
            >
              <Pause className="size-4" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1.5 short:flex-row short:items-start">
            <div className="rounded-lg border border-border bg-surface/90 px-3 py-1.5 shadow-panel short:py-1">
              <p className="font-display text-lg font-semibold leading-none tracking-wide text-fg tabular-nums short:text-base">
                ${Math.floor(money).toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                ledger
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/90 px-3 py-1.5 short:py-1">
              <p className="font-display text-base font-semibold leading-none tabular-nums">{depth} m</p>
              <p
                className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
                  hellish ? "text-copper" : "text-muted"
                }`}
              >
                {stratum}
              </p>
            </div>
            {hellish && coolantT <= 0 ? (
              <div className="rounded-lg border border-copper/40 bg-surface/90 px-3 py-1.5 short:py-1">
                <p className="font-display text-sm font-semibold leading-none text-copper">Heat</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  ambient
                </p>
              </div>
            ) : null}
            {coolantT > 0 ? (
              <div className="rounded-lg border border-border bg-surface/90 px-3 py-1.5 short:py-1">
                <p className="font-display text-base font-semibold leading-none tabular-nums text-fuel">
                  {Math.ceil(coolantT)}s
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  coolant
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`flex items-end justify-between gap-3 ${finger ? "mb-52 short:mb-28" : "mb-0"}`}>
        <div className={finger ? "hidden" : "flex gap-1.5"}>
          <ItemChip icon={<Bomb className="size-3.5" />} n={items.dynamite} k="Space" />
          <ItemChip icon={<Fuel className="size-3.5" />} n={items.fuelCan} k="F" />
          <ItemChip icon={<Wrench className="size-3.5" />} n={items.nanobots} k="R" />
          <ItemChip icon={<Radio className="size-3.5" />} n={items.teleporter} k="T" />
          {hellUnlocked ? (
            <>
              <ItemChip icon={<Flame className="size-3.5" />} n={items.hellcharge} k="X" />
              <ItemChip icon={<Snowflake className="size-3.5" />} n={items.coolant} k="C" />
            </>
          ) : null}
        </div>
        <div className="mx-auto max-w-[min(420px,92vw)] text-center">
          {prompt ? (
            <p className="rounded-full border border-border bg-surface/90 px-4 py-2 text-sm text-fg shadow-panel">
              {prompt}
            </p>
          ) : null}
        </div>
        {finger ? null : (
          <button
            type="button"
            className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-border bg-surface"
            onClick={() => getGame()?.setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Meter({
  icon,
  label,
  value,
  max,
  tone,
  discrete,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  max: number;
  tone: "hull" | "fuel" | "cargo";
  discrete?: boolean;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const fill =
    tone === "hull" ? "bg-hull" : tone === "fuel" ? "bg-fuel" : "bg-cargo";
  const warn = pct < 0.22;
  return (
    <div className="max-w-40 rounded-lg border border-border bg-surface/90 px-2 py-1.5 shadow-panel short:max-w-36 short:py-1 sm:max-w-64 sm:px-2.5">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        <span className="flex items-center gap-1.5 text-fg">
          {icon}
          {label}
        </span>
        <span className={`tabular-nums ${warn ? "text-danger" : "text-fg"}`}>
          {discrete ? `${value}/${max}` : `${Math.ceil(value)}/${Math.ceil(max)}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function ItemChip({ icon, n, k }: { icon: ReactNode; n: number; k: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface/90 px-2 py-1 text-xs text-muted">
      {icon}
      <span className="tabular-nums text-fg">{n}</span>
      <span className="text-[10px] uppercase tracking-wider">{k}</span>
    </div>
  );
}

function TitleScreen() {
  const phase = useGameUI((s) => s.phase);
  const hasSave = useGameUI((s) => s.hasSave);
  const bestDepth = useGameUI((s) => s.bestDepth);
  const kilnFed = useGameUI((s) => s.kilnFed);
  if (phase !== "title") return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end overflow-y-auto overscroll-contain bg-gradient-to-t from-bg via-bg/80 to-transparent px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted short:hidden">
          CC33 · The Well
        </p>
        <h1 className="font-display mt-2 text-6xl font-semibold leading-none tracking-wide text-fg short:mt-0 short:text-4xl">
          CINDERWELL
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted short:hidden">
          Drill the scorched crust. Haul ore to the Exchange. Veins pay more the deeper you cut.
          Past the Emberward, the Kiln forges iron the surface shops will not touch.
        </p>
        <div className="mt-8 flex flex-col gap-3 short:mt-4 short:grid short:grid-cols-2 sm:flex-row sm:flex-wrap short:sm:grid">
          <button
            type="button"
            className="h-12 rounded-xl bg-accent px-6 font-medium text-accent-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98] short:col-span-2"
            onClick={() => getGame()?.descend(true)}
          >
            New descent
          </button>
          {hasSave ? (
            <button
              type="button"
              className="h-12 rounded-xl border border-border bg-surface px-6 font-medium text-fg transition-transform duration-150 active:scale-[0.98]"
              onClick={() => getGame()?.descend(false)}
            >
              Continue
            </button>
          ) : null}
          <button
            type="button"
            className="h-12 rounded-xl border border-border bg-surface px-6 font-medium text-fg"
            onClick={() => getGame()?.openSaveMenu("load")}
          >
            Claims
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-border bg-transparent px-6 font-medium text-muted"
            onClick={() => getGame()?.setPhase("help")}
          >
            How to drill
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-border bg-transparent px-6 font-medium text-muted"
            onClick={() => getGame()?.openSettings()}
          >
            Settings
          </button>
          <ShareWell className="flex h-12 items-center justify-center rounded-xl border border-border bg-transparent px-6 font-medium text-muted" />
        </div>
        <KilnSpeak className="mt-4" />
        <p className="mt-3 max-w-md text-sm text-subtle short:hidden">
          {kilnFed
            ? "Kiln 33 took the offering. Descend in a finished rig — Heartbit, Molten Aegis, the whole rack."
            : "Press and drag — the rig follows your finger. WASD still works."}
        </p>
        <Link
          to="/"
          search={{ club: true }}
          className="mt-4 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] uppercase text-muted hover:text-fg"
        >
          Back to the club
        </Link>
        {bestDepth > 0 ? (
          <p className="mt-5 text-sm text-subtle tabular-nums short:mt-3">Best depth {bestDepth} m</p>
        ) : null}
      </div>
    </div>
  );
}

function HelpScreen() {
  const phase = useGameUI((s) => s.phase);
  if (phase !== "help") return null;
  return (
    <Modal onClose={() => getGame()?.setPhase("title")}>
      <h2 className="font-display pr-12 text-3xl font-semibold tracking-wide short:text-2xl">The shift</h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
        You run a one-rig claim on a dying moon. Dirt hardens with depth, and the same ore is
        worth more the farther down you take it. Fuel empty or hull gone means the rig cooks —
        cargo is lost, a salvage fee is taken, and you wake up on the pad.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-fg">
        <li>
          <strong className="font-medium">WASD / arrows</strong> — move, thrust, and drill into earth.
        </li>
        <li>
          <strong className="font-medium">Pointer / finger</strong> — press anywhere and drag
          the way you want to go. The swipe is the heading, not the tap on the map. Charge sits
          under the right thumb on a phone.
        </li>
        <li>
          <strong className="font-medium">E</strong> — open a surface shop (Exchange, Rigworks, Depot).
          The Kiln unseals after you breach the Emberward.
        </li>
        <li>
          <strong className="font-medium">Space</strong> — blast a charge. <strong>F / R / T</strong> — spare
          can, patch kit, recall. <strong>X / C</strong> — hellcharge and coolant, sold at the Kiln.
        </li>
        <li>
          <strong className="font-medium">Lattice</strong> — unseals after Heartfire, east of the
          Depot. Club iron: phase bit, welltap, resonator, anchor, letterlock. V nullcharge, N
          plant a nail, G vein bell, Q Chorus sell from below. On a phone, pause or Rig setup
          and speak to the Kiln.
        </li>
        <li>
          <strong className="font-medium">Esc</strong> — pause. Sell often. Finish Rigworks, then push the
          first hell gate — maxed surface iron can take Emberward. Three claims stay in this browser.
        </li>
      </ul>
      <button
        type="button"
        className="mt-6 h-11 w-full rounded-xl bg-accent font-medium text-accent-fg"
        onClick={() => getGame()?.setPhase("title")}
      >
        Back
      </button>
    </Modal>
  );
}

function SettingsScreen() {
  const phase = useGameUI((s) => s.phase);
  const cab = useGameUI((s) => s.settings);
  const fullscreen = useGameUI((s) => s.fullscreen);
  if (phase !== "settings") return null;
  const patch = (p: Partial<typeof cab>) => getGame()?.patchSettings(p);
  return (
    <Modal onClose={() => getGame()?.closeSettings()}>
      <h2 className="font-display pr-12 text-3xl font-semibold tracking-wide short:text-2xl">Rig setup</h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
        Cab noise, lamp zoom, and claims. These stay in this browser.
      </p>

      <Section label="Sound">
        <Row label="Volume" hint={`${Math.round(cab.volume * 100)}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(cab.volume * 100)}
            aria-label="Volume"
            className="h-11 w-full accent-accent"
            onChange={(e) => patch({ volume: Number(e.target.value) / 100, muted: false })}
          />
        </Row>
        <Toggle
          label="Mute cab"
          hint="Silence the rig without losing your volume."
          on={cab.muted}
          onChange={(on) => getGame()?.setMuted(on)}
        />
      </Section>

      <Section label="Comfort">
        <Toggle
          label="Cabin shake"
          hint="Hits and blasts kick the lamp."
          on={cab.shake}
          onChange={(on) => patch({ shake: on })}
        />
        <Toggle
          label="Grit and sparks"
          hint="Debris from the bit. Turn off if the well feels busy."
          on={cab.grit}
          onChange={(on) => patch({ grit: on })}
        />
        <Toggle
          label="Pause when I leave"
          hint="If you switch apps mid-cut, the shift holds."
          on={cab.pauseOnBlur}
          onChange={(on) => patch({ pauseOnBlur: on })}
        />
        <Toggle
          label="Haptics"
          hint="A short buzz when a hold starts, if the glass can."
          on={cab.haptics}
          onChange={(on) => patch({ haptics: on })}
        />
      </Section>

      <Section label="Controls">
        <Toggle
          label="Cut compass"
          hint="Drag pad under your finger, lighting the way you are cutting."
          on={cab.compass}
          onChange={(on) => patch({ compass: on })}
        />
        <Toggle
          label="Invert up / down"
          hint="Drag up to cut down, down to lift."
          on={cab.invertY}
          onChange={(on) => patch({ invertY: on })}
        />
        <div>
          <p className="text-sm font-medium text-fg">Aim slack</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            How far you have to drag before the rig takes a heading.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(["tight", "normal", "wide"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={cab.deadzone === d}
                onClick={() => patch({ deadzone: d })}
                className={`h-11 rounded-lg border text-sm font-medium capitalize ${
                  cab.deadzone === d
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-elevated text-fg"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section label="Display">
        <Row label="Zoom" hint={`${Math.round(cab.zoom * 100)}%`}>
          <input
            type="range"
            min={80}
            max={180}
            step={5}
            value={Math.round(cab.zoom * 100)}
            aria-label="Zoom"
            className="h-11 w-full accent-accent"
            onChange={(e) => patch({ zoom: Number(e.target.value) / 100 })}
          />
        </Row>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ["Far", 0.9],
              ["Default", 1.3],
              ["Close", 1.65],
            ] as const
          ).map(([label, z]) => (
            <button
              key={label}
              type="button"
              aria-pressed={Math.abs(cab.zoom - z) < 0.03}
              onClick={() => patch({ zoom: z })}
              className={`h-11 rounded-lg border text-sm font-medium ${
                Math.abs(cab.zoom - z) < 0.03
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border bg-elevated text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Toggle
          label="Fill the glass"
          hint="Fullscreen this tab. The browser may ask first."
          on={fullscreen}
          onChange={() => getGame()?.toggleFullscreen()}
        />
      </Section>

      <Section label="Claims">
        <p className="text-xs leading-relaxed text-muted">
          Three ledgers live in this browser. The well writes while you cut. Keep a file copy if
          you change machines.
        </p>
        <button
          type="button"
          className="h-11 w-full rounded-xl border border-border bg-elevated px-4 text-left text-sm font-medium text-fg"
          onClick={() => getGame()?.saveNow()}
        >
          Save claim in this browser
        </button>
        <button
          type="button"
          className="h-11 w-full rounded-xl border border-border bg-elevated px-4 text-left text-sm font-medium text-fg"
          onClick={() => getGame()?.openSaveMenu("save")}
        >
          Open claims
        </button>
        <button
          type="button"
          className="h-11 w-full rounded-xl border border-border bg-elevated px-4 text-left text-sm font-medium text-fg"
          onClick={() => getGame()?.exportClaim()}
        >
          Download claim file
        </button>
        <label className="flex h-11 w-full cursor-pointer items-center rounded-xl border border-border bg-elevated px-4 text-sm font-medium text-fg">
          Load claim file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void file.text().then((t) => getGame()?.importClaimText(t));
            }}
          />
        </label>
      </Section>

      <Section label="Kiln">
        <KilnSpeak />
      </Section>

      <button
        type="button"
        className="mt-5 h-12 w-full rounded-xl bg-accent font-medium text-accent-fg short:mt-3"
        onClick={() => getGame()?.closeSettings()}
      >
        Back
      </button>
    </Modal>
  );
}

function KilnSpeak({ className = "" }: { className?: string }) {
  const fed = useGameUI((s) => s.kilnFed);
  const [value, setValue] = useState("");
  const [miss, setMiss] = useState(false);
  if (fed) {
    return (
      <p className={`text-sm leading-relaxed text-muted ${className}`.trim()}>
        Kiln 33 took the offering. Heartbit is on the rack.
      </p>
    );
  }
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const ok = getGame()?.speakOffering(value) ?? false;
        setMiss(!ok);
        if (ok) setValue("");
      }}
    >
      <label className="block">
        <span className="text-sm font-medium text-fg">The Kiln listens</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
          Speak an offering. Letters only — no need for a desk keyboard.
        </span>
        <span className="mt-2 flex gap-2">
          <input
            type="text"
            name="offering"
            value={value}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            inputMode="text"
            placeholder="Offering"
            aria-label="Kiln offering"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
            onChange={(e) => {
              setValue(e.target.value);
              setMiss(false);
            }}
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Offer
          </button>
        </span>
      </label>
      {miss ? <p className="mt-1.5 text-xs text-danger">The Kiln does not know that name.</p> : null}
    </form>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-border pt-4 short:mt-3 short:pt-3">
      <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</h3>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fg">{label}</span>
        {hint ? <span className="text-xs tabular-nums text-muted">{hint}</span> : null}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-elevated px-3 py-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-accent" : "bg-border"}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-accent-fg transition-transform duration-150 ${
            on ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function PauseScreen() {
  const phase = useGameUI((s) => s.phase);
  const muted = useGameUI((s) => s.muted);
  const atSurface = useGameUI((s) => s.atSurface);
  const hellUnlocked = useGameUI((s) => s.hellUnlocked);
  const latticeOpen = useGameUI((s) => s.latticeOpen);
  if (phase !== "paused") return null;
  return (
    <Modal onClose={() => getGame()?.setPhase("playing")}>
      <h2 className="font-display pr-12 text-3xl font-semibold tracking-wide short:text-2xl">Paused</h2>
      <div className="mt-6 flex flex-col gap-2 short:mt-3 short:gap-1.5">
        <MenuBtn onClick={() => getGame()?.setPhase("playing")}>Resume</MenuBtn>
        {atSurface ? (
          <>
            <MenuBtn onClick={() => getGame()?.openShop("exchange")}>Exchange</MenuBtn>
            <MenuBtn onClick={() => getGame()?.openShop("rigworks")}>Rigworks</MenuBtn>
            <MenuBtn onClick={() => getGame()?.openShop("depot")}>Depot</MenuBtn>
            {hellUnlocked ? (
              <MenuBtn onClick={() => getGame()?.openShop("kiln")}>Kiln</MenuBtn>
            ) : null}
            {latticeOpen ? (
              <MenuBtn onClick={() => getGame()?.openShop("lattice")}>Lattice</MenuBtn>
            ) : null}
          </>
        ) : (
          <p className="px-1 py-2 text-sm text-muted">Surface shops unlock when you return to the pad.</p>
        )}
        <MenuBtn onClick={() => getGame()?.setMuted(!muted)}>{muted ? "Unmute" : "Mute"}</MenuBtn>
        <MenuBtn onClick={() => getGame()?.openSettings()}>Settings</MenuBtn>
        <KilnSpeak />
        <MenuBtn onClick={() => getGame()?.saveNow()}>Save claim</MenuBtn>
        <MenuBtn onClick={() => getGame()?.openSaveMenu("save")}>Claims</MenuBtn>
        <MenuBtn onClick={() => getGame()?.setPhase("title")}>Abandon shift</MenuBtn>
        <ShareWell className="flex h-12 items-center rounded-xl border border-border bg-elevated px-4 text-left font-medium text-fg short:h-11" />
        <MenuLink to="/">Leave the well</MenuLink>
      </div>
    </Modal>
  );
}

function savedAgo(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function ClaimsScreen() {
  const mode = useGameUI((s) => s.saveMenu);
  const phase = useGameUI((s) => s.phase);
  const slots = useGameUI((s) => s.slots);
  const active = useGameUI((s) => s.activeSlot);
  const [pending, setPending] = useState<null | { i: number; act: "erase" | "overwrite" }>(null);
  useEffect(() => {
    setPending(null);
  }, [mode]);
  if (!mode) return null;
  const inRun = phase === "playing" || phase === "paused" || phase === "shop" || phase === "dead";
  const heading = mode === "new" ? "Overwrite a claim" : mode === "save" ? "Stow a claim" : "Claims";
  const blurb =
    mode === "new"
      ? "All three claims are taken. Pick one to overwrite for a new descent. They only live in this browser."
      : "Three ledgers on this browser. The rig also autosaves the active claim while you dig.";
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center short:p-0 short:sm:items-stretch">
      <div className="relative max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-5 shadow-panel touch-pan-y sm:p-6 short:max-h-none short:h-full short:rounded-none">
        <button
          type="button"
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-lg text-muted hover:text-fg"
          onClick={() => {
            setPending(null);
            getGame()?.closeSaveMenu();
          }}
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2 className="font-display pr-10 text-3xl font-semibold tracking-wide short:text-2xl">{heading}</h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">{blurb}</p>
        <ul className="mt-5 space-y-2">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const slot = slots[i] ?? null;
            const name = CLAIM_NAMES[i]!;
            const busy = pending?.i === i ? pending.act : null;
            return (
              <li key={name} className="rounded-xl border border-border bg-elevated p-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                    {name}
                    {active === i ? " · active" : ""}
                  </p>
                  {slot ? (
                    <>
                      <p className="mt-1 font-medium text-fg">
                        {slot.stratum} · {slot.depth.toLocaleString()} m
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        ${slot.money.toLocaleString()} · {savedAgo(slot.savedAt)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted">Empty ledger.</p>
                  )}
                </div>
                {busy === "erase" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="h-11 flex-1 rounded-lg bg-danger px-3 text-sm font-medium text-fg"
                      onClick={() => {
                        getGame()?.eraseSlot(i);
                        setPending(null);
                      }}
                    >
                      Erase
                    </button>
                    <button
                      type="button"
                      className="h-11 flex-1 rounded-lg border border-border px-3 text-sm font-medium text-fg"
                      onClick={() => setPending(null)}
                    >
                      Keep
                    </button>
                  </div>
                ) : busy === "overwrite" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="h-11 flex-1 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg"
                      onClick={() => {
                        if (mode === "save" && inRun) getGame()?.saveToSlot(i);
                        else getGame()?.newInSlot(i);
                        setPending(null);
                      }}
                    >
                      Overwrite
                    </button>
                    <button
                      type="button"
                      className="h-11 flex-1 rounded-lg border border-border px-3 text-sm font-medium text-fg"
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slot ? (
                      <>
                        <button
                          type="button"
                          className="h-11 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg"
                          onClick={() => getGame()?.loadFromSlot(i)}
                        >
                          Load
                        </button>
                        {mode === "new" ? (
                          <button
                            type="button"
                            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg"
                            onClick={() => setPending({ i, act: "overwrite" })}
                          >
                            New descent
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <button
                        type="button"
                        className="h-11 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg"
                        onClick={() => getGame()?.newInSlot(i)}
                      >
                        New descent
                      </button>
                    )}
                    {inRun ? (
                      <button
                        type="button"
                        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg"
                        onClick={() => {
                          if (slot && active !== i) setPending({ i, act: "overwrite" });
                          else getGame()?.saveToSlot(i);
                        }}
                      >
                        Stow here
                      </button>
                    ) : null}
                    {slot && !(inRun && active === i) ? (
                      <button
                        type="button"
                        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-muted"
                        onClick={() => setPending({ i, act: "erase" })}
                      >
                        Erase
                      </button>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DeadScreen() {
  const phase = useGameUI((s) => s.phase);
  const reason = useGameUI((s) => s.deathReason);
  const salvage = useGameUI((s) => s.salvage);
  const cargoLost = useGameUI((s) => s.cargoLost);
  if (phase !== "dead") return null;
  const why =
    reason === "fuel"
      ? "The tank ran dry."
      : reason === "fall"
        ? "The drop crushed the cage."
        : reason === "heat"
          ? "The well's heat cooked the cab."
          : reason === "magma"
            ? "Magma ate through the plates."
            : reason === "gas"
              ? "A gas pocket filled the cab."
              : "The hull folded.";
  return (
    <Modal>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-danger">Rig lost</p>
      <h2 className="font-display mt-2 text-4xl font-semibold tracking-wide">Down well</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{why} Unsold cargo is gone.</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-muted">Cargo lost</dt>
          <dd className="font-display mt-1 text-xl tabular-nums">${cargoLost.toLocaleString()}</dd>
        </div>
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-muted">Salvage fee</dt>
          <dd className="font-display mt-1 text-xl tabular-nums">${salvage.toLocaleString()}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="mt-6 h-12 w-full rounded-xl bg-accent font-medium text-accent-fg"
        onClick={() => getGame()?.resurface()}
      >
        Recover at the pad
      </button>
    </Modal>
  );
}

function ShopScreen() {
  const phase = useGameUI((s) => s.phase);
  const shop = useGameUI((s) => s.shop);
  if (phase !== "shop" || !shop) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/70 p-3 sm:items-center sm:p-6 short:items-stretch short:p-0 short:sm:items-stretch short:sm:p-0">
      <div className="flex max-h-[min(92dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-panel short:max-h-none short:h-full short:rounded-none">
        <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2 sm:px-4 sm:py-3">
          <ShopTabs current={shop} />
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-fg"
            onClick={() => getGame()?.closeShop()}
            aria-label="Close shop"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] touch-pan-y">
          {shop === "exchange" ? <ExchangePanel /> : null}
          {shop === "rigworks" ? <RigworksPanel /> : null}
          {shop === "depot" ? <DepotPanel /> : null}
          {shop === "kiln" ? <KilnPanel /> : null}
          {shop === "lattice" ? <LatticePanel /> : null}
        </div>
      </div>
    </div>
  );
}

function ShopTabs({ current }: { current: ShopId }) {
  const hellUnlocked = useGameUI((s) => s.hellUnlocked);
  const latticeOpen = useGameUI((s) => s.latticeOpen);
  return (
    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
      {visibleBuildings(hellUnlocked, latticeOpen).map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => getGame()?.openShop(b.id)}
          className={`h-11 shrink-0 rounded-lg px-3 text-sm font-medium ${
            current === b.id ? "bg-elevated text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}

function ExchangePanel() {
  const cargo = useGameUI((s) => s.cargo);
  const money = useGameUI((s) => s.money);
  const total = cargoValue(cargo);
  const counts = new Map<string, { n: number; value: number; color: string }>();
  for (const c of cargo) {
    const o = ORES.find((x) => x.id === c.id);
    const cur = counts.get(c.name) ?? { n: 0, value: 0, color: o?.color ?? "#c4a574" };
    cur.n += 1;
    cur.value += c.value;
    counts.set(c.name, cur);
  }
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide short:text-xl">Mineral Exchange</h2>
          <p className="mt-1 text-sm text-muted">
            Dump the haul. Credits hit the ledger immediately. The assay pays a depth premium —
            the same vein is worth more the farther down you took it.
          </p>
        </div>
        <p className="font-display text-2xl tabular-nums">${Math.floor(money).toLocaleString()}</p>
      </div>
      {cargo.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Hold is empty. Go dig.</p>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {[...counts.entries()].map(([name, v]) => (
            <li key={name} className="flex items-center justify-between py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: v.color }} />
                {name}
                <span className="text-muted tabular-nums">×{v.n}</span>
              </span>
              <span className="tabular-nums">${v.value.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={total <= 0}
        onClick={() => getGame()?.sellAll()}
        className="mt-6 h-12 w-full rounded-xl bg-accent font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sell haul · ${total.toLocaleString()}
      </button>
    </div>
  );
}

function RigworksPanel() {
  const upgrades = useGameUI((s) => s.upgrades);
  const money = useGameUI((s) => s.money);
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-wide">Rigworks</h2>
      <p className="mt-1 text-sm text-muted">
        Bolt on better iron. Fitted parts stay with the rig. Hell-forged lines wait at the Kiln
        after you breach Emberward.
      </p>
      <p className="mt-2 text-sm tabular-nums text-fg">${Math.floor(money).toLocaleString()} on hand</p>
      <ul className="mt-5 space-y-2">
        {BASE_SLOTS.map((slot) => {
          const i = upgrades[slot];
          const cur = UPGRADES[slot][i]!;
          const next = i < RIGWORKS_MAX ? UPGRADES[slot][i + 1] : undefined;
          const kilnNext = i >= RIGWORKS_MAX && i < KILN_BASE_MAX ? UPGRADES[slot][i + 1] : undefined;
          const latticeNext = i >= KILN_BASE_MAX ? UPGRADES[slot][i + 1] : undefined;
          return (
            <li
              key={slot}
              className="flex flex-col gap-2 rounded-xl border border-border bg-elevated p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  {SLOT_LABEL[slot]}
                </p>
                <p className="font-medium text-fg">{cur.name}</p>
                <p className="text-xs text-muted">{SLOT_BLURB[slot]}</p>
                {next ? (
                  <p className="mt-1 text-xs text-fg">
                    Next: {next.name} · ${next.cost.toLocaleString()}
                  </p>
                ) : kilnNext ? (
                  <p className="mt-1 text-xs text-muted">
                    Next: {kilnNext.name} — forged at the Kiln.
                  </p>
                ) : latticeNext ? (
                  <p className="mt-1 text-xs text-muted">
                    Next: {latticeNext.name} — fitted at the Lattice.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Top of the line.</p>
                )}
              </div>
              {next ? (
                <button
                  type="button"
                  disabled={money < next.cost}
                  onClick={() => getGame()?.buyUpgrade(slot)}
                  className="h-11 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Fit
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DepotPanel() {
  const fuel = useGameUI((s) => s.fuel);
  const maxFuel = useGameUI((s) => s.maxFuel);
  const hull = useGameUI((s) => s.hull);
  const maxHull = useGameUI((s) => s.maxHull);
  const money = useGameUI((s) => s.money);
  const items = useGameUI((s) => s.items);
  const fuelCost = Math.ceil(Math.max(0, maxFuel - fuel) * FUEL_PRICE);
  const hullCost = Math.ceil(Math.max(0, maxHull - hull) * HULL_PRICE);
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-wide">Depot</h2>
      <p className="mt-1 text-sm text-muted">Fill the tank. Beat the dents out. Stock the bay.</p>
      <p className="mt-2 text-sm tabular-nums">${Math.floor(money).toLocaleString()} on hand</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <DepotAction
          icon={<Fuel className="size-4" />}
          title="Top off fuel"
          meta={`${Math.ceil(fuel)} / ${Math.ceil(maxFuel)} · $${fuelCost}`}
          disabled={fuelCost <= 0 || money <= 0}
          onClick={() => getGame()?.fillFuel()}
        />
        <DepotAction
          icon={<Shield className="size-4" />}
          title="Repair hull"
          meta={`${Math.ceil(hull)} / ${Math.ceil(maxHull)} · $${hullCost}`}
          disabled={hullCost <= 0 || money <= 0}
          onClick={() => getGame()?.repairHull()}
        />
      </div>
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Stores</h3>
      <ul className="mt-2 space-y-2">
        {(Object.keys(CONSUMABLES) as ConsumableId[])
          .filter((id) => CONSUMABLES[id].shop === "depot")
          .map((id) => {
          const c = CONSUMABLES[id];
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5"
            >
              <div>
                <p className="font-medium">
                  {c.name}{" "}
                  <span className="text-xs font-normal text-muted tabular-nums">×{items[id]}</span>
                </p>
                <p className="text-xs text-muted">{c.desc}</p>
              </div>
              <button
                type="button"
                disabled={money < c.cost}
                onClick={() => getGame()?.buyItem(id)}
                className="h-11 shrink-0 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
              >
                ${c.cost}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function KilnPanel() {
  const upgrades = useGameUI((s) => s.upgrades);
  const money = useGameUI((s) => s.money);
  const items = useGameUI((s) => s.items);
  const forged = BASE_SLOTS.filter((slot) => {
    const i = upgrades[slot];
    return i >= RIGWORKS_MAX && i < KILN_BASE_MAX && UPGRADES[slot][i + 1];
  });
  const kilnItems = (Object.keys(CONSUMABLES) as ConsumableId[]).filter(
    (id) => CONSUMABLES[id].shop === "kiln",
  );
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-wide">The Kiln</h2>
      <p className="mt-1 text-sm text-muted">
        Hell-forged iron, sold only after the Emberward. Max the Rigworks line first, then the
        Kiln takes the next step. Scanner, lift coil, and ash veil live here.
      </p>
      <p className="mt-2 text-sm tabular-nums text-fg">${Math.floor(money).toLocaleString()} on hand</p>
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        Hell-forged
      </h3>
      {forged.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Finish a Rigworks line to forge the next step.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {forged.map((slot) => (
            <FitRow key={slot} slot={slot} />
          ))}
        </ul>
      )}
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Modules</h3>
      <ul className="mt-2 space-y-2">
        {KILN_MODULE_SLOTS.map((slot) => (
          <FitRow key={slot} slot={slot} />
        ))}
      </ul>
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Hell stores</h3>
      <ul className="mt-2 space-y-2">
        {kilnItems.map((id) => {
          const c = CONSUMABLES[id];
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5"
            >
              <div>
                <p className="font-medium">
                  {c.name}{" "}
                  <span className="text-xs font-normal text-muted tabular-nums">×{items[id]}</span>
                </p>
                <p className="text-xs text-muted">{c.desc}</p>
              </div>
              <button
                type="button"
                disabled={money < c.cost}
                onClick={() => getGame()?.buyItem(id)}
                className="h-11 shrink-0 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
              >
                ${c.cost}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LatticePanel() {
  const upgrades = useGameUI((s) => s.upgrades);
  const money = useGameUI((s) => s.money);
  const items = useGameUI((s) => s.items);
  const latticeItems = (Object.keys(CONSUMABLES) as ConsumableId[]).filter(
    (id) => CONSUMABLES[id].shop === "lattice",
  );
  const hullReady = upgrades.hull >= KILN_BASE_MAX;
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-wide">The Lattice</h2>
      <p className="mt-1 text-sm text-muted">
        Club iron. Not hell iron. The booth unseals after Heartfire. These modules change a
        descent — they do not just make the bit louder.
      </p>
      <p className="mt-2 text-sm tabular-nums text-fg">${Math.floor(money).toLocaleString()} on hand</p>
      {hullReady ? (
        <>
          <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Aegis</h3>
          <ul className="mt-2 space-y-2">
            <FitRow slot="hull" />
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">Lattice Skin waits on a finished Molten Aegis.</p>
      )}
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Modules</h3>
      <ul className="mt-2 space-y-2">
        {LATTICE_SLOTS.map((slot) => (
          <FitRow key={slot} slot={slot} />
        ))}
      </ul>
      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Stores</h3>
      <ul className="mt-2 space-y-2">
        {latticeItems.map((id) => {
          const c = CONSUMABLES[id];
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5"
            >
              <div>
                <p className="font-medium">
                  {c.name}{" "}
                  <span className="text-xs font-normal text-muted tabular-nums">×{items[id]}</span>
                </p>
                <p className="text-xs text-muted">{c.desc}</p>
              </div>
              <button
                type="button"
                disabled={money < c.cost}
                onClick={() => getGame()?.buyItem(id)}
                className="h-11 shrink-0 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
              >
                ${c.cost.toLocaleString()}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FitRow({ slot }: { slot: Slot }) {
  const upgrades = useGameUI((s) => s.upgrades);
  const money = useGameUI((s) => s.money);
  const i = upgrades[slot];
  const cur = UPGRADES[slot][i]!;
  const next = UPGRADES[slot][i + 1];
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-elevated p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">{SLOT_LABEL[slot]}</p>
        <p className="font-medium text-fg">{cur.name}</p>
        <p className="text-xs text-muted">{SLOT_BLURB[slot]}</p>
        {next ? (
          <p className="mt-1 text-xs text-fg">
            Next: {next.name} · ${next.cost.toLocaleString()}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted">Top of the line.</p>
        )}
      </div>
      {next ? (
        <button
          type="button"
          disabled={money < next.cost}
          onClick={() => getGame()?.buyUpgrade(slot)}
          className="h-11 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Fit
        </button>
      ) : null}
    </li>
  );
}

function DepotAction({
  icon,
  title,
  meta,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-elevated p-3 text-left disabled:opacity-40"
    >
      <span className="mt-0.5 text-fg">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted tabular-nums">{meta}</span>
      </span>
    </button>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/70 p-4 sm:items-center short:p-0 short:sm:items-stretch">
      <div className="relative max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-5 shadow-panel touch-pan-y sm:p-6 short:max-h-none short:h-full short:rounded-none">
        {onClose ? (
          <button
            type="button"
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function ShareWell({ className }: { className: string }) {
  const [href, setHref] = useState("https://x.com/intent/post");
  useEffect(() => {
    setHref(wellXPost().href);
  }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      Post on X
    </a>
  );
}

function MenuBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-xl border border-border bg-elevated px-4 text-left font-medium text-fg transition-transform duration-150 active:scale-[0.98] short:h-11"
    >
      {children}
    </button>
  );
}

function MenuLink({ children, to }: { children: ReactNode; to: "/" }) {
  return (
    <Link
      to={to}
      search={{ club: true }}
      className="flex h-12 items-center rounded-xl border border-border bg-elevated px-4 text-left font-medium text-fg short:h-11"
    >
      {children}
    </Link>
  );
}

function TouchPad({ finger }: { finger: boolean }) {
  const phase = useGameUI((s) => s.phase);
  const items = useGameUI((s) => s.items);
  const nearby = useGameUI((s) => s.nearby);
  const hellUnlocked = useGameUI((s) => s.hellUnlocked);
  const latticeOpen = useGameUI((s) => s.latticeOpen);
  const upgrades = useGameUI((s) => s.upgrades);
  const cargo = useGameUI((s) => s.cargo);
  const atSurface = useGameUI((s) => s.atSurface);
  if (!finger || phase !== "playing") return null;

  const fire = (
    key:
      | "interact"
      | "dynamite"
      | "hellcharge"
      | "fuelCan"
      | "nanobots"
      | "teleporter"
      | "coolant"
      | "nullcharge"
      | "plantNail"
      | "chorus"
      | "veinBell",
  ) => {
    const g = getGame();
    if (g) g.input.touch[key] = true;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute right-[max(0.6rem,env(safe-area-inset-right))] bottom-[max(0.55rem,env(safe-area-inset-bottom))] flex flex-col items-end gap-1.5 short:flex-row short:items-end">
        <div className="flex max-w-[11rem] flex-wrap justify-end gap-1.5 short:max-w-none short:flex-col">
          <IconAct icon={<Fuel className="size-4" />} n={items.fuelCan} label="Spare can" onFire={() => fire("fuelCan")} />
          <IconAct icon={<Wrench className="size-4" />} n={items.nanobots} label="Patch kit" onFire={() => fire("nanobots")} />
          <IconAct icon={<Radio className="size-4" />} n={items.teleporter} label="Recall" onFire={() => fire("teleporter")} />
          {hellUnlocked ? (
            <>
              <IconAct icon={<Flame className="size-4" />} n={items.hellcharge} label="Hellcharge" onFire={() => fire("hellcharge")} />
              <IconAct icon={<Snowflake className="size-4" />} n={items.coolant} label="Coolant" onFire={() => fire("coolant")} />
            </>
          ) : null}
          {latticeOpen ? (
            <IconAct icon={<Hexagon className="size-4" />} n={items.nullcharge} label="Nullcharge" onFire={() => fire("nullcharge")} />
          ) : null}
          {upgrades.anchor >= 1 ? (
            <IconAct icon={<Anchor className="size-4" />} n={1} label="Plant nail" onFire={() => fire("plantNail")} />
          ) : null}
          {upgrades.resonator >= 1 ? (
            <IconAct icon={<Aperture className="size-4" />} n={1} label="Vein bell" onFire={() => fire("veinBell")} />
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {nearby ? <ActionBtn label="Shop" onClick={() => fire("interact")} /> : null}
          {upgrades.resonator >= 3 && cargo.length > 0 && !atSurface ? (
            <ActionBtn label="Chorus" onClick={() => fire("chorus")} />
          ) : null}
          <ActionBtn label={`Charge ${items.dynamite}`} onClick={() => fire("dynamite")} />
        </div>
      </div>
    </div>
  );
}

function setTouchAxis(x: number, y: number): void {
  const g = getGame();
  if (!g) return;
  g.input.touch.moveX = x;
  g.input.touch.moveY = y;
}

function setDrillHeld(on: boolean): void {
  const g = getGame();
  if (!g) return;
  g.input.touch.drill = on;
}

function SteerField() {
  const phase = useGameUI((s) => s.phase);
  const compass = useGameUI((s) => s.settings.compass);
  const haptics = useGameUI((s) => s.settings.haptics);
  const padRef = useRef<HTMLDivElement>(null);
  const nubRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const lastPtr = useRef<{ x: number; y: number } | null>(null);
  const pid = useRef<number | null>(null);
  const lockRef = useRef<Cardinal | null>(null);
  const buzzed = useRef(false);
  const [lock, setLock] = useState<Cardinal | null>(null);
  const [held, setHeld] = useState(false);

  const paint = (origin: { x: number; y: number }, ptr: { x: number; y: number }) => {
    const pad = padRef.current;
    const nub = nubRef.current;
    if (pad) {
      pad.style.left = `${origin.x}px`;
      pad.style.top = `${origin.y}px`;
    }
    if (nub) {
      const dx = ptr.x - origin.x;
      const dy = ptr.y - origin.y;
      const mag = Math.hypot(dx, dy);
      const scale = mag > STICK_THROW && mag > 0 ? STICK_THROW / mag : 1;
      nub.style.left = `${origin.x + dx * scale}px`;
      nub.style.top = `${origin.y + dy * scale}px`;
    }
  };

  useEffect(() => {
    if (phase !== "playing") return;
    return () => {
      setTouchAxis(0, 0);
      setDrillHeld(false);
      const g = getGame();
      if (g) {
        g.input.dragOrigin = null;
        g.input.touchLock = null;
      }
    };
  }, [phase]);

  if (phase !== "playing") return null;

  const apply = (clientX: number, clientY: number) => {
    const g = getGame();
    if (!g || !originRef.current) return;
    lastPtr.current = { x: clientX, y: clientY };
    const dir = g.steerFromPointer(clientX, clientY, lockRef.current);
    if (g.input.dragOrigin) originRef.current = g.input.dragOrigin;
    lockRef.current = dir.lock;
    setLock(dir.lock);
    setTouchAxis(dir.x, dir.y);
    setDrillHeld(dir.lock != null);
    g.input.touchLock = dir.lock;
    paint(originRef.current, lastPtr.current);
    if (dir.lock != null && !buzzed.current && haptics) {
      buzzed.current = true;
      try {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(10);
      } catch {
        /* optional */
      }
    }
  };

  const release = (id: number) => {
    if (pid.current !== id) return;
    pid.current = null;
    originRef.current = null;
    lastPtr.current = null;
    lockRef.current = null;
    buzzed.current = false;
    setLock(null);
    setHeld(false);
    setTouchAxis(0, 0);
    setDrillHeld(false);
    const g = getGame();
    if (g) {
      g.input.dragOrigin = null;
      g.input.touchLock = null;
    }
  };

  return (
    <div
      className="absolute inset-0 z-[5] touch-none"
      aria-label="Steer the drill"
      role="application"
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.preventDefault();
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        originRef.current = { x: e.clientX, y: e.clientY };
        lastPtr.current = { x: e.clientX, y: e.clientY };
        lockRef.current = null;
        buzzed.current = false;
        const g = getGame();
        if (g) {
          g.input.dragOrigin = { x: e.clientX, y: e.clientY };
          g.input.touchLock = null;
        }
        setHeld(true);
        setLock(null);
        paint({ x: e.clientX, y: e.clientY }, { x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        apply(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => release(e.pointerId)}
      onPointerCancel={(e) => release(e.pointerId)}
      onLostPointerCapture={(e) => release(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {compass ? (
        <div
          ref={padRef}
          aria-hidden="true"
          className={`pointer-events-none fixed size-[7rem] -translate-x-1/2 -translate-y-1/2 rounded-full border bg-accent/10 short:size-[5.75rem] ${
            held ? "border-accent/50 opacity-100" : "border-transparent opacity-0"
          }`}
          style={{ left: "-999px", top: "-999px" }}
        >
          <Chevron dir={0} on={lock === 0} />
          <Chevron dir={1} on={lock === 1} />
          <Chevron dir={2} on={lock === 2} />
          <Chevron dir={3} on={lock === 3} />
        </div>
      ) : null}
      {compass ? (
        <div
          ref={nubRef}
          aria-hidden="true"
          className={`pointer-events-none fixed size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-panel short:size-9 ${
            held ? "opacity-100" : "opacity-0"
          } ${lock != null ? "border-accent bg-accent" : "border-fg/40 bg-elevated"}`}
          style={{ left: "-999px", top: "-999px" }}
        />
      ) : null}
    </div>
  );
}

function Chevron({ dir, on }: { dir: Cardinal; on: boolean }) {
  const pos =
    dir === 0
      ? "top-1.5 left-1/2 -translate-x-1/2"
      : dir === 2
        ? "bottom-1.5 left-1/2 -translate-x-1/2 rotate-180"
        : dir === 3
          ? "left-1.5 top-1/2 -translate-y-1/2 -rotate-90"
          : "right-1.5 top-1/2 -translate-y-1/2 rotate-90";
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-0 w-0 border-x-[7px] border-b-[11px] border-x-transparent ${
        on ? "border-b-accent" : "border-b-fg/35"
      } ${pos}`}
    />
  );
}

function IconAct({
  icon,
  n,
  label,
  onFire,
}: {
  icon: ReactNode;
  n: number;
  label: string;
  onFire: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} ${n}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFire();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex size-12 items-center justify-center rounded-xl border border-fg/25 bg-elevated text-fg shadow-panel"
    >
      {icon}
      <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-surface px-1 text-[10px] font-medium tabular-nums text-fg">
        {n}
      </span>
    </button>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="h-12 min-w-24 rounded-xl border border-fg/25 bg-elevated px-3 text-sm font-medium text-fg shadow-panel"
    >
      {label}
    </button>
  );
}

