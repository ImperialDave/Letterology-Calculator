import { createMiddleware } from "@tanstack/react-start";

/**
 * Club sign-in for Logostax tables and saved solves.
 * The phone sends a Firebase ID token. A missing token is a guest: solo play
 * stays on the device, and a table call is refused.
 */
export const logostaxAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getFirebaseIdToken } = await import("@/lib/firebase/id-token");
    return next({ sendContext: { idToken: (await getFirebaseIdToken()) ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { UnauthorizedError } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const token = (context as { idToken?: string }).idToken;
    if (!token) throw new UnauthorizedError();
    const { verifyFirebaseIdToken } = await import("@/lib/firebase/id-token.server");
    const claims = await verifyFirebaseIdToken(token);
    return next({ context: { userId: claims.uid } });
  });
