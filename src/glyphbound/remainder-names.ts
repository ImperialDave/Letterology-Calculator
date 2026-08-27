/** Unique Remainder ledger titles. Index matches stage number. */
export const REMAINDER_NAMES: Record<number, string> = {
  30: "The Period",
  31: "Gold Orrery",
  32: "Night Lattice",
  33: "White Margin",
  34: "Ember Script",
  35: "The Circumflex",
  36: "Hail Glass",
  37: "Storm Script",
  38: "Day Garden",
  39: "High Ice",
  40: "Void Point",
  41: "Teal Orrery",
  42: "Ink Garden",
  43: "Rime Lattice",
  44: "Aurora Spire",
  45: "Foundry Script",
  46: "Mirror Void",
  47: "Packed Ice",
  48: "Lightning Rule",
  49: "Gold Script",
  50: "Glass Vault",
  51: "Static Remainder",
  52: "Hail Lattice",
  53: "Garden Aurora",
  54: "Ribs of the Count",
  55: "Gold Remainder",
  56: "White Glass",
  57: "Lightning Orrery",
  58: "Ember Lattice",
  59: "Mirror Night",
  60: "The Remainder",
};

export const REMAINDER_OBJECTIVES: Record<number, string> = {
  30: "End-Mark waits in the vault. Close the first book.",
  35: "The circumflex hangs. Clear the warden.",
  40: "A void point. Clear the warden, take the gate.",
  45: "The foundry still sets type in fire. Clear the warden.",
  50: "Glass vault. The count is thinner here.",
  55: "Gold remainder. One more warden before the last page.",
  60: "The last ledger. Defeat the Remainder. Take the FINAL gate.",
};

export function remainderName(n: number, boss: boolean) {
  return REMAINDER_NAMES[n] ?? (boss ? `Warden ${n}` : `Ledger ${n}`);
}

export function remainderObjective(n: number, boss: boolean) {
  return REMAINDER_OBJECTIVES[n] ?? (boss ? "Clear the warden. Take the gate." : "Cross this remainder. Reach the gate.");
}
