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
import { planHandleChange, reservationOf } from "./handle-change";
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
    source:
      data.source === "x" || data.source === "apple" || data.source === "linked" ? data.source : "google",
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

const TAKEN = "That username is already taken.";
const NO_LETTERS = "That username has no A–Z in it.";

/**
 * Create the slug doc and wait until that commit is visible.
 * The user doc is written after, because security rules read the slug
 * as it already exists and do not see other writes in the same transaction.
 * Update on a slug doc is forbidden, so an existing doc we own is left alone.
 */
async function reserveHandle(uid: string, slug: string): Promise<"create" | "adopt"> {
  const db = getDb();
  const handleRef = doc(db, "handles", slug);
  let reservation: "create" | "adopt" = "create";
  await runTransaction(db, async (tx) => {
    const taken = await tx.get(handleRef);
    const existingUid = taken.exists() && typeof taken.data()?.uid === "string" ? taken.data().uid : null;
    const next = reservationOf(existingUid, uid);
    if (next === "taken") throw new Error(TAKEN);
    reservation = next;
    if (next === "create") {
      tx.set(handleRef, { uid, claimedAt: serverTimestamp() });
    }
  });
  return reservation;
}

async function releaseHandle(uid: string, slug: string): Promise<void> {
  const db = getDb();
  const handleRef = doc(db, "handles", slug);
  await runTransaction(db, async (tx) => {
    const held = await tx.get(handleRef);
    if (held.exists() && held.data()?.uid === uid) tx.delete(handleRef);
  });
}

export async function claimHandle(
  identity: SignedInIdentity,
  rawHandle: string,
  source: HandleSource,
): Promise<HouseProfile> {
  const parsed = normalizeHandle(rawHandle);
  if (!parsed) throw new Error(NO_LETTERS);

  const db = getDb();
  const userRef = doc(db, "users", identity.uid);
  const existingUser = await getDoc(userRef);
  if (existingUser.exists() && asProfile(identity.uid, existingUser.data())) {
    throw new Error("This house is already claimed.");
  }

  const now = Date.now();
  const recents = loadRecent();
  const recentBonds = loadRecentBonds();
  const reserved = await reserveHandle(identity.uid, parsed.handle);
  const profile = {
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
  try {
    await setDoc(userRef, profile);
  } catch (err) {
    if (reserved === "create") await releaseHandle(identity.uid, parsed.handle).catch(() => undefined);
    throw err;
  }

  return { uid: identity.uid, ...profile };
}

/** Change the username we read. Spelling-only edits do not move the public path. */
export async function renameHandle(profile: HouseProfile, raw: string): Promise<HouseProfile> {
  const plan = planHandleChange(profile, raw);
  if (plan.kind === "invalid") throw new Error(NO_LETTERS);
  if (plan.kind === "unchanged") return profile;

  const userRef = doc(getDb(), "users", profile.uid);
  const lastSeenAt = Date.now();
  if (plan.kind === "spelling") {
    await updateDoc(userRef, { displayHandle: plan.displayHandle, lastSeenAt });
    return { ...profile, displayHandle: plan.displayHandle, lastSeenAt };
  }

  const reserved = await reserveHandle(profile.uid, plan.handle);
  try {
    await updateDoc(userRef, {
      handle: plan.handle,
      displayHandle: plan.displayHandle,
      lastSeenAt,
    });
  } catch (err) {
    if (reserved === "create") await releaseHandle(profile.uid, plan.handle).catch(() => undefined);
    throw err;
  }
  await releaseHandle(profile.uid, profile.handle);
  return { ...profile, handle: plan.handle, displayHandle: plan.displayHandle, lastSeenAt };
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
