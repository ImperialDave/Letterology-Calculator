import {
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAdditionalUserInfo,
  getRedirectResult,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "./app";

export type AuthProviderId = "google" | "x";

/** Twitter/X stays off until there is an app at developer.x.com. */
export const X_SIGN_IN_READY = false;

export type SignedInIdentity = {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
  provider: AuthProviderId;
  xScreenName: string | null;
};

export class AuthRedirectStarted extends Error {
  constructor() {
    super("Opening Google in this window.");
    this.name = "AuthRedirectStarted";
  }
}

const AUTH_ERRORS: Record<string, string> = {
  "auth/configuration-not-found":
    "Google sign-in is not turned on for this project yet.",
  "auth/operation-not-allowed": "That sign-in method is not enabled yet.",
  "auth/unauthorized-domain": "This site is not on the allowed list yet.",
  "auth/popup-blocked":
    "The sign-in window was blocked. Allow popups for this site, or we will try this window instead.",
  "auth/popup-closed-by-user": "The sign-in window closed before it finished.",
  "auth/cancelled-popup-request": "Another sign-in was already open.",
  "auth/network-request-failed": "The network dropped. Try again.",
  "auth/internal-error": "Google did not finish. Try again.",
};

function authCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code;
  }
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/auth\/[a-z0-9-]+/i);
  return match ? match[0].toLowerCase() : "";
}

export function explainAuthError(err: unknown): string {
  if (err instanceof AuthRedirectStarted) return err.message;
  return AUTH_ERRORS[authCode(err)] ?? (err instanceof Error ? err.message : "Sign-in did not finish.");
}

function providerOf(id: AuthProviderId) {
  if (id === "x") return new TwitterAuthProvider();
  const google = new GoogleAuthProvider();
  google.setCustomParameters({ prompt: "select_account" });
  return google;
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

export async function consumeRedirectResult(): Promise<SignedInIdentity | null> {
  if (!firebaseConfigured) return null;
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result) return null;
    const extra = getAdditionalUserInfo(result);
    const username = typeof extra?.username === "string" ? extra.username : null;
    return identityFromUser(result.user, username);
  } catch (err) {
    throw new Error(explainAuthError(err));
  }
}

export async function signInWith(id: AuthProviderId): Promise<SignedInIdentity> {
  if (!firebaseConfigured) {
    throw new Error("Firebase is not configured yet.");
  }
  if (id === "x" && !X_SIGN_IN_READY) {
    throw new Error("X needs its own app. Google works now.");
  }
  const auth = getFirebaseAuth();
  const provider = providerOf(id);
  try {
    const result = await signInWithPopup(auth, provider);
    const extra = getAdditionalUserInfo(result);
    const username = typeof extra?.username === "string" ? extra.username : null;
    return identityFromUser(result.user, username);
  } catch (err) {
    const code = authCode(err);
    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      throw new AuthRedirectStarted();
    }
    throw new Error(explainAuthError(err));
  }
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
