export type Tongue = "la" | "el";

export type Verb = "read" | "two" | "count" | "letters" | "why" | "login";

export function parseTongue(raw: unknown): Tongue {
  if (raw === "el" || raw === "greek") return "el";
  return "la";
}

export function tongueFromSearch(search: Record<string, unknown> | string): Tongue {
  if (typeof search === "string") {
    return parseTongue(new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("tongue"));
  }
  return parseTongue(search.tongue);
}

export function handleFromSearch(search: Record<string, unknown>): string | undefined {
  if (typeof search.n === "string" && search.n.trim()) return search.n.trim();
  if (typeof search.name === "string" && search.name.trim()) return search.name.trim();
  return undefined;
}

export function readPath(handle = "", tongue: Tongue = "la"): string {
  const query = new URLSearchParams();
  if (handle.trim()) query.set("n", handle.trim());
  if (tongue === "el") query.set("tongue", "el");
  const next = query.toString();
  return next ? `/?${next}` : "/";
}

export function twoPath(a = "", b = "", tongue: Tongue = "la", mode?: "agon" | "table"): string {
  const query = new URLSearchParams();
  if (a.trim()) query.set("a", a.trim());
  if (b.trim()) query.set("b", b.trim());
  if (tongue === "el") query.set("tongue", "el");
  if (mode === "agon") query.set("mode", "agon");
  const next = query.toString();
  return next ? `/two?${next}` : "/two";
}

export function lettersPath(mark?: string, tongue: Tongue = "la"): string {
  const base = mark ? `/letters/${mark}` : "/letters";
  return tongue === "el" ? `${base}?tongue=el` : base;
}

export function whyPath(tongue: Tongue = "la"): string {
  return tongue === "el" ? "/why?tongue=el" : "/why";
}
