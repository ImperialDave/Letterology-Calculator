import { createMiddleware } from "@tanstack/react-start";
import { ForbiddenError, isBrainAdminEmail } from "@/lib/letterology/brain-admin";

/**
 * Forwards a Firebase ID token when one exists. Does not require sign-in.
 * Used by public sitting submit so a signed-in guest can be attached.
 */
export const optionalFirebaseMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getFirebaseIdToken } = await import("./id-token");
    return next({ sendContext: { idToken: (await getFirebaseIdToken()) ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    let userId: string | null = null;
    const token = (context as { idToken?: string }).idToken;
    if (token) {
      try {
        const { verifyFirebaseIdToken } = await import("./id-token.server");
        const claims = await verifyFirebaseIdToken(token);
        userId = claims.uid;
      } catch {
        userId = null;
      }
    }
    return next({ context: { userId } });
  });

/** Requires a verified Firebase email on BRAIN_ADMIN_EMAILS. Fail closed if unset. */
export const brainAdminMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getFirebaseIdToken } = await import("./id-token");
    return next({ sendContext: { idToken: (await getFirebaseIdToken()) ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { UnauthorizedError } = await import("@/lib/auth/verify.server");
    const { verifyFirebaseIdToken } = await import("./id-token.server");
    assertSameSiteRequest();
    const token = (context as { idToken?: string }).idToken;
    if (!token) throw new UnauthorizedError();
    const claims = await verifyFirebaseIdToken(token);
    if (!claims.email || !claims.emailVerified) throw new ForbiddenError();
    if (!isBrainAdminEmail(claims.email)) throw new ForbiddenError();
    return next({ context: { userId: claims.uid, email: claims.email } });
  });
