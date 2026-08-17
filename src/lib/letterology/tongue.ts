export type Tongue = "la" | "el";

export type Verb = "read" | "two" | "count" | "letters" | "why" | "login";

const STORAGE = "cc33-tongue";

const session = {
  handle: "",
  a: "",
  b: "",
};

export function parseTongue(raw: unknown): Tongue {
  if (raw === "el" || raw === "greek") return "el";
  return "la";
}

/** Always write la or el. Undefined is how the first Latin click used to no-op. */
export function tongueParam(tongue: Tongue): "la" | "el" {
  return tongue === "el" ? "el" : "la";
}

export function tongueFromUnknown(search: Record<string, unknown>): "la" | "el" | undefined {
  if (search.tongue === "el") return "el";
  if (search.tongue === "la") return "la";
  return undefined;
}

export function rememberTongue(tongue: Tongue): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE, tongue);
  } catch {
    /* private mode */
  }
}

export function recalledTongue(): Tongue | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return parseTongue(localStorage.getItem(STORAGE));
  } catch {
    return null;
  }
}

export function applyAtmosphere(tongue: Tongue): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.tongue = tongue;
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", tongue === "el" ? "#16110e" : "#efe6d6");
  rememberTongue(tongue);
}

type TongueListener = () => void;
const tongueListeners = new Set<TongueListener>();
let liveTongue: Tongue | null = null;

export function setLiveTongue(tongue: Tongue): void {
  liveTongue = tongue;
  applyAtmosphere(tongue);
  for (const listener of tongueListeners) listener();
}

export function getLiveTongue(): Tongue | null {
  return liveTongue;
}

export function subscribeTongue(listener: TongueListener): () => void {
  tongueListeners.add(listener);
  return () => {
    tongueListeners.delete(listener);
  };
}

export function noteHandle(handle: string): void {
  session.handle = handle.trim();
}

export function notePair(a: string, b: string): void {
  session.a = a.trim();
  session.b = b.trim();
}

export function draftHandle(): string {
  return session.handle;
}

export function draftPair(): { a: string; b: string } {
  return { a: session.a, b: session.b };
}

function text(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function nameFromSlug(slug: string): string {
  let raw = slug;
  try {
    raw = decodeURIComponent(slug);
  } catch {
    raw = slug;
  }
  return raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export type FlipTarget = {
  to: "/" | "/two" | "/letters" | "/letters/$mark" | "/why" | "/count" | "/count/$walk" | "/login" | "/claim";
  params?: { mark?: string; walk?: string };
  search: Record<string, string | undefined> & { tongue?: "la" | "el" };
  hash?: string;
};

export function flipTongue(input: {
  pathname: string;
  search: Record<string, unknown>;
  params?: Record<string, string | undefined>;
  next: Tongue;
}): FlipTarget {
  const handle = text(session.handle, input.search.n, input.search.name);
  const a = text(session.a, input.search.a, handle);
  const b = text(session.b, input.search.b);
  const tongue = tongueParam(input.next);
  const path = input.pathname;
  const mark = input.params?.mark ?? path.match(/\/(?:letters|horae)\/([^/?#]+)/)?.[1];
  const walk = input.params?.walk ?? path.match(/^\/count\/([^/?#]+)/)?.[1];
  const slug = input.params?.slug ?? path.match(/^\/p\/([^/?#]+)/)?.[1];

  if (path.startsWith("/p/") && slug) {
    return { to: "/", search: { n: nameFromSlug(slug), tongue } };
  }
  if (path.startsWith("/count/") && walk) {
    return { to: "/count/$walk", params: { walk }, search: { tongue } };
  }
  if (path === "/count") {
    return { to: "/count", search: { tongue } };
  }
  if (path === "/two" || path === "/bond" || path.includes("/xenia") || path.includes("/agon")) {
    const agon = path.includes("/agon") || input.search.mode === "agon";
    return {
      to: "/two",
      search: { a, b, tongue, mode: input.next === "el" && agon ? "agon" : undefined },
    };
  }
  if (mark && (path.includes("/letters/") || path.includes("/horae/"))) {
    return { to: "/letters/$mark", params: { mark }, search: { tongue } };
  }
  if (
    path === "/letters" ||
    path === "/atlas" ||
    path === "/circle" ||
    path === "/archetypes" ||
    path === "/stoicheia/horae"
  ) {
    return { to: "/letters", search: { tongue } };
  }
  if (path === "/why" || path === "/key" || path === "/doctrine" || path.endsWith("/doctrine")) {
    return { to: "/why", search: { tongue }, hash: input.next === "el" ? "greek" : "latin" };
  }
  if (path === "/login") return { to: "/login", search: { tongue } };
  if (path === "/claim") return { to: "/claim", search: { tongue } };

  return { to: "/", search: { n: handle, tongue } };
}

export function carryForVerb(
  verb: "read" | "two" | "count",
  search: Record<string, unknown>,
  tongue: Tongue,
): Record<string, string | undefined> {
  const handle = text(session.handle, search.n, search.name, search.a);
  const a = text(session.a, search.a, handle);
  const b = text(session.b, search.b);
  const flag = tongueParam(tongue);
  if (verb === "read") return { n: handle, tongue: flag };
  if (verb === "two") return { a, b, tongue: flag };
  return { tongue: flag };
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
  return tongue === "el" ? "/why?tongue=el#greek" : "/why#latin";
}

export function tongueFromSearch(search: Record<string, unknown> | string): Tongue {
  if (typeof search === "string") {
    return parseTongue(new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("tongue"));
  }
  return parseTongue(search.tongue);
}

export function handleFromSearch(search: Record<string, unknown>): string | undefined {
  return text(search.n, search.name);
}
