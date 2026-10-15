import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  changeAccountPassword,
  deleteAuthUser,
  reauthenticateAccount,
  sendAccountReset,
  setAccountPassword,
  type SignedInIdentity,
} from "@/lib/firebase/auth";
import { useHouse } from "@/lib/firebase/house-provider";
import { normalizeHandle } from "@/lib/firebase/handle";
import { checkPassword, passwordMode, type PasswordProblem } from "@/lib/firebase/password-plan";
import { leaveHouse, renameHandle } from "@/lib/firebase/profile";
import { probePasswordEnabled } from "@/lib/firebase/preflight";
import type { HouseProfile } from "@/lib/firebase/types";
import { VOICE } from "@/lib/letterology/voice";

export const Route = createFileRoute("/house")({
  component: HousePage,
});

function passwordProblemText(problem: PasswordProblem): string {
  if (problem === "short") return VOICE.housePasswordShort;
  if (problem === "mismatch") return VOICE.housePasswordMismatch;
  if (problem === "same-as-email") return VOICE.housePasswordEmail;
  return VOICE.housePasswordCurrent;
}

function providerLine(identity: SignedInIdentity): string {
  const names: string[] = [];
  if (identity.socialProvider === "google") names.push("Google");
  if (identity.socialProvider === "apple") names.push("Apple");
  if (identity.socialProvider === "x") names.push("X");
  if (identity.hasPassword) names.push("a password");
  if (names.length === 0) return "Email";
  if (names.length === 1) return names[0] ?? "Email";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function HousePage() {
  const house = useHouse();
  const { user, isPending } = useCurrentUserState();

  if (isPending || house.isPending) {
    return (
      <AppShell current="login">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-md bg-ink/10" />
          <div className="h-24 animate-pulse rounded-xl bg-ink/10" />
          <div className="h-24 animate-pulse rounded-xl bg-ink/10" />
        </div>
      </AppShell>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (user.needsClaim || !house.profile || !house.identity) return <Navigate to="/claim" />;

  return (
    <AppShell current="login">
      <div className="mx-auto max-w-xl">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{VOICE.houseTitle}</h1>
        <p className="mt-3 leading-relaxed text-ink/85">{VOICE.houseLede}</p>
        <div className="mt-8 space-y-6">
          <UsernameBlock profile={house.profile} onSaved={() => house.refresh()} />
          <SignInBlock identity={house.identity} />
          <PasswordBlock identity={house.identity} onChanged={() => house.reload()} />
          <DangerBlock profile={house.profile} identity={house.identity} onLeft={() => house.signOut()} />
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function UsernameBlock({ profile, onSaved }: { profile: HouseProfile; onSaved: () => Promise<void> }) {
  const [raw, setRaw] = useState(profile.displayHandle);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRaw(profile.displayHandle);
  }, [profile.handle, profile.displayHandle]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await renameHandle(profile, raw);
      await onSaved();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : VOICE.houseTaken);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Username">
      <p className="text-sm text-muted">
        {VOICE.housePublic}:{" "}
        <Link
          to="/p/$slug"
          params={{ slug: profile.handle }}
          search={{ date: undefined }}
          className="text-primary"
        >
          /p/{profile.handle}
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-4">
        <Label htmlFor="house-handle">Username</Label>
        <Input
          id="house-handle"
          className="mt-2"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          autoCapitalize="none"
          spellCheck={false}
        />
        <p className="mt-2 text-sm text-muted">{VOICE.claimHint}</p>
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        {saved ? <p className="mt-3 text-sm text-ink">{VOICE.houseSaved}</p> : null}
        <Button type="submit" className="mt-4" disabled={busy || !normalizeHandle(raw)}>
          Save username
        </Button>
      </form>
    </Card>
  );
}

function SignInBlock({ identity }: { identity: SignedInIdentity }) {
  return (
    <Card title="Sign-in">
      <p className="text-sm text-ink">
        {VOICE.houseSignInWith} {providerLine(identity)}.
      </p>
      {identity.email ? (
        <p className="mt-2 text-sm text-ink">{identity.email}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">{VOICE.houseNoEmail}</p>
      )}
      {identity.email ? <p className="mt-2 text-sm text-muted">{VOICE.houseSignInNote}</p> : null}
      {identity.photoURL ? (
        <img
          src={identity.photoURL}
          alt=""
          width={48}
          height={48}
          className="mt-4 size-12 rounded-full object-cover"
        />
      ) : null}
    </Card>
  );
}

function PasswordBlock({
  identity,
  onChanged,
}: {
  identity: SignedInIdentity;
  onChanged: () => Promise<void>;
}) {
  const [phase, setPhase] = useState<"loading" | "on" | "off" | "unknown">("loading");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void probePasswordEnabled().then((value) => {
      setPhase(value === true ? "on" : value === false ? "off" : "unknown");
    });
  }, []);

  const mode = passwordMode({
    email: identity.email,
    hasPassword: identity.hasPassword,
    providerEnabled: phase !== "off",
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!identity.email || mode === "no-email" || mode === "provider-off") return;
    const problem = checkPassword({
      password,
      confirm,
      email: identity.email,
      current: mode === "change" ? current : undefined,
    });
    if (problem) {
      setError(passwordProblemText(problem));
      setNotice(null);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "set") await setAccountPassword(password);
      else await changeAccountPassword(current, password);
      setPassword("");
      setConfirm("");
      setCurrent("");
      await onChanged();
      setNotice(mode === "set" ? VOICE.housePasswordSaved : VOICE.housePasswordChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : VOICE.housePasswordFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!identity.email) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await sendAccountReset(identity.email);
      setNotice(VOICE.houseResetSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : VOICE.houseResetFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Password">
      {phase === "loading" ? <div className="h-16 animate-pulse rounded-md bg-ink/10" /> : null}
      {phase !== "loading" && mode === "provider-off" ? (
        <p className="text-sm text-muted">{VOICE.housePasswordOff}</p>
      ) : null}
      {phase !== "loading" && mode === "no-email" ? (
        <p className="text-sm text-muted">{VOICE.houseNoEmail}</p>
      ) : null}
      {phase !== "loading" && (mode === "set" || mode === "change") ? (
        <form onSubmit={onSubmit}>
          <p className="text-sm leading-relaxed text-muted">{VOICE.housePasswordSet}</p>
          {mode === "change" ? (
            <div className="mt-4">
              <Label htmlFor="house-current-password">Current password</Label>
              <Input
                id="house-current-password"
                className="mt-2"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </div>
          ) : null}
          <div className="mt-4">
            <Label htmlFor="house-password">New password</Label>
            <Input
              id="house-password"
              className="mt-2"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="house-password-confirm">Confirm password</Label>
            <Input
              id="house-password-confirm"
              className="mt-2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm text-ink">{notice}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {mode === "set" ? "Set password" : "Change password"}
            </Button>
            {mode === "change" ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => void onReset()}>
                Send a reset email
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function DangerBlock({
  profile,
  identity,
  onLeft,
}: {
  profile: HouseProfile;
  identity: SignedInIdentity;
  onLeft: () => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryDelete, setRetryDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirmed = normalizeHandle(typed)?.handle === profile.handle;
  const passwordOnly = identity.socialProvider === null && identity.hasPassword;

  async function onDelete(event: FormEvent) {
    event.preventDefault();
    if (!confirmed) {
      setError(VOICE.houseDeleteConfirm);
      return;
    }
    if (!retryDelete && passwordOnly && password.length === 0) {
      setError(VOICE.housePasswordCurrent);
      return;
    }
    setBusy(true);
    setError(null);
    let left = retryDelete;
    try {
      if (!left) {
        await reauthenticateAccount(passwordOnly ? password : undefined);
        await leaveHouse(profile);
        left = true;
      }
      await deleteAuthUser();
      setRetryDelete(false);
      await onLeft().catch(() => undefined);
    } catch (err) {
      if (left) setRetryDelete(true);
      setError(err instanceof Error ? err.message : VOICE.houseDeleteFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Leave">
      <Button type="button" variant="outline" onClick={() => void onLeft()}>
        Leave
      </Button>
      <form onSubmit={onDelete} className="mt-6 border-t border-ink/10 pt-6">
        <h3 className="font-display text-lg text-ink">Delete this account</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{VOICE.houseDeleteNote}</p>
        <Label htmlFor="house-delete-confirm" className="mt-4">
          Type {profile.displayHandle} to confirm
        </Label>
        <Input
          id="house-delete-confirm"
          className="mt-2"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoCapitalize="none"
          spellCheck={false}
        />
        {passwordOnly ? (
          <div className="mt-4">
            <Label htmlFor="house-delete-password">Password</Label>
            <Input
              id="house-delete-password"
              className="mt-2"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        <Button type="submit" className="mt-4" variant="outline" disabled={busy || !confirmed}>
          {retryDelete ? "Retry delete" : "Delete this account"}
        </Button>
      </form>
    </Card>
  );
}
