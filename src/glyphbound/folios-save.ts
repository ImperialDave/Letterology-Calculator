import type { Folio } from "./folio";

const KEY = "glyphbound-folios-v1";
const MAX = 24;
const MAX_BYTES = 200_000;

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };

const mem: { raw: string | null } = { raw: null };

function store(): Store {
  if (typeof localStorage !== "undefined") return localStorage;
  return {
    getItem: () => mem.raw,
    setItem: (_k, v) => {
      mem.raw = v;
    },
    removeItem: () => {
      mem.raw = null;
    },
  };
}

export interface FolioShelf {
  folios: Folio[];
  activeId: string | null;
}

function emptyShelf(): FolioShelf {
  return { folios: [], activeId: null };
}

export function loadShelf(): FolioShelf {
  try {
    const raw = store().getItem(KEY);
    if (!raw) return emptyShelf();
    const parsed = JSON.parse(raw) as Partial<FolioShelf>;
    const folios = Array.isArray(parsed.folios) ? parsed.folios.filter((f) => f && f.version === 1 && Array.isArray(f.rows)) : [];
    return { folios, activeId: parsed.activeId ?? folios[0]?.id ?? null };
  } catch {
    return emptyShelf();
  }
}

export function writeShelf(shelf: FolioShelf): { ok: boolean; error?: string } {
  const trimmed: FolioShelf = {
    folios: shelf.folios.slice(0, MAX),
    activeId: shelf.activeId,
  };
  const raw = JSON.stringify(trimmed);
  if (raw.length > MAX_BYTES) return { ok: false, error: "Shelf is too large to keep. Export a folio, then delete one." };
  try {
    store().setItem(KEY, raw);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not write the shelf." };
  }
}

export function saveFolio(folio: Folio): { ok: boolean; error?: string; shelf: FolioShelf } {
  const shelf = loadShelf();
  const i = shelf.folios.findIndex((f) => f.id === folio.id);
  if (i >= 0) shelf.folios[i] = folio;
  else {
    if (shelf.folios.length >= MAX) return { ok: false, error: `The shelf holds ${MAX} ledgers. Delete one first.`, shelf };
    shelf.folios.push(folio);
  }
  shelf.activeId = folio.id;
  const wr = writeShelf(shelf);
  return { ...wr, shelf };
}

export function deleteFolio(id: string): FolioShelf {
  const shelf = loadShelf();
  shelf.folios = shelf.folios.filter((f) => f.id !== id);
  if (shelf.activeId === id) shelf.activeId = shelf.folios[0]?.id ?? null;
  writeShelf(shelf);
  return shelf;
}

export function parseImported(raw: string): { ok: true; folio: Folio } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Folio;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.rows)) {
      return { ok: false, error: "Not a folio file." };
    }
    return { ok: true, folio: parsed };
  } catch {
    return { ok: false, error: "That file is not JSON." };
  }
}
