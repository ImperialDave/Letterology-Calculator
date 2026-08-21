/**
 * Let X (and Grok) frame the playable so a feed tap can run the well
 * in-app. Do not add a default-src CSP — that would block grok.com's
 * branding injector.
 */
const FRAME_ANCESTORS =
  "'self' https://x.com https://*.x.com https://twitter.com https://*.twitter.com https://grok.com https://*.grok.com https://*.grok.me https://*.grok-sandbox.com";

interface EmbedEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

export default async function playEmbedMiddleware(
  _event: EmbedEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (!(result instanceof Response)) return result;
  result.headers.delete("x-frame-options");
  if (!result.headers.has("content-security-policy")) {
    result.headers.set("content-security-policy", `frame-ancestors ${FRAME_ANCESTORS}`);
  }
  return result;
}
