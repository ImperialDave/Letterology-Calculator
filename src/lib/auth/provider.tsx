import type { ReactNode } from "react";
import { HouseProvider } from "@/lib/firebase/house-provider";

/**
 * App-wide client provider. Firebase owns the session for CC33 houses.
 * Better Auth remains in the tree unused; do not rewrite server.ts.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <HouseProvider>{children}</HouseProvider>;
}
