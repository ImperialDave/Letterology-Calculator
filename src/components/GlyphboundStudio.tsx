import { useEffect, useRef, useState, type PointerEvent as PE } from "react";
import type { GameEngine } from "@/glyphbound/engine";
import { CATALOG, type BrushGroup } from "@/glyphbound/catalog";
import { validateFolio } from "@/glyphbound/folio";
import { deleteFolio, loadShelf, parseImported, saveFolio } from "@/glyphbound/folios-save";
import { LEVELS } from "@/glyphbound/levels";
import { THEME_IDS } from "@/glyphbound/types";

const GROUPS: { id: BrushGroup; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "hazard", label: "Hazards" },
  { id: "mover", label: "Movers" },
  { id: "enemy", label: "Enemies" },
  { id: "boss", label: "Warden" },
  { id: "pickup", label: "Items" },
  { id: "npc", label: "Letters" },
  { id: "meta", label: "Meta" },
  { id: "deco", label: "Deco" },
];

export function GlyphboundStudio({ game }: { game: () => GameEngine | null }) {
  const [group, setGroup] = useState<BrushGroup>("terrain");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTile = useRef("x");
  const painting = useRef(false);

  const g = game();
  const folio = g?.studioFolio();
  const brush = g?.studioBrush ?? "#";
  const issues = folio ? validateFolio(folio) : [];
  const shelf = loadShelf();

  useEffect(() => {
    const f = game()?.studioFolio();
    if (f && f.name !== name) setName(f.name);
  }, [folio?.id, folio?.name, game, name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const eng = game();
      if (!eng || eng.mode !== "studio") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        eng.studioUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        eng.studioPlay();
      }
      if (e.key === "[" || e.key === "]") {
        const list = CATALOG.filter((b) => b.group === group);
        const i = list.findIndex((b) => b.ch === eng.studioBrush);
        const next = e.key === "]" ? i + 1 : i - 1;
        const pick = list[(next + list.length) % Math.max(1, list.length)];
        if (pick) eng.studioSetBrush(pick.ch);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onSave = () => {
    const eng = game();
    const f = eng?.studioFolio();
    if (!f) return;
    if (name.trim()) f.name = name.trim();
    eng?.studioSetName(f.name);
    const res = saveFolio(f);
    setMsg(res.ok ? "Shelved." : res.error ?? "Could not save.");
  };

  const paintAt = (e: PE<HTMLDivElement>, first: boolean) => {
    const eng = game();
    if (!eng) return;
    const { tx, ty } = eng.screenToTile(e.clientX, e.clientY);
    eng.studioHover = { tx, ty };
    const ch = e.altKey ? undefined : e.buttons === 2 || e.button === 2 ? "." : eng.studioBrush;
    if (e.altKey) {
      const row = eng.studioFolio()?.rows[ty];
      const got = row?.[tx];
      if (got) eng.studioSetBrush(got);
      return;
    }
    const key = `${tx},${ty},${ch}`;
    if (!first && key === lastTile.current) return;
    lastTile.current = key;
    if (ch) eng.studioStamp(tx, ty, ch);
  };

  const brushes = CATALOG.filter((b) => b.group === group);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className="pointer-events-auto absolute inset-0 z-0 cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          painting.current = true;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          paintAt(e, true);
        }}
        onPointerMove={(e) => {
          const eng = game();
          if (eng) {
            const t = eng.screenToTile(e.clientX, e.clientY);
            eng.studioHover = t;
          }
          if (painting.current) paintAt(e, false);
        }}
        onPointerUp={() => {
          painting.current = false;
          lastTile.current = "x";
        }}
        onPointerCancel={() => {
          painting.current = false;
        }}
      />

      <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 border-b border-[#e8d48a]/20 bg-[#07080c]/90 px-3 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm tracking-wide text-[#e8d48a]">Studio</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => game()?.studioSetName(name)}
            className="h-9 min-w-[10rem] flex-1 rounded-md border border-[#f4f0e4]/20 bg-[#121018] px-2 text-sm text-[#f4f0e4]"
            aria-label="Ledger name"
          />
          <select
            value={folio?.theme ?? "street"}
            onChange={(e) => game()?.studioSetTheme(e.target.value as (typeof THEME_IDS)[number])}
            className="h-9 rounded-md border border-[#f4f0e4]/20 bg-[#121018] px-2 text-sm text-[#f4f0e4]"
            aria-label="Theme"
          >
            {THEME_IDS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="h-9 rounded-md border border-[#5ee0c0]/50 bg-[#10241c] px-3 text-sm text-[#9af8de]"
            onClick={() => game()?.studioPlay()}
          >
            Play
          </button>
          <button
            type="button"
            className="h-9 rounded-md border border-[#f4f0e4]/25 bg-[#121018] px-3 text-sm text-[#f4f0e4]"
            onClick={onSave}
          >
            Save
          </button>
          <button
            type="button"
            className="h-9 rounded-md border border-[#f4f0e4]/25 bg-[#121018] px-3 text-sm text-[#f4f0e4]"
            onClick={() => setOpen((v) => !v)}
          >
            Open
          </button>
          <button
            type="button"
            className="h-9 rounded-md border border-[#f4f0e4]/25 bg-[#121018] px-3 text-sm text-[#f4f0e4]"
            onClick={() => game()?.leaveStudio()}
          >
            Leave
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {GROUPS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGroup(tab.id)}
              className={`h-8 rounded-md px-2 text-[11px] uppercase tracking-wide ${
                group === tab.id
                  ? "bg-[#f4f0e4] text-[#121018]"
                  : "border border-[#f4f0e4]/20 text-[#c9b896]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          {brushes.map((b) => (
            <button
              key={b.ch + b.label}
              type="button"
              title={b.label}
              onClick={() => game()?.studioSetBrush(b.ch)}
              className={`flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1 font-display text-sm ${
                brush === b.ch ? "bg-[#5ee0c0] text-[#10241c]" : "border border-[#f4f0e4]/20 text-[#f4f0e4]"
              }`}
            >
              <span className="text-base leading-none">{b.ch === " " ? "·" : b.ch}</span>
              <span className="max-w-[4.5rem] truncate text-[8px] uppercase tracking-wide">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 border-t border-[#e8d48a]/20 bg-[#07080c]/90 px-3 py-2 text-[11px] text-[#c9b896]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            Left paints · right erases · Alt samples · WASD pans · Space plays · Esc leaves
            {folio ? ` · ${folio.rows[0]?.length ?? 0}×${folio.rows.length}` : ""}
            {issues.length ? ` · ${issues.length} check${issues.length === 1 ? "" : "s"}` : ""}
          </p>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="h-9 rounded-md border border-[#f4f0e4]/25 px-2 text-[#f4f0e4]"
              onClick={() => game()?.studioUndo()}
            >
              Undo
            </button>
            <button
              type="button"
              className="h-9 rounded-md border border-[#f4f0e4]/25 px-2 text-[#f4f0e4]"
              onClick={() => game()?.enterStudio()}
            >
              New
            </button>
            <button
              type="button"
              className="h-9 rounded-md border border-[#f4f0e4]/25 px-2 text-[#f4f0e4]"
              onClick={() => game()?.studioCopyStage("stage30")}
            >
              Copy End-Mark
            </button>
            <button
              type="button"
              className="h-9 rounded-md border border-[#f4f0e4]/25 px-2 text-[#f4f0e4]"
              onClick={() => {
                const f = game()?.studioFolio();
                if (!f) return;
                const blob = new Blob([JSON.stringify(f, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${f.id}.folio.json`;
                a.click();
              }}
            >
              Export
            </button>
            <button
              type="button"
              className="h-9 rounded-md border border-[#f4f0e4]/25 px-2 text-[#f4f0e4]"
              onClick={() => fileRef.current?.click()}
            >
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const parsed = parseImported(await file.text());
                if (!parsed.ok) {
                  setMsg(parsed.error);
                  return;
                }
                parsed.folio.id = "folio-" + Date.now().toString(36);
                game()?.enterStudio(parsed.folio);
                setName(parsed.folio.name);
                setMsg("Imported.");
              }}
            />
          </div>
        </div>
        {msg && <p className="mt-1 text-[#9af8de]">{msg}</p>}
        {issues.length > 0 && (
          <p className="mt-1 text-[#e8d48a]">{issues[0].message}</p>
        )}
      </div>

      {open && (
        <div className="pointer-events-auto absolute inset-x-4 top-36 z-20 max-h-[50%] overflow-y-auto rounded-lg border border-[#e8d48a]/30 bg-[#121018]/95 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#e8d48a]">Shelf</p>
          {shelf.folios.length === 0 && <p className="text-sm text-[#8a7a62]">No ledgers shelved yet.</p>}
          <ul className="flex flex-col gap-1">
            {shelf.folios.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-10 flex-1 rounded-md border border-[#f4f0e4]/20 px-2 text-left text-sm text-[#f4f0e4]"
                  onClick={() => {
                    game()?.enterStudio(f);
                    setName(f.name);
                    setOpen(false);
                  }}
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  className="h-10 rounded-md border border-[#d45a4a]/40 px-2 text-xs text-[#d45a4a]"
                  onClick={() => {
                    deleteFolio(f.id);
                    setOpen(false);
                    setTimeout(() => setOpen(true), 0);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#e8d48a]">Copy a closed page</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {["hub", "stage1", "stage29", "stage30"].filter((id) => LEVELS[id]).map((id) => (
              <button
                key={id}
                type="button"
                className="h-9 rounded-md border border-[#f4f0e4]/20 px-2 text-xs text-[#c9b896]"
                onClick={() => {
                  game()?.studioCopyStage(id);
                  setOpen(false);
                }}
              >
                {LEVELS[id].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
