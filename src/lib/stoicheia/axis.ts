import { isVowel, type Stoich } from "./letters";

export type Axis = {
  proodos: Stoich;
  epistrophe: Stoich;
  closed: boolean;
  entersAsBreath: boolean;
  finishesAsBlow: boolean;
};

export function axisOf(letters: Stoich[]): Axis | null {
  const first = letters[0];
  const last = letters[letters.length - 1];
  if (!first || !last) return null;
  return {
    proodos: first,
    epistrophe: last,
    closed: first === last,
    entersAsBreath: isVowel(first),
    finishesAsBlow: !isVowel(last),
  };
}

export function axisCopy(axis: Axis): string {
  const enter = axis.entersAsBreath ? "starts on a vowel — breath first" : "starts on a consonant — contact first";
  const leave = axis.finishesAsBlow ? "ends on a consonant — a blow that closes the room" : "ends on a vowel — breath still open";
  if (axis.closed) {
    return `First and last are the same letter, ${axis.proodos}, so the name ${enter} and returns to that mark. Proodos and epistrophe coincide: a closed road. Finish what you start, or you will walk the same hour again.`;
  }
  return `First letter ${axis.proodos}, last letter ${axis.epistrophe}. The name ${enter} and ${leave}. That pair is the voyage — procession out, return home — how you arrive, how you leave the room.`;
}
