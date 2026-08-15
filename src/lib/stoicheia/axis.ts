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
  const enter = axis.entersAsBreath ? "enters as breath" : "enters as a collision";
  const leave = axis.finishesAsBlow ? "finishes as a blow" : "finishes as breath";
  if (axis.closed) {
    return `A closed rite: ${axis.proodos} at both doors. The name ${enter} and returns to the same mark.`;
  }
  return `Proodos ${axis.proodos}, epistrophe ${axis.epistrophe}. The name ${enter} and ${leave}.`;
}
