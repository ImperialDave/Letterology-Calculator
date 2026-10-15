import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { VOICE } from "@/lib/letterology/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail, X_SIGN_IN_READY } from "@/lib/firebase/auth";
import { useHouse } from "@/lib/firebase/house-provider";
import { checkPassword, type PasswordProblem } from "@/lib/firebase/password-plan";
import { probePasswordEnabled } from "@/lib/firebase/preflight";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isBrainAdminEmail } from "@/lib/letterology/brain-admin";

type Search = { next?: "/court" | "/brain/roll" };

function safeNext(raw: unknown): "/court" | "/brain/roll" | undefined {
  if (raw === "/court" || raw === "/brain/roll") return raw;
  return undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    next: safeNext(search.next),
  }),
  component: Login,
});

function Login() {
  const house = useHouse();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();

  if (!isPending && user && isBrainAdminEmail(user.primaryEmail)) {
    return <Navigate to={search.next ?? "/court"} />;
  }
  if (!isPending && user && search.next) return <Navigate to={search.next} />;
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
                disabled={house.isPending}
                onClick={() => void house.signIn("apple")}
              >
                Continue with Apple
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
          {house.configured ? <EmailPasswordDoor /> : null}
          {house.doorMessage ? <p className="mt-4 text-sm leading-relaxed text-primary">{house.doorMessage}</p> : null}
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

function passwordProblemText(problem: PasswordProblem): string {
  if (problem === "short") return VOICE.housePasswordShort;
  if (problem === "mismatch") return VOICE.housePasswordMismatch;
  if (problem === "same-as-email") return VOICE.housePasswordEmail;
  return VOICE.housePasswordCurrent;
}

function EmailPasswordDoor() {
  const [phase, setPhase] = useState<"loading" | "on" | "off" | "unknown">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void probePasswordEnabled().then((value) => {
      setPhase(value === true ? "on" : value === false ? "off" : "unknown");
    });
  }, []);

  if (phase === "loading") {
    return <div className="mt-6 h-16 animate-pulse rounded-md bg-ink/10" />;
  }
  if (phase === "off") {
    return <p className="mt-6 text-sm leading-relaxed text-muted">{VOICE.housePasswordOff}</p>;
  }

  async function run(mode: "sign-in" | "create") {
    setError(null);
    if (mode === "create") {
      const problem = checkPassword({ password, confirm, email });
      if (problem) {
        setError(passwordProblemText(problem));
        return;
      }
    } else if (!email.trim() || password.length === 0) {
      setError(VOICE.loginPasswordEmpty);
      return;
    }
    setBusy(true);
    try {
      if (mode === "create") await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : VOICE.loginSignInFailed);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void run(creating ? "create" : "sign-in");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 border-t border-ink/10 pt-6">
      <p className="text-sm leading-relaxed text-muted">{VOICE.loginPasswordLede}</p>
      <div className="mt-4">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          className="mt-2"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="mt-4">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          className="mt-2"
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {creating ? (
        <div className="mt-4">
          <Label htmlFor="login-password-confirm">Confirm password</Label>
          <Input
            id="login-password-confirm"
            className="mt-2"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {creating ? "Create account" : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setError(null);
            setCreating((value) => !value);
          }}
        >
          {creating ? VOICE.loginHavePassword : "Create account"}
        </Button>
      </div>
    </form>
  );
}
