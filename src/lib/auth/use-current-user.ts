import { useHouse } from "@/lib/firebase/house-provider";
import { authEnabled } from "./client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
  handle: string | null;
  displayHandle: string | null;
  needsClaim: boolean;
};

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
  handle: null,
  displayHandle: null,
  needsClaim: false,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const house = useHouse();
  if (house.isPending) return { user: null, isPending: true };
  if (!house.identity) return { user: null, isPending: false };
  return {
    isPending: false,
    user: {
      id: house.identity.uid,
      displayName: house.profile?.displayHandle ?? house.identity.displayName,
      primaryEmail: house.identity.email,
      profileImageUrl: house.profile?.photoURL ?? house.identity.photoURL,
      isDevFallback: false,
      handle: house.profile?.handle ?? null,
      displayHandle: house.profile?.displayHandle ?? null,
      needsClaim: house.needsClaim,
    },
  };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
