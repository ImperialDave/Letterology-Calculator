import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CLUB_NAME } from "@/lib/letterology/brand";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { parseTongue, type Tongue, type Verb } from "@/lib/letterology/tongue";
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
        You
      </Link>
    </SignedOut>
  );
}

const VERBS: { to: "/" | "/two" | "/count"; label: string; verb: Verb }[] = [
  { to: "/", label: "Read", verb: "read" },
  { to: "/two", label: "Two", verb: "two" },
  { to: "/count", label: "Count", verb: "count" },
];

export type HeaderCurrent = Verb | "login" | "key" | "stoicheia" | "bond" | "atlas" | "houses" | "circle" | "almanac";

function verbOf(current?: HeaderCurrent): Verb | "login" {
  if (current === "bond") return "two";
  if (current === "stoicheia") return "read";
  if (current === "atlas" || current === "houses" || current === "circle") return "letters";
  if (current === "key" || current === "almanac") return "why";
  if (current === "login") return "login";
  if (current === "read" || current === "two" || current === "count" || current === "letters" || current === "why") {
    return current;
  }
  return "read";
}

function TongueSwitch({ tongue, onChange }: { tongue: Tongue; onChange: (next: Tongue) => void }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full bg-raised px-1 shadow-[var(--shadow-border)]">
      {(["la", "el"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-3 font-display text-xs tracking-[0.14em] uppercase",
            tongue === item ? "bg-primary text-primary-fg" : "text-muted hover:text-ink",
          )}
        >
          {item === "la" ? "Latin" : "Greek"}
        </button>
      ))}
    </div>
  );
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
  const tongue = parseTongue(search.tongue);
  const verb = verbOf(current);

  function setTongue(next: Tongue) {
    const nextSearch = { ...search, tongue: next === "el" ? "el" : undefined };
    const path = location.pathname;
    if (path.startsWith("/stoicheia/xenia") || path === "/bond") {
      void navigate({ to: "/two", search: nextSearch });
      return;
    }
    if (path.startsWith("/stoicheia/agon")) {
      void navigate({ to: "/two", search: { ...nextSearch, mode: "agon" } });
      return;
    }
    if (path.startsWith("/stoicheia/horae") || path === "/atlas" || path === "/circle" || path === "/archetypes") {
      void navigate({ to: "/letters", search: nextSearch });
      return;
    }
    if (path.startsWith("/stoicheia") || path === "/") {
      void navigate({ to: "/", search: { ...nextSearch, n: search.n ?? search.name } });
      return;
    }
    if (path === "/key" || path === "/doctrine" || path.startsWith("/stoicheia/doctrine") || path === "/almanac") {
      void navigate({ to: "/why", search: nextSearch });
      return;
    }
    void navigate({ to: path, search: nextSearch });
  }

  return (
    <div data-tongue={tongue} className="paper-field min-h-dvh text-fg">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" search={{ n: undefined, name: undefined, tongue: tongue === "el" ? "el" : undefined }} className="flex min-w-0 items-center gap-3">
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
                  search={item.to === "/" ? { n: search.n ?? search.name, tongue: tongue === "el" ? "el" : undefined } : { tongue: tongue === "el" ? "el" : undefined }}
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
          <p>A portrait of a username, not a prediction.</p>
          <Link
            to="/why"
            search={{ tongue: tongue === "el" ? "el" : undefined }}
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Why
          </Link>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-bg/95 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
          {VERBS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={item.to === "/" ? { n: search.n ?? search.name, tongue: tongue === "el" ? "el" : undefined } : { tongue: tongue === "el" ? "el" : undefined }}
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
