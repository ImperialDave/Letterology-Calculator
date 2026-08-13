import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="login" />
      <main className="mx-auto grid min-h-[70dvh] w-full max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-xl bg-raised p-6 shadow-[var(--shadow-border)] sm:p-8">
          <p className="font-display text-xs tracking-[0.2em] text-muted uppercase">Account</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Readings work without an account. Sign in if you want a saved session on this device.
          </p>
          <div className="mt-6 space-y-2">
            {authEnabled ? (
              GROK_PROVIDERS.map((provider) => (
                <Button
                  key={provider.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
                >
                  Continue with {provider.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted">Sign-in is disabled.</p>
            )}
          </div>
          <Link
            to="/"
            className="mt-6 inline-flex h-9 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            Return to the reading
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
