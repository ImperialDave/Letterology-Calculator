import type { ReactNode } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { useHouse } from "@/lib/firebase/house-provider";
import { pigmentOf } from "@/lib/letterology/pigment";
import { authEnabled } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

export const SIGN_IN_PATH = "/login";

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function UserButton() {
  const user = useCurrentUser();
  const house = useHouse();
  if (!user) return null;
  const handle = user.displayHandle ?? user.handle;
  const letter = (user.handle ?? "?").slice(0, 1).toUpperCase();
  const pigment = user.handle ? pigmentOf(letter) : null;

  if (user.needsClaim) {
    return (
      <Link
        to="/claim"
        className="inline-flex h-9 items-center rounded-md px-3 font-display text-xs tracking-[0.14em] text-primary uppercase"
      >
        Claim your handle
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/house" className="flex min-h-11 items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-full font-display text-sm"
          style={
            pigment
              ? { backgroundColor: pigment.css, color: pigment.ink }
              : { backgroundColor: "var(--color-primary)", color: "var(--color-primary-fg)" }
          }
        >
          {letter}
        </span>
        <span className="max-w-[9rem] truncate font-display text-sm text-ink">
          {handle ?? user.displayName ?? "House"}
        </span>
      </Link>
      {authEnabled ? (
        <button
          type="button"
          onClick={() => void house.signOut()}
          className="hidden font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink sm:inline"
        >
          Leave
        </button>
      ) : null}
    </div>
  );
}
