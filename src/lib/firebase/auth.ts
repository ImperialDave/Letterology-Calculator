import {
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAdditionalUserInfo,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "./app";

export type AuthProviderId = "google" | "x";

export type SignedInIdentity = {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
  provider: AuthProviderId;
  xScreenName: string | null;
};

function providerOf(id: AuthProviderId) {
  return id === "x" ? new TwitterAuthProvider() : new GoogleAuthProvider();
}

function detectProvider(user: User): AuthProviderId {
  const ids = user.providerData.map((item) => item.providerId);
  if (ids.includes("twitter.com")) return "x";
  return "google";
}

function xNameFromUser(user: User): string | null {
  const twitter = user.providerData.find((item) => item.providerId === "twitter.com");
  if (twitter?.uid && /^[A-Za-z0-9_]{1,15}$/.test(twitter.uid)) {
    return twitter.uid;
  }
  return null;
}

export function identityFromUser(user: User, xScreenName?: string | null): SignedInIdentity {
  return {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
    displayName: user.displayName,
    provider: detectProvider(user),
    xScreenName: xScreenName ?? xNameFromUser(user),
  };
}

export function listenAuth(onChange: (identity: SignedInIdentity | null) => void): () => void {
  if (!firebaseConfigured) {
    onChange(null);
    return () => undefined;
  }
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    onChange(user ? identityFromUser(user) : null);
  });
}

export async function signInWith(id: AuthProviderId): Promise<SignedInIdentity> {
  if (!firebaseConfigured) {
    throw new Error("Firebase is not configured yet.");
  }
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, providerOf(id));
  const extra = getAdditionalUserInfo(result);
  const username = typeof extra?.username === "string" ? extra.username : null;
  return identityFromUser(result.user, username);
}

export async function linkX(): Promise<SignedInIdentity> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Sign in first.");
  const result = await linkWithPopup(auth.currentUser, new TwitterAuthProvider());
  const extra = getAdditionalUserInfo(result);
  const username = typeof extra?.username === "string" ? extra.username : null;
  return identityFromUser(result.user, username);
}

export async function signOutHouse() {
  if (!firebaseConfigured) return;
  await firebaseSignOut(getFirebaseAuth());
}
