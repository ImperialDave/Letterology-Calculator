import { Link } from "@tanstack/react-router";
import { CLUB_NAME, SITE_LOCKUP, SYSTEM_NAME } from "@/lib/letterology/brand";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-9 w-16 rounded-md bg-ink/10" aria-hidden="true" />;
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
        className="inline-flex h-9 items-center rounded-md px-3 font-display text-xs tracking-[0.14em] text-muted uppercase transition-colors hover:text-ink"
      >
        Sign in
      </Link>
    </SignedOut>
  );
}

const NAV: {
  to: "/" | "/bond" | "/count" | "/stoicheia" | "/atlas" | "/archetypes" | "/circle" | "/almanac";
  label: string;
  current: HeaderCurrent;
}[] = [
  { to: "/", label: "Read", current: "read" },
  { to: "/bond", label: "Bond", current: "bond" },
  { to: "/count", label: "Count", current: "count" },
  { to: "/stoicheia", label: "Stoicheia", current: "stoicheia" },
  { to: "/atlas", label: "Atlas", current: "atlas" },
  { to: "/archetypes", label: "Houses", current: "houses" },
  { to: "/circle", label: "Circle", current: "circle" },
  { to: "/almanac", label: "Year", current: "almanac" },
];

export type HeaderCurrent =
  | "read"
  | "bond"
  | "count"
  | "stoicheia"
  | "atlas"
  | "houses"
  | "circle"
  | "almanac"
  | "login"
  | "key";

export function SiteHeader({ current }: { current: HeaderCurrent }) {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:h-16 sm:flex-nowrap sm:py-0 sm:px-6">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/seal.jpg"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-lg tracking-[0.14em] text-ink">
              {CLUB_NAME}
            </span>
            <span className="block truncate font-display text-[0.62rem] tracking-[0.2em] text-muted uppercase">
              {SYSTEM_NAME}
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
                current === item.current ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
          <AuthSlot />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink/10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted sm:px-6">
        <p className="font-display text-xs tracking-[0.2em] text-ink uppercase">{SITE_LOCKUP}</p>
        <p>Twenty-six houses. A portrait of a username, not a prediction.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5">
          <Link
            to="/doctrine"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            The Doctrine
          </Link>
          <Link
            to="/stoicheia"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Stoicheia
          </Link>
          <Link
            to="/key"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            The Key
          </Link>
          <Link
            to="/bond"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
          >
            Compare two usernames
          </Link>
        </div>
      </div>
    </footer>
  );
}
