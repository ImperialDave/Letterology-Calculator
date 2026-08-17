import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildHoroscope } from "@/lib/letterology/engine";
import { firebaseConfigured } from "./app";
import {
  AuthRedirectStarted,
  consumeRedirectResult,
  explainAuthError,
  listenAuth,
  signInWith,
  signOutHouse,
  type AuthProviderId,
  type SignedInIdentity,
} from "./auth";
import { probeAuthDoor, type AuthDoorStatus } from "./preflight";
import { claimHandle, loadProfile, touchProfile } from "./profile";
import type { HouseProfile } from "./types";

export type HouseSession = {
  configured: boolean;
  isPending: boolean;
  identity: SignedInIdentity | null;
  profile: HouseProfile | null;
  needsClaim: boolean;
  googleReady: boolean;
  doorMessage: string | null;
  error: string | null;
  signIn: (id: AuthProviderId) => Promise<void>;
  claim: (raw: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const HouseContext = createContext<HouseSession | null>(null);

export function HouseProvider({ children }: { children: ReactNode }) {
  const [isPending, setPending] = useState(firebaseConfigured);
  const [identity, setIdentity] = useState<SignedInIdentity | null>(null);
  const [profile, setProfile] = useState<HouseProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [door, setDoor] = useState<AuthDoorStatus | null>(null);

  async function hydrate(next: SignedInIdentity | null, autoClaim = false) {
    if (!next) {
      setIdentity(null);
      setProfile(null);
      setPending(false);
      return;
    }
    setIdentity(next);
    try {
      let sitting = await loadProfile(next.uid);
      if (!sitting && autoClaim && next.xScreenName) {
        sitting = await claimHandle(next, next.xScreenName, "x");
      }
      setProfile(sitting);
      if (sitting) void touchProfile(sitting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The house could not be opened.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setPending(false);
      return;
    }
    const stop = listenAuth((next) => {
      void hydrate(next, false);
    });
    void consumeRedirectResult().catch((err) => {
      setError(explainAuthError(err));
      setPending(false);
    });
    if (typeof window !== "undefined") {
      void probeAuthDoor(window.location.origin).then(setDoor);
    }
    return stop;
  }, []);

  const value = useMemo<HouseSession>(
    () => ({
      configured: firebaseConfigured,
      isPending,
      identity,
      profile,
      needsClaim: Boolean(identity && !profile),
      googleReady: door?.ok === true,
      doorMessage: door && !door.ok ? door.message : null,
      error,
      async signIn(id) {
        setError(null);
        setPending(true);
        try {
          const next = await signInWith(id);
          await hydrate(next, id === "x");
        } catch (err) {
          if (err instanceof AuthRedirectStarted) return;
          setError(explainAuthError(err));
          setPending(false);
        }
      },
      async claim(raw) {
        if (!identity) throw new Error("Sign in first.");
        setError(null);
        const sitting = await claimHandle(identity, raw, identity.xScreenName ? "x" : "google");
        setProfile(sitting);
      },
      async signOut() {
        await signOutHouse();
        setIdentity(null);
        setProfile(null);
      },
      async refresh() {
        if (!identity) return;
        const sitting = await loadProfile(identity.uid);
        setProfile(sitting);
      },
    }),
    [door, error, identity, isPending, profile],
  );

  return <HouseContext.Provider value={value}>{children}</HouseContext.Provider>;
}

export function useHouse(): HouseSession {
  const ctx = useContext(HouseContext);
  if (!ctx) {
    return {
      configured: firebaseConfigured,
      isPending: false,
      identity: null,
      profile: null,
      needsClaim: false,
      googleReady: false,
      doorMessage: null,
      error: null,
      async signIn() {},
      async claim() {},
      async signOut() {},
      async refresh() {},
    };
  }
  return ctx;
}

export function useHouseHoroscope() {
  const { profile } = useHouse();
  return profile ? buildHoroscope(profile.displayHandle) : null;
}
