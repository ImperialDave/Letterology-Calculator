import { nameToSlug } from "@/lib/letterology/share";

export function normalizeHandle(raw: string): { handle: string; displayHandle: string } | null {
  const displayHandle = raw.trim().replace(/\s+/g, " ");
  const handle = nameToSlug(displayHandle.replace(/^@+/, ""));
  if (!handle) return null;
  return { handle, displayHandle: displayHandle.startsWith("@") ? `@${handle}` : displayHandle };
}
