import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addProp,
  cloneLevel,
  deleteSelection,
  DRAFT_KEY,
  duplicateSelection,
  entitiesOf,
  levelProblems,
  moveSelection,
  patchProp,
  patchTerrain,
  PLACEABLE,
  sameSelection,
  STEPPE,
  yawSelection,
  type Level,
  type LevelProp,
  type Selection,
} from "@/wild/level";
import { saveSteppeLevel } from "@/wild/save-level";
import { riverCenter } from "@/wild/terrain";

const BOUNDS = { x0: -40, x1: 170, z0: -60, z1: 55 };

function project(x: number, z: number, width: number, height: number) {
  return {
    px: ((x - BOUNDS.x0) / (BOUNDS.x1 - BOUNDS.x0)) * width,
    py: ((BOUNDS.z1 - z) / (BOUNDS.z1 - BOUNDS.z0)) * height,
  };
}

function unproject(px: number, py: number, width: number, height: number) {
  return {
    x: BOUNDS.x0 + (px / width) * (BOUNDS.x1 - BOUNDS.x0),
    z: BOUNDS.z1 - (py / height) * (BOUNDS.z1 - BOUNDS.z0),
  };
}

export function WildEditor() {
  const [level, setLevel] = useState<Level>(() => cloneLevel(STEPPE));
  const [past, setPast] = useState<Level[]>([]);
  const [future, setFuture] = useState<Level[]>([]);
  const [selection, setSelection] = useState<Selection | null>({ kind: "prop", id: "fountain" });
  const [snap, setSnap] = useState(true);
  const [status, setStatus] = useState("The steppe file is the level.");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ selection: Selection; moved: boolean } | null>(null);

  const entities = useMemo(() => entitiesOf(level), [level]);
  const selectedProp = selection?.kind === "prop" ? level.props.find((prop) => prop.id === selection.id) : undefined;

  function commit(next: Level) {
    setPast((stack) => [...stack.slice(-49), level]);
    setFuture([]);
    setLevel(next);
  }

  function undo() {
    setPast((stack) => {
      const previous = stack[stack.length - 1];
      if (!previous) return stack;
      setFuture((ahead) => [level, ...ahead]);
      setLevel(previous);
      return stack.slice(0, -1);
    });
  }

  function redo() {
    setFuture((ahead) => {
      const [next, ...rest] = ahead;
      if (!next) return ahead;
      setPast((stack) => [...stack, level]);
      setLevel(next);
      return rest;
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(2, Math.floor(rect.width));
    const height = Math.max(2, Math.floor(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#c5d98a";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#7d9468";
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = -18 + (118 * i) / 40;
      const point = project(x, riverCenter(x), width, height);
      if (i === 0) ctx.moveTo(point.px, point.py);
      else ctx.lineTo(point.px, point.py);
    }
    ctx.stroke();
    ctx.strokeStyle = "#f3e2b0";
    ctx.lineWidth = 6;
    ctx.beginPath();
    const roadA = project(level.terrain.road.x, level.terrain.road.z, width, height);
    const roadB = project(level.actors.spire.x, level.actors.spire.z, width, height);
    ctx.moveTo(roadA.px, roadA.py);
    ctx.lineTo(roadB.px, roadB.py);
    ctx.stroke();
    const mesa = project(level.terrain.mesa.x, level.terrain.mesa.z, width, height);
    ctx.fillStyle = "#e4d8c4";
    ctx.beginPath();
    ctx.ellipse(mesa.px, mesa.py, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const entity of entities) {
      if (entity.selection.kind === "terrain") continue;
      const point = project(entity.x, entity.z, width, height);
      const chosen = sameSelection(selection, entity.selection);
      ctx.fillStyle = chosen ? "#1c243f" : entity.selection.kind === "prop" ? "#c46a3a" : "#2a3a72";
      ctx.beginPath();
      ctx.arc(point.px, point.py, chosen ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (chosen) {
        ctx.fillStyle = "#24180f";
        ctx.font = "13px Fraunces, Palatino, serif";
        ctx.fillText(entity.label, point.px + 8, point.py - 8);
      }
    }
  }, [entities, level, selection]);

  function hit(event: React.PointerEvent<HTMLCanvasElement>): Selection | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let best: { selection: Selection; d: number } | null = null;
    for (const entity of entities) {
      if (entity.selection.kind === "terrain") continue;
      const point = project(entity.x, entity.z, rect.width, rect.height);
      const d = Math.hypot(point.px - px, point.py - py);
      if (d < 14 && (!best || d < best.d)) best = { selection: entity.selection, d };
    }
    return best?.selection ?? null;
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (meta && event.key === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (selection?.kind === "prop" && document.activeElement === document.body) {
          commit(deleteSelection(level, selection));
          setSelection(null);
        }
      } else if ((event.key === "[" || event.key === "]") && selection) {
        const current = selection.kind === "prop" ? selectedProp?.yaw ?? 0 : selection.kind === "actor" && selection.id === "spawn" ? level.spawn.yaw : 0;
        commit(yawSelection(level, selection, current + (event.key === "]" ? 0.26 : -0.26)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    const problems = levelProblems(level);
    if (problems.length) {
      setStatus(problems.join(", "));
      return;
    }
    try {
      const result = await saveSteppeLevel({ data: level });
      setStatus(result.ok ? "Saved src/wild/levels/steppe.json." : result.error);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    }
  }

  function play(markerId?: string) {
    const draft = cloneLevel(level);
    if (markerId) {
      const marker = draft.markers.find((item) => item.id === markerId);
      if (marker) {
        draft.spawn.x = marker.x;
        draft.spawn.z = marker.z;
      }
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.location.assign("/wild?draft=1&debug=1");
  }

  return (
    <div className="grid h-[100dvh] grid-cols-1 bg-[#f4e7c8] text-[#24180f] md:grid-cols-[16rem_1fr_18rem]">
      <aside className="flex min-h-0 flex-col border-[#1c243f]/15 md:border-r">
        <div className="flex items-center justify-between px-3 py-3">
          <h1 className="font-display text-xl">Steppe</h1>
          <Link to="/wild" className="text-xs tracking-[0.14em] uppercase">Play</Link>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto px-2 pb-3 text-sm">
          {entities.filter((entity) => entity.selection.kind !== "marker").map((entity) => (
            <li key={`${entity.selection.kind}-${"id" in entity.selection ? entity.selection.id : "terrain"}`}>
              <button
                type="button"
                className={`w-full rounded px-2 py-1 text-left ${sameSelection(selection, entity.selection) ? "bg-[#1c243f] text-[#f4e7c8]" : "hover:bg-[#1c243f]/10"}`}
                onClick={() => setSelection(entity.selection)}
              >
                {entity.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="relative min-h-[50vh]">
        <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 p-2 text-xs tracking-[0.12em] uppercase">
          <button type="button" className="rounded-full bg-[#efe6d4] px-3 py-2" onClick={undo}>Undo</button>
          <button type="button" className="rounded-full bg-[#efe6d4] px-3 py-2" onClick={redo}>Redo</button>
          <button type="button" className={`rounded-full px-3 py-2 ${snap ? "bg-[#1c243f] text-[#f4e7c8]" : "bg-[#efe6d4]"}`} onClick={() => setSnap((value) => !value)}>Snap</button>
          <button type="button" className="rounded-full bg-[#efe6d4] px-3 py-2" onClick={() => void save()}>Save</button>
          <button type="button" className="rounded-full bg-[#2a3a72] px-3 py-2 text-[#f4e7c8]" onClick={() => play()}>Play</button>
          <button type="button" className="rounded-full bg-[#efe6d4] px-3 py-2" onClick={() => play("fountain")}>From fountain</button>
          <span className="normal-case tracking-normal text-[#3a2a18]">{status}</span>
        </div>
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          onPointerDown={(event) => {
            const found = hit(event);
            if (!found) return;
            setSelection(found);
            drag.current = { selection: found, moved: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const active = drag.current;
            const canvas = canvasRef.current;
            if (!active || !canvas || event.buttons !== 1) return;
            const rect = canvas.getBoundingClientRect();
            const world = unproject(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
            if (!active.moved) {
              setPast((stack) => [...stack.slice(-49), level]);
              setFuture([]);
              active.moved = true;
            }
            setLevel(moveSelection(level, active.selection, world.x, world.z, snap ? 0.5 : null));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        />
      </main>
      <aside className="min-h-0 overflow-auto border-[#1c243f]/15 p-3 md:border-l">
        <h2 className="font-display text-lg">{selection ? entities.find((entity) => sameSelection(entity.selection, selection))?.label : "Nothing selected"}</h2>
        {selectedProp ? <PropFields prop={selectedProp} onChange={(patch) => commit(patchProp(level, selectedProp.id, patch))} /> : null}
        {selection?.kind === "terrain" ? (
          <div className="mt-3 grid gap-2 text-sm">
            <label>Mesa x <input className="w-full bg-white/70 px-2 py-1" value={level.terrain.mesa.x} onChange={(event) => commit(patchTerrain(level, { mesa: { ...level.terrain.mesa, x: Number(event.target.value) } }))} /></label>
            <label>Mesa z <input className="w-full bg-white/70 px-2 py-1" value={level.terrain.mesa.z} onChange={(event) => commit(patchTerrain(level, { mesa: { ...level.terrain.mesa, z: Number(event.target.value) } }))} /></label>
            <label>Ford x <input className="w-full bg-white/70 px-2 py-1" value={level.terrain.ford.x} onChange={(event) => commit(patchTerrain(level, { ford: { ...level.terrain.ford, x: Number(event.target.value) } }))} /></label>
            <label>River base <input className="w-full bg-white/70 px-2 py-1" value={level.terrain.river.base} onChange={(event) => commit(patchTerrain(level, { river: { ...level.terrain.river, base: Number(event.target.value) } }))} /></label>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs tracking-[0.12em] uppercase">
          <button
            type="button"
            className="rounded-full bg-[#efe6d4] px-3 py-2"
            onClick={() => {
              if (!selection || selection.kind !== "prop") return;
              const copied = duplicateSelection(level, selection);
              if (!copied) return;
              commit(copied.level);
              setSelection({ kind: "prop", id: copied.id });
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="rounded-full bg-[#efe6d4] px-3 py-2"
            onClick={() => {
              if (selection?.kind !== "prop") return;
              commit(deleteSelection(level, selection));
              setSelection(null);
            }}
          >
            Delete
          </button>
        </div>
        <label className="mt-4 block text-sm">
          Add
          <select
            className="mt-1 w-full bg-white/70 px-2 py-1"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              const added = addProp(level, event.target.value);
              commit(added.level);
              setSelection({ kind: "prop", id: added.id });
              event.target.value = "";
            }}
          >
            <option value="">Choose a model</option>
            {PLACEABLE.map((file) => <option key={file} value={file}>{file}</option>)}
          </select>
        </label>
        <p className="mt-4 text-sm leading-5 text-[#3a2a18]">Drag a mark. Bracket keys turn it. Snap is half a meter. Play loads this draft in the real steppe.</p>
      </aside>
    </div>
  );
}

function PropFields({ prop, onChange }: { prop: LevelProp; onChange: (patch: Partial<LevelProp>) => void }) {
  return (
    <div className="mt-3 grid gap-2 text-sm">
      {(["x", "z", "meters", "yaw", "r", "reach"] as const).map((key) => (
        <label key={key}>
          {key}
          <input
            className="w-full bg-white/70 px-2 py-1"
            value={prop[key] ?? ""}
            onChange={(event) => onChange({ [key]: event.target.value === "" ? undefined : Number(event.target.value) })}
          />
        </label>
      ))}
      <label>
        Line
        <textarea className="w-full bg-white/70 px-2 py-1" value={prop.say ?? ""} onChange={(event) => onChange({ say: event.target.value })} />
      </label>
      <label>
        Verb
        <input className="w-full bg-white/70 px-2 py-1" value={prop.verb ?? ""} onChange={(event) => onChange({ verb: event.target.value || undefined })} />
      </label>
    </div>
  );
}
