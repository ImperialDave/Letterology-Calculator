import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function env(name: string): string {
  const meta = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  return String(meta[name] ?? "").trim();
}

function readConfig(): FirebaseWebConfig | null {
  const apiKey = env("VITE_FIREBASE_API_KEY");
  const authDomain = env("VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = env("VITE_FIREBASE_PROJECT_ID");
  const appId = env("VITE_FIREBASE_APP_ID");
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET") || undefined,
    messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID") || undefined,
  };
}

export const firebaseConfig = readConfig();
export const firebaseConfigured = firebaseConfig !== null;

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfig) {
    throw new Error("Firebase is not configured. Set VITE_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, and APP_ID.");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
