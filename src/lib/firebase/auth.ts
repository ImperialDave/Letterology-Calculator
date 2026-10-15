import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "./app";

export type AuthProviderId = "google" | "apple" | "x";

/** Twitter/X stays off until there is an app at developer.x.com. */
export const X_SIGN_IN_READY = false;

export type SignedInIdentity = {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
  provider: AuthProviderId;
  /** Google, Apple, or X when one of those is linked. Null for a password-only account. */
  socialProvider: AuthProviderId | null;
  hasPassword: boolean;
  xScreenName: string | null;
};

const RESET_CONTINUE_URL = "https://www.letterology.club/login";

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
  "auth/invalid-email": "That email or password did not match.",
  "auth/user-not-found": "That email or password did not match.",
  "auth/wrong-password": "That email or password did not match.",
  "auth/invalid-credential": "That email or password did not match.",
  "auth/email-already-in-use":
    "That email already has a sign-in. Use Google or Apple, then set a password from your house.",
  "auth/account-exists-with-different-credential":
    "That email already has a sign-in. Use Google or Apple, then set a password from your house.",
  "auth/requires-recent-login": "Sign in again, then retry.",
  "auth/weak-password": "Use at least 12 characters.",
  "auth/too-many-requests": "Too many tries. Wait a moment.",
  "auth/provider-already-linked": "A password is already set on this account.",
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

function explainPasswordError(err: unknown): string {
  if (authCode(err) === "auth/operation-not-allowed") {
    return "A password is not turned on for this club yet.";
  }
  return explainAuthError(err);
}

function providerOf(id: AuthProviderId) {
  if (id === "x") return new TwitterAuthProvider();
  if (id === "apple") {
    const apple = new OAuthProvider("apple.com");
    apple.addScope("email");
    apple.addScope("name");
    return apple;
  }
  const google = new GoogleAuthProvider();
  google.setCustomParameters({ prompt: "select_account" });
  return google;
}

function socialProviderOf(user: User): AuthProviderId | null {
  const ids = user.providerData.map((item) => item.providerId);
  if (ids.includes("twitter.com")) return "x";
  if (ids.includes("apple.com")) return "apple";
  if (ids.includes("google.com")) return "google";
  return null;
}

function hasPasswordProvider(user: User): boolean {
  return user.providerData.some((item) => item.providerId === "password");
}

function xNameFromUser(user: User): string | null {
  const twitter = user.providerData.find((item) => item.providerId === "twitter.com");
  if (twitter?.uid && /^[A-Za-z0-9_]{1,15}$/.test(twitter.uid)) {
    return twitter.uid;
  }
  return null;
}

export function identityFromUser(user: User, xScreenName?: string | null): SignedInIdentity {
  const socialProvider = socialProviderOf(user);
  return {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
    displayName: user.displayName,
    provider: socialProvider ?? "google",
    socialProvider,
    hasPassword: hasPasswordProvider(user),
    xScreenName: xScreenName ?? xNameFromUser(user),
  };
}

function requireCurrentUser(): User {
  const user = firebaseConfigured ? getFirebaseAuth().currentUser : null;
  if (!user) throw new Error("Sign in first.");
  return user;
}

export async function reloadIdentity(): Promise<SignedInIdentity | null> {
  if (!firebaseConfigured) return null;
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  await user.reload();
  return identityFromUser(user);
}

export async function signInWithEmail(email: string, password: string): Promise<SignedInIdentity> {
  if (!firebaseConfigured) throw new Error("Firebase is not configured yet.");
  try {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    return identityFromUser(cred.user);
  } catch (err) {
    throw new Error(explainPasswordError(err));
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<SignedInIdentity> {
  if (!firebaseConfigured) throw new Error("Firebase is not configured yet.");
  try {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    return identityFromUser(cred.user);
  } catch (err) {
    throw new Error(explainPasswordError(err));
  }
}

/** Fresh sign-in before a password change, a rename is not required to, or a delete. */
export async function reauthenticateAccount(currentPassword?: string): Promise<void> {
  const user = requireCurrentUser();
  try {
    if (currentPassword && user.email && hasPasswordProvider(user)) {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      return;
    }
    const social = socialProviderOf(user);
    if (!social) throw new Error("Sign in again, then retry.");
    await reauthenticateWithPopup(user, providerOf(social));
  } catch (err) {
    throw new Error(explainAuthError(err));
  }
}

/** Attach a password to the email already on this Firebase user. Same uid. */
export async function setAccountPassword(password: string): Promise<SignedInIdentity> {
  const user = requireCurrentUser();
  if (!user.email) throw new Error("This sign-in has no email, so a password cannot be attached.");
  await reauthenticateAccount();
  try {
    const linked = await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return identityFromUser(linked.user);
  } catch (err) {
    throw new Error(explainPasswordError(err));
  }
}

export async function changeAccountPassword(currentPassword: string, nextPassword: string): Promise<void> {
  const user = requireCurrentUser();
  if (!user.email) throw new Error("This sign-in has no email, so a password cannot be attached.");
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, nextPassword);
  } catch (err) {
    throw new Error(explainPasswordError(err));
  }
}

export async function sendAccountReset(email: string): Promise<void> {
  if (!firebaseConfigured) throw new Error("Firebase is not configured yet.");
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
      url: RESET_CONTINUE_URL,
      handleCodeInApp: false,
    });
  } catch (err) {
    throw new Error(explainPasswordError(err));
  }
}

export async function deleteAuthUser(): Promise<void> {
  const user = requireCurrentUser();
  try {
    await deleteUser(user);
  } catch (err) {
    throw new Error(explainAuthError(err));
  }
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
