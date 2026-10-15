import { normalizeHandle } from "./handle";

export type HandlePlan =
  | { kind: "invalid" }
  | { kind: "unchanged" }
  | { kind: "spelling"; displayHandle: string }
  | { kind: "rename"; handle: string; displayHandle: string };

export type Reservation = "create" | "adopt" | "taken";

/** What a username edit is allowed to write, before Firestore is touched. */
export function planHandleChange(
  current: { handle: string; displayHandle: string },
  raw: string,
): HandlePlan {
  const parsed = normalizeHandle(raw);
  if (!parsed) return { kind: "invalid" };
  if (parsed.handle === current.handle && parsed.displayHandle === current.displayHandle) {
    return { kind: "unchanged" };
  }
  if (parsed.handle === current.handle) {
    return { kind: "spelling", displayHandle: parsed.displayHandle };
  }
  return { kind: "rename", handle: parsed.handle, displayHandle: parsed.displayHandle };
}

/** A slug doc we already own is adopted. Anyone else's slug is refused. */
export function reservationOf(existingUid: string | null, myUid: string): Reservation {
  if (!existingUid) return "create";
  if (existingUid === myUid) return "adopt";
  return "taken";
}
