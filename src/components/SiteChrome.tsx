import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { TongueProvider } from "@/components/letterology/TongueProvider";
import { CLUB_NAME } from "@/lib/letterology/brand";
import { VOICE } from "@/lib/letterology/voice";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  carryForVerb,
  flipTongue,
  getLiveTongue,
  parseTongue,
  setLiveTongue,
  type Tongue,
  type Verb,
} from "@/lib/letterology/tongue";
import { cn } from "@/lib/utils";

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-11 w-11 rounded-md bg-ink/10" aria-hidden="true" />;
  }
  if (user) {
    return (
      <SignedIn>
        <UserButton />
      </SignedIn>
    );
  }
  return (
    <SignedOut>
      <Link
        to="/login"
        className="inline-flex h-11 items-center px-2 font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
      >
        Sign in
      </Link>
    </SignedOut>
  );
}

const VERBS: { to: "/" | "/two" | "/count" | "/ask"; label: string; verb: "read" | "two" | "count" | "ask" }[] = [
  { to: "/", label: "Read", verb: "read" },
  { to: "/ask", label: "Ask", verb: "ask" },
  { to: "/two", label: "Two", verb: "two" },
  { to: "/count", label: "Count", verb: "count" },
];

export type HeaderCurrent = Verb | "login" | "key" | "stoicheia" | "bond" | "atlas" | "houses" | "circle" | "almanac" | "sheet";

function verbOf(current?: HeaderCurrent): Verb | "login" {
  if (current === "bond") return "two";
  if (current === "stoicheia") return "read";
  if (current === "atlas" || current === "houses" || current === "circle") return "letters";
  if (current === "key" || current === "almanac" || current === "sheet") return "why";
  if (current === "login") return "login";
  if (
    current === "read" ||
    current === "two" ||
    current === "count" ||
    current === "letters" ||
    current === "why" ||
    current === "ask"
  ) {
    return current;
  }
  return "read";
}

function TongueSwitch({ tongue, onChange }: { tongue: Tongue; onChange: (next: Tongue) => void }) {
  return (
    <div className="tongue-switch" data-on={tongue} role="radiogroup" aria-label="Tongue">
      <span className="tongue-switch-pill" aria-hidden="true" />
      {(["la", "el"] as const).map((item) => (
        <button
          key={item}
          type="button"
          role="radio"
          aria-checked={tongue === item}
          className={tongue === item ? "is-on" : undefined}
          onClick={() => onChange(item)}
        >
          {item === "la" ? "Latin" : "Greek"}
        </button>
      ))}
    </div>
  );
}

function writtenTongue(raw: unknown): "la" | "el" {
  return raw === "el" ? "el" : "la";
}

function goFlip(
  navigate: ReturnType<typeof useNavigate>,
  flip: ReturnType<typeof flipTongue>,
) {
  const search = flip.search;
  const tongue = writtenTongue(search.tongue);
  if (flip.to === "/letters/$mark" && flip.params?.mark) {
    void navigate({
      to: "/letters/$mark",
      params: { mark: flip.params.mark },
      search: (prev) => ({ ...prev, tongue }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/count/$walk" && flip.params?.walk) {
    void navigate({
      to: "/count/$walk",
      params: { walk: flip.params.walk },
      search: (prev) => ({ ...prev, tongue }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/two") {
    void navigate({
      to: "/two",
      search: (prev) => ({
        ...prev,
        a: search.a ?? prev.a,
        b: search.b ?? prev.b,
        tongue,
        mode: search.mode === "agon" ? "agon" : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/") {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        n: search.n ?? prev.n,
        name: undefined,
        tongue,
      }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/letters") {
    void navigate({
      to: "/letters",
      search: (prev) => ({ ...prev, tongue }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/why") {
    void navigate({
      to: "/why",
      search: (prev) => ({ ...prev, tongue }),
      hash: flip.hash,
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/sheet") {
    void navigate({
      to: "/sheet",
      search: (prev) => ({ ...prev, tongue }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/ask") {
    void navigate({
      to: "/ask",
      search: (prev) => ({
        ...prev,
        n: search.n ?? prev.n,
        q: search.q ?? prev.q,
        tongue,
      }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  if (flip.to === "/count") {
    void navigate({
      to: "/count",
      search: (prev) => ({ ...prev, n: prev.n, tongue }),
      replace: true,
      resetScroll: false,
    });
    return;
  }
  void navigate({ to: flip.to, replace: true, resetScroll: false });
}

export function AppShell({
  current,
  children,
  wide = false,
}: {
  current?: HeaderCurrent;
  children: ReactNode;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const search = (location.search ?? {}) as Record<string, unknown>;
  const urlTongue = parseTongue(search.tongue);
  const [tongue, setTongueState] = useState<Tongue>(() => getLiveTongue() ?? urlTongue);
  const verb = verbOf(current);

  useLayoutEffect(() => {
    if (getLiveTongue() === urlTongue) return;
    setTongueState(urlTongue);
    setLiveTongue(urlTongue);
  }, [urlTongue]);

  function setTongue(next: Tongue) {
    const already = getLiveTongue() ?? tongue;
    if (next === already && next === urlTongue) return;
    setTongueState(next);
    setLiveTongue(next);
    goFlip(
      navigate,
      flipTongue({
        pathname: location.pathname,
        search,
        params: location.pathname.split("/").filter(Boolean).length
          ? {
              mark: location.pathname.match(/\/(?:letters|horae)\/([^/]+)/)?.[1],
              walk: location.pathname.match(/^\/count\/([^/]+)/)?.[1],
              slug: location.pathname.match(/^\/p\/([^/]+)/)?.[1],
            }
          : undefined,
        next,
      }),
    );
  }

  const readSearch = carryForVerb("read", search, tongue);
  const twoSearch = carryForVerb("two", search, tongue);
  const askSearch = carryForVerb("ask", search, tongue);

  return (
    <TongueProvider tongue={tongue}>
    <div data-tongue={tongue} className="paper-field min-h-dvh text-fg">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            search={{ n: undefined, name: undefined, tongue: tongue === "el" ? "el" : "la" }}
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src="/seal.jpg"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
            />
            <span className="truncate font-display text-lg tracking-[0.14em] text-ink">{CLUB_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <TongueSwitch tongue={tongue} onChange={setTongue} />
            <nav className="hidden items-center sm:flex">
              {VERBS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={
                    item.verb === "read"
                      ? { n: readSearch.n, name: undefined, tongue: tongue === "el" ? "el" : "la" }
                      : item.verb === "two"
                        ? { a: twoSearch.a, b: twoSearch.b, tongue: tongue === "el" ? "el" : "la", mode: undefined }
                        : item.verb === "ask"
                          ? { n: askSearch.n, q: askSearch.q, tongue: tongue === "el" ? "el" : "la" }
                          : { n: undefined, tongue: tongue === "el" ? "el" : "la" }
                  }
                  className={cn(
                    "inline-flex h-11 items-center px-3 font-display text-xs tracking-[0.14em] uppercase",
                    verb === item.verb ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden sm:block">
              <AuthSlot />
            </div>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full px-4 py-8 sm:px-6 sm:py-12", wide ? "max-w-5xl" : "max-w-3xl")}>
        {children}
      </main>

      <footer className="border-t border-ink/10 pb-20 sm:pb-0">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted sm:px-6">
          <p>{VOICE.footerLine}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/sheet"
            search={{ tongue: tongue === "el" ? "el" : "la" }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Cheat sheet
          </Link>
          <Link
            to="/glyphbound"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Glyphbound
          </Link>
          <Link
            to="/why"
            search={{ tongue: tongue === "el" ? "el" : "la" }}
            hash={tongue === "el" ? "greek" : "latin"}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Why
          </Link>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-bg/95 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
          {VERBS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={
                item.verb === "read"
                  ? { n: readSearch.n, name: undefined, tongue: tongue === "el" ? "el" : "la" }
                  : item.verb === "two"
                    ? { a: twoSearch.a, b: twoSearch.b, tongue: tongue === "el" ? "el" : "la", mode: undefined }
                    : item.verb === "ask"
                      ? { n: askSearch.n, q: askSearch.q, tongue: tongue === "el" ? "el" : "la" }
                      : { n: undefined, tongue: tongue === "el" ? "el" : "la" }
              }
              className={cn(
                "inline-flex h-11 min-w-14 items-center justify-center font-display text-xs tracking-[0.14em] uppercase",
                verb === item.verb ? "text-ink" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
          <AuthSlot />
        </div>
      </nav>
    </div>
    </TongueProvider>
  );
}

/** @deprecated use AppShell */
export function SiteHeader({ current }: { current: HeaderCurrent }) {
  void current;
  return null;
}

/** @deprecated use AppShell */
export function SiteFooter() {
  return null;
}
