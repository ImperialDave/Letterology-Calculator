import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { useHouse } from "@/lib/firebase/house-provider";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const house = useHouse();
  const { user, isPending } = useCurrentUserState();

  if (!isPending && user?.needsClaim) return <Navigate to="/claim" />;
  if (!isPending && user?.handle) return <Navigate to="/house" />;

  return (
    <div className="min-h-dvh">
      <SiteHeader current="login" />
      <main className="mx-auto grid min-h-[70dvh] w-full max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-xl bg-raised p-6 shadow-[var(--shadow-border)] sm:p-8">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Sit your house</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            X brings the handle. Google lets you claim one. The letters are the only material.
          </p>
          {!house.configured ? (
            <p className="mt-6 text-sm leading-relaxed text-primary">
              Firebase is not wired yet. Add the web config and the doors will open. Until then,
              readings still work as a guest.
            </p>
          ) : (
            <div className="mt-6 space-y-2">
              <Button className="w-full" disabled={house.isPending} onClick={() => void house.signIn("x")}>
                Continue with X
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={house.isPending}
                onClick={() => void house.signIn("google")}
              >
                Continue with Google
              </Button>
            </div>
          )}
          {house.error ? <p className="mt-4 text-sm text-primary">{house.error}</p> : null}
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            Read without sitting
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
