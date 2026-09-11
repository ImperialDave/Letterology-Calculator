/** Parse BRAIN_ADMIN_EMAILS: comma-separated, trimmed, lowercased. Empty → nobody. */
export function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isBrainAdminEmail(
  email: string | null | undefined,
  raw: string | undefined | null = typeof process !== "undefined" ? process.env.BRAIN_ADMIN_EMAILS : undefined,
): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).has(email.trim().toLowerCase());
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
