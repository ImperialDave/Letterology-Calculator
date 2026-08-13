import { Link } from "@tanstack/react-router";
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

export function SiteHeader({ current }: { current: "read" | "atlas" | "houses" | "circle" | "almanac" | "login" }) {
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
          <span className="truncate font-display text-lg tracking-[0.04em] text-ink">
            Letterology
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-2">
          <Link
            to="/"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
              current === "read" ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Read
          </Link>
          <Link
            to="/atlas"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
              current === "atlas" ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Atlas
          </Link>
          <Link
            to="/archetypes"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
              current === "houses" ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Houses
          </Link>
          <Link
            to="/circle"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
              current === "circle" ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Circle
          </Link>
          <Link
            to="/almanac"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-2 font-display text-xs tracking-[0.14em] uppercase sm:px-3",
              current === "almanac" ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Year
          </Link>
          <AuthSlot />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink/10">
      <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted sm:px-6">
        Twenty-six houses. A portrait of a username, not a prediction.
      </div>
    </footer>
  );
}
