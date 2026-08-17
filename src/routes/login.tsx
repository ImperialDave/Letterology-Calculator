import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { VOICE } from "@/lib/letterology/voice";
import { Button } from "@/components/ui/button";
import { X_SIGN_IN_READY } from "@/lib/firebase/auth";
import { useHouse } from "@/lib/firebase/house-provider";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const house = useHouse();
  const { user, isPending } = useCurrentUserState();

  if (!isPending && user?.needsClaim) return <Navigate to="/claim" />;
  if (!isPending && user?.handle) return <Navigate to="/" />;

  return (
    <AppShell current="login">
      <div className="grid min-h-[60dvh] place-items-center">
        <div className="w-full rounded-xl bg-raised p-6 shadow-[var(--shadow-border)] sm:p-8">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{VOICE.loginLede}</p>
          {!house.configured ? (
            <p className="mt-6 text-sm leading-relaxed text-primary">
              Firebase is not wired yet. Add the web config and the doors will open. Until then,
              readings still work as a guest.
            </p>
          ) : (
            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                disabled={house.isPending}
                onClick={() => void house.signIn("google")}
              >
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={house.isPending || !X_SIGN_IN_READY}
                onClick={() => void house.signIn("x")}
              >
                Continue with X
              </Button>
              {!X_SIGN_IN_READY ? (
                <p className="pt-1 text-sm leading-relaxed text-muted">{VOICE.loginXSoon}</p>
              ) : null}
            </div>
          )}
          {house.doorMessage ? (
            <div className="mt-4 space-y-2 text-sm leading-relaxed text-primary">
              <p>{house.doorMessage}</p>
              <p>
                Open{" "}
                <a
                  className="underline"
                  href="https://console.firebase.google.com/project/cc33-24cc1/authentication/providers"
                >
                  Google in Firebase
                </a>
                , enable it, Save, then add{" "}
                <a
                  className="underline"
                  href="https://console.firebase.google.com/project/cc33-24cc1/authentication/settings"
                >
                  www.letterology.club
                </a>{" "}
                under Authorized domains.
              </p>
            </div>
          ) : null}
          {house.error ? <p className="mt-4 text-sm text-primary">{house.error}</p> : null}
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            Read without signing in
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
