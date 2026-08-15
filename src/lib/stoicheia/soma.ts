import { DOUBLES, isVowel, type Stoich } from "./letters";

export type SomaWeight = {
  letter: Stoich;
  count: number;
  weight: number;
};

export function weighSoma(letters: Stoich[]): SomaWeight[] {
  const map = new Map<Stoich, SomaWeight>();
  letters.forEach((letter, index) => {
    if (isVowel(letter)) return;
    const edge = index === 0 || index === letters.length - 1;
    const bonus = (DOUBLES.has(letter) ? 1.4 : 1) + (edge ? 0.35 : 0);
    const existing = map.get(letter);
    if (existing) {
      existing.count += 1;
      existing.weight += bonus;
    } else {
      map.set(letter, { letter, count: 1, weight: bonus });
    }
  });
  return [...map.values()].sort((a, b) => b.weight - a.weight || a.letter.localeCompare(b.letter));
}

export function somaOffices(letters: Stoich[]): { office: Stoich | null; place: Stoich | null } {
  const ranked = weighSoma(letters);
  return { office: ranked[0]?.letter ?? null, place: ranked[1]?.letter ?? null };
}
