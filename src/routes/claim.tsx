import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { DayCard } from "@/components/letterology/DayCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHouse } from "@/lib/firebase/house-provider";
import { normalizeHandle } from "@/lib/firebase/profile";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { buildHoroscope } from "@/lib/letterology/engine";

export const Route = createFileRoute("/claim")({ component: ClaimPage });

function ClaimPage() {
  const house = useHouse();
  const { user, isPending } = useCurrentUserState();
  const [raw, setRaw] = useState(house.identity?.xScreenName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = normalizeHandle(raw);
  const horoscope = useMemo(() => (parsed ? buildHoroscope(parsed.displayHandle) : null), [parsed]);

  if (!isPending && !user) return <Navigate to="/login" />;
  if (!isPending && user?.handle) return <Navigate to="/house" />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await house.claim(raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That handle could not be claimed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="login" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mx-auto max-w-xl">
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Claim the handle</h1>
          <p className="mt-3 leading-relaxed text-ink/85">
            Type the username you live under. The Letter Path paints as you type. That string is
            the only material.
          </p>
          <form onSubmit={onSubmit} className="mt-8">
            <Label htmlFor="claim-handle">Your username</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="claim-handle"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                placeholder="@lovelace"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
              <Button type="submit" className="h-12 shrink-0" disabled={busy || !parsed}>
                Claim this handle
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted">
              The handle you live under. @ is optional. Diacritics fold; only A–Z are read.
            </p>
            {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
          </form>
        </header>

        {horoscope ? (
          <div className="mt-10 space-y-8">
            <DayCard horoscope={horoscope} />
            <ArchetypeCard archetype={horoscope.archetype} featured />
          </div>
        ) : null}

        <p className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-muted uppercase"
          >
            Read without sitting
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
