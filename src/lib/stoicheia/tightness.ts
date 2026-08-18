import { familyOf } from "./family";
import type { HymnMotion } from "./motion";
import type { SomaWeight } from "./soma";
import { isVowel, type Stoich } from "./letters";

export type Tightness = "bound" | "loosed" | "held";

export type TightReading = {
  state: Tightness;
  reasons: string[];
  line: string;
};

export function tightnessOf(input: {
  closed: boolean;
  letters: Stoich[];
  weights: SomaWeight[];
  motion: HymnMotion;
  hymn: { planet: string }[];
}): TightReading {
  const vowels = input.letters.filter((letter) => isVowel(letter)).length;
  const consonants = input.letters.length - vowels;
  const doubleOffice = input.weights[0] ? familyOf(input.weights[0].letter) === "double" : false;
  const triple = input.weights.some((row) => row.count >= 3);
  const hardUnison =
    input.motion === "unison" &&
    (input.hymn[0]?.planet === "mars" || input.hymn[0]?.planet === "saturn");
  const liquidsLead = input.weights[0] ? familyOf(input.weights[0].letter) === "liquid" : false;
  const longAscent = input.motion === "ascent" && input.hymn.length >= 3;

  const boundMarks = [
    input.closed ? "it returns to its first hour" : "",
    doubleOffice ? "the public work is a double blow" : "",
    triple ? "one consonant insists three times" : "",
    hardUnison ? "the vowels stay on force or harvest" : "",
  ].filter(Boolean);
  const looseMarks = [
    !input.closed ? "the road is open" : "",
    vowels > consonants ? "there are more vowels than consonants" : "",
    liquidsLead ? "a binding sound leads the public work" : "",
    longAscent ? "the vowels make a long climb" : "",
  ].filter(Boolean);

  let state: Tightness = "held";
  if (boundMarks.length >= 2) state = "bound";
  else if (looseMarks.length >= 2) state = "loosed";

  const reasons = state === "bound" ? boundMarks : state === "loosed" ? looseMarks : [];
  const line =
    state === "bound"
      ? `This name is bound: ${reasons.join("; ")}. Do not open a second front. Finish the closed circuit or the insistent consonant before you start anything new.`
      : state === "loosed"
        ? `This name is loosed: ${reasons.join("; ")}. Choose one binding before sunset — a place, a person, or a deadline. The name will not bind itself.`
        : "This name is held — ordinary tension, not a knot and not a flight. Do one small public act and one small private act. No drama of destiny.";

  return { state, reasons, line };
}
