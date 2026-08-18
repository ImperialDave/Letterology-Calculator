import type { ElementMix } from "./book";

/** Clear act from the mouth's lead element — guidance, not a second theory. */
export function elementLeadAct(mix: ElementMix): string {
  if (mix.tied.length > 1) {
    return "The mouth is split — pick one element for the next hour and stay with it.";
  }
  const leadAct: Record<string, string> = {
    fire: "Lead with fire today: one decisive cut.",
    air: "Lead with air today: one clear sentence spoken aloud.",
    water: "Lead with water today: one binding or one yielding.",
    earth: "Lead with earth today: one finished object you can set down.",
  };
  return leadAct[mix.lead] ?? "";
}

export function withElementAct(letterLine: string, mix: ElementMix): string {
  const act = elementLeadAct(mix);
  if (!act) return letterLine;
  if (letterLine.includes(act)) return letterLine;
  return `${letterLine} ${act}`;
}
