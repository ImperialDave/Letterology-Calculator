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
  const enter = axis.entersAsBreath ? "starts on a vowel" : "starts on a consonant";
  const leave = axis.finishesAsBlow ? "ends on a consonant" : "ends on a vowel";
  if (axis.closed) {
    return `First and last are the same letter, ${axis.proodos}, so the name ${enter} and comes back to that mark. A closed road means finish what you start, or you will walk the same hour again.`;
  }
  return `First letter ${axis.proodos}, last letter ${axis.epistrophe}. The name ${enter} and ${leave}, so that pair is the voyage — how you arrive, how you leave the room.`;
}
