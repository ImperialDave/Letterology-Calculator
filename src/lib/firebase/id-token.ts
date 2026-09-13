import { firebaseConfigured, getFirebaseAuth } from "./app";

/** Browser helper: current Firebase ID token, or null if nobody is signed in. */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!firebaseConfigured) return null;
  const auth = getFirebaseAuth();
  try {
    if (typeof auth.authStateReady === "function") await auth.authStateReady();
  } catch {
    // fall through to currentUser
  }
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}
