/** Always-on court addresses. Extra names can still ride BRAIN_ADMIN_EMAILS. */
export const BUILT_IN_ADMIN_EMAILS = ["ericdanielevans@gmail.com"] as const;

/** Parse BRAIN_ADMIN_EMAILS: comma-separated, trimmed, lowercased. */
export function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function adminEmails(
  raw: string | undefined | null = typeof process !== "undefined" ? process.env.BRAIN_ADMIN_EMAILS : undefined,
): Set<string> {
  const set = parseAdminEmails(raw);
  for (const email of BUILT_IN_ADMIN_EMAILS) set.add(email);
  return set;
}

export function isBrainAdminEmail(
  email: string | null | undefined,
  raw: string | undefined | null = typeof process !== "undefined" ? process.env.BRAIN_ADMIN_EMAILS : undefined,
): boolean {
  if (!email) return false;
  return adminEmails(raw).has(email.trim().toLowerCase());
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
