import type { Letter } from "./types";
import { ALPHABET } from "./types";
import { PAIRS_A } from "./pairs/a";
import { PAIRS_B } from "./pairs/b";
import { PAIRS_C } from "./pairs/c";
import { PAIRS_D } from "./pairs/d";
import { PAIRS_E } from "./pairs/e";
import { PAIRS_F } from "./pairs/f";
import { PAIRS_G } from "./pairs/g";
import { PAIRS_H } from "./pairs/h";
import { PAIRS_I } from "./pairs/i";
import { PAIRS_J } from "./pairs/j";
import { PAIRS_K } from "./pairs/k";
import { PAIRS_L } from "./pairs/l";
import { PAIRS_M } from "./pairs/m";
import { PAIRS_N } from "./pairs/n";
import { PAIRS_O } from "./pairs/o";
import { PAIRS_P } from "./pairs/p";
import { PAIRS_Q } from "./pairs/q";
import { PAIRS_R } from "./pairs/r";
import { PAIRS_S } from "./pairs/s";
import { PAIRS_T } from "./pairs/t";
import { PAIRS_U } from "./pairs/u";
import { PAIRS_V } from "./pairs/v";
import { PAIRS_W } from "./pairs/w";
import { PAIRS_X } from "./pairs/x";
import { PAIRS_Y } from "./pairs/y";
import { PAIRS_Z } from "./pairs/z";

const TABLES: Record<Letter, Record<string, string>> = {
  A: PAIRS_A,
  B: PAIRS_B,
  C: PAIRS_C,
  D: PAIRS_D,
  E: PAIRS_E,
  F: PAIRS_F,
  G: PAIRS_G,
  H: PAIRS_H,
  I: PAIRS_I,
  J: PAIRS_J,
  K: PAIRS_K,
  L: PAIRS_L,
  M: PAIRS_M,
  N: PAIRS_N,
  O: PAIRS_O,
  P: PAIRS_P,
  Q: PAIRS_Q,
  R: PAIRS_R,
  S: PAIRS_S,
  T: PAIRS_T,
  U: PAIRS_U,
  V: PAIRS_V,
  W: PAIRS_W,
  X: PAIRS_X,
  Y: PAIRS_Y,
  Z: PAIRS_Z,
};

export function pairLine(from: Letter, to: Letter): string | undefined {
  if (from === to) return undefined;
  return TABLES[from]?.[to];
}

export function pairEntries(): { from: Letter; to: Letter; line: string }[] {
  const out: { from: Letter; to: Letter; line: string }[] = [];
  for (const from of ALPHABET) {
    for (const to of ALPHABET) {
      if (from === to) continue;
      const line = TABLES[from]?.[to];
      if (line) out.push({ from, to, line });
    }
  }
  return out;
}
