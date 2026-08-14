import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { loadRecent, loadRecentBonds } from "@/lib/letterology/recent";
import { getDb } from "./app";
import { normalizeHandle } from "./handle";
import type { SignedInIdentity } from "./auth";
import type { HandleSource, HouseProfile, RecentBond } from "./types";

export { normalizeHandle };

function asProfile(uid: string, data: Record<string, unknown>): HouseProfile | null {
  const handle = typeof data.handle === "string" ? data.handle : "";
  if (!handle) return null;
  const recents = Array.isArray(data.recents)
    ? data.recents.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
  const recentBonds = Array.isArray(data.recentBonds)
    ? data.recentBonds.filter((item): item is RecentBond => {
        return Boolean(item) && typeof item === "object" && typeof (item as RecentBond).a === "string" && typeof (item as RecentBond).b === "string";
      }).slice(0, 6)
    : [];
  return {
    uid,
    handle,
    displayHandle: typeof data.displayHandle === "string" ? data.displayHandle : handle,
    source: data.source === "x" || data.source === "linked" ? data.source : "google",
    xScreenName: typeof data.xScreenName === "string" ? data.xScreenName : null,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    lastSeenAt: typeof data.lastSeenAt === "number" ? data.lastSeenAt : Date.now(),
    recents,
    recentBonds,
  };
}

export async function loadProfile(uid: string): Promise<HouseProfile | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  return asProfile(uid, snap.data());
}

export async function claimHandle(
  identity: SignedInIdentity,
  rawHandle: string,
  source: HandleSource,
): Promise<HouseProfile> {
  const parsed = normalizeHandle(rawHandle);
  if (!parsed) throw new Error("That handle has no A–Z in it.");

  const db = getDb();
  const userRef = doc(db, "users", identity.uid);
  const handleRef = doc(db, "handles", parsed.handle);
  const now = Date.now();
  const recents = loadRecent();
  const recentBonds = loadRecentBonds();

  await runTransaction(db, async (tx) => {
    const existingUser = await tx.get(userRef);
    if (existingUser.exists()) {
      const already = asProfile(identity.uid, existingUser.data());
      if (already) throw new Error("This house is already claimed.");
    }
    const taken = await tx.get(handleRef);
    if (taken.exists() && taken.data()?.uid !== identity.uid) {
      throw new Error("That handle already sits a house.");
    }
    tx.set(handleRef, { uid: identity.uid, claimedAt: serverTimestamp() });
    tx.set(userRef, {
      handle: parsed.handle,
      displayHandle: parsed.displayHandle,
      source,
      xScreenName: identity.xScreenName,
      photoURL: identity.photoURL,
      createdAt: now,
      lastSeenAt: now,
      recents,
      recentBonds,
    });
  });

  return {
    uid: identity.uid,
    handle: parsed.handle,
    displayHandle: parsed.displayHandle,
    source,
    xScreenName: identity.xScreenName,
    photoURL: identity.photoURL,
    createdAt: now,
    lastSeenAt: now,
    recents,
    recentBonds,
  };
}

export async function touchProfile(profile: HouseProfile): Promise<void> {
  await updateDoc(doc(getDb(), "users", profile.uid), { lastSeenAt: Date.now() });
}

export async function saveProfileRecents(uid: string, recents: string[], recentBonds: RecentBond[]) {
  await setDoc(
    doc(getDb(), "users", uid),
    { recents: recents.slice(0, 8), recentBonds: recentBonds.slice(0, 6), lastSeenAt: Date.now() },
    { merge: true },
  );
}

export async function leaveHouse(profile: HouseProfile) {
  const db = getDb();
  await runTransaction(db, async (tx) => {
    const handleRef = doc(db, "handles", profile.handle);
    const userRef = doc(db, "users", profile.uid);
    const held = await tx.get(handleRef);
    if (held.exists() && held.data()?.uid === profile.uid) tx.delete(handleRef);
    tx.delete(userRef);
  });
}
