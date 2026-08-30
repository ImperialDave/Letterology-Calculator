import { grid, armTeeth, type Grid } from "./levels-story";

function paint(W: number, H: number, fy: number, fn: (g: Grid, fy: number) => void) {
  const g = grid(W, H, fy) as Grid;
  fn(g, fy);
  return armTeeth(g, fy);
}

function terrace(g: Grid, fy: number, x: number) {
  g.fill(x, fy - 2, 3, "=");
  g.fill(x + 4, fy - 4, 3, "=");
  g.fill(x + 8, fy - 2, 3, "=");
}

function perch(g: Grid, fy: number, x: number, deco: string) {
  g.fill(x, fy - 3, 4, "=");
  g.put(x + 1, fy - 4, deco);
}

/** VI — Foundry Margin. Terrace + crumble + bounce. Compact packs. */
export function buildFoundry(): string[] {
  return paint(140, 14, 9, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "'");
    put(10, fy - 1, "1");
    fill(12, fy - 3, 3, "#");
    fill(12, fy - 2, 1, "#");
    fill(14, fy - 2, 1, "#");
    put(13, fy - 1, "1");
    fill(18, fy, 3, ".");
    put(19, fy - 1, "T");
    terrace(g, fy, 24);
    put(26, fy - 3, "4");
    put(29, fy - 5, "4");
    put(32, fy - 3, "'");
    put(38, fy - 1, "4");
    put(40, fy - 1, "1");
    fill(44, fy, 5, "-");
    fill(50, fy, 3, ".");
    put(51, fy - 1, "T");
    put(56, fy - 1, "%");
    put(58, fy - 1, "i");
    put(60, fy - 2, "'");
    put(64, fy - 1, "4");
    put(66, fy - 1, "4");
    put(68, fy - 1, "1");
    perch(g, fy, 72, "'");
    put(74, fy - 4, "4");
    fill(80, fy, 4, "-");
    put(86, fy - 1, "4");
    put(90, fy - 1, "%");
    put(92, fy - 1, "h");
    terrace(g, fy, 96);
    put(98, fy - 3, "4");
    put(101, fy - 5, "$");
    put(110, fy - 1, "4");
    put(114, fy - 1, "2");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** VII — Keystroke Yard. Colonnade grate + rafter flyers. */
export function buildKeystroke(): string[] {
  return paint(148, 14, 9, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "'");
    put(10, fy - 1, "1");
    fill(14, 3, 4, "=");
    put(15, 2, "0");
    put(17, 2, "7");
    put(20, fy - 1, "4");
    put(22, fy - 1, "^^");
    perch(g, fy, 26, "'");
    put(32, fy - 1, "2");
    fill(36, fy - 4, 8, "#");
    fill(36, fy - 3, 8, "#");
    put(36, fy - 2, "#");
    put(43, fy - 2, "#");
    put(39, fy - 1, "k");
    put(41, fy - 1, "i");
    put(48, fy - 1, "4");
    put(50, fy - 1, "4");
    put(52, fy - 1, "4");
    put(54, fy - 2, "'");
    fill(58, fy, 4, "-");
    put(64, fy - 1, "4");
    put(68, fy - 1, "%");
    put(70, fy - 1, "i");
    fill(74, 3, 3, "=");
    put(75, 2, "0");
    put(80, fy - 1, "7");
    put(84, fy - 1, "4");
    terrace(g, fy, 88);
    put(90, fy - 3, "4");
    put(102, fy - 1, "%");
    put(104, fy - 1, "h");
    perch(g, fy, 108, "$");
    put(118, fy - 1, "4");
    put(122, fy - 1, "2");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** VIII — Fourfold Keep. Plus-shaped splitway. Tetrarch. */
export function buildFourfold(): string[] {
  return paint(168, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "'");
    put(10, fy - 1, "4");
    put(12, fy - 1, "1");
    fill(16, fy, 3, ".");
    put(17, fy - 1, "T");
    put(22, fy - 1, "4");
    perch(g, fy, 26, "'");
    put(34, fy - 1, "%");
    put(36, fy - 1, "i");
    fill(40, fy, 4, "-");
    put(46, fy - 1, "4");
    put(50, fy - 1, "4");
    // plus crossing: left arm, high arm, right arm, floor stem
    fill(56, fy - 3, 6, "=");
    put(58, fy - 4, "4");
    fill(68, fy - 5, 10, "=");
    put(70, fy - 6, "'");
    put(72, fy - 6, "4");
    put(76, fy - 6, "4");
    fill(84, fy - 3, 6, "=");
    put(86, fy - 4, "4");
    put(72, fy - 1, "!");
    put(64, fy - 1, "4");
    put(80, fy - 1, "4");
    put(96, fy - 1, "%");
    put(98, fy - 1, "h");
    put(100, fy - 1, "i");
    terrace(g, fy, 106);
    put(108, fy - 3, "4");
    put(111, fy - 5, "$");
    put(122, fy - 1, "4");
    put(128, fy - 1, "1");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** IX — Ligature Canal. Two sluice zippers, 8-packs, climbable &. */
export function buildLigature(): string[] {
  return paint(152, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    const gap = (x: number, n: number) => {
      fill(x, fy, n, "~");
      fill(x, fy + 1, n, "~");
    };
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ",");
    put(10, fy - 1, "8");
    put(12, fy - 1, "8");
    put(14, fy - 1, "1");
    perch(g, fy, 18, ",");
    gap(26, 7);
    fill(28, fy - 2, 4, "=");
    put(38, fy - 1, "3");
    put(42, fy - 1, "%");
    put(44, fy - 1, "i");
    put(48, fy - 1, "8");
    put(50, fy - 1, "8");
    put(52, fy - 1, "8");
    fill(56, fy, 4, "-");
    gap(62, 8);
    fill(64, fy - 3, 5, "=");
    put(66, fy - 4, ",");
    put(76, fy - 1, "6");
    put(80, fy - 1, "8");
    fill(84, fy - 2, 5, "=");
    put(86, fy - 3, "Z");
    put(92, fy - 1, "8");
    put(94, fy - 1, "2");
    put(98, fy - 1, "%");
    put(100, fy - 1, "h");
    put(104, fy - 1, "&");
    put(106, fy - 2, "&");
    put(108, fy - 1, "&");
    fill(106, fy - 3, 4, "=");
    put(108, fy - 4, ",");
    gap(114, 7);
    fill(116, fy - 2, 4, "=");
    put(128, fy - 1, "8");
    put(130, fy - 1, "8");
    perch(g, fy, 134, "$");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** X — Ampersand Dock. 8-cage, Pin porch, FOLD terrace. */
export function buildAmpersand(): string[] {
  return paint(148, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    const gap = (x: number, n: number) => {
      fill(x, fy, n, "~");
      fill(x, fy + 1, n, "~");
    };
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ",");
    put(10, fy - 1, "8");
    put(12, fy - 1, "8");
    terrace(g, fy, 16);
    put(18, fy - 3, "n");
    put(20, fy - 3, "i");
    put(22, fy - 5, "8");
    put(28, fy - 1, "8");
    put(30, fy - 1, "8");
    put(32, fy - 1, "8");
    put(36, fy - 1, "%");
    put(38, fy - 1, "i");
    gap(42, 6);
    fill(44, fy - 2, 4, "=");
    fill(54, fy, 5, "/");
    put(56, fy - 1, "8");
    put(58, fy - 1, "2");
    fill(64, fy, 3, "-");
    put(70, fy - 1, "8");
    terrace(g, fy, 74);
    put(76, fy - 3, "O");
    put(78, fy - 3, ";");
    put(90, fy - 1, "%");
    put(92, fy - 1, "h");
    put(96, fy - 1, "8");
    put(98, fy - 1, "8");
    gap(102, 7);
    fill(104, fy - 2, 4, "=");
    perch(g, fy, 116, "$");
    put(128, fy - 1, "8");
    put(132, fy - 1, "1");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** XI — Iris Bind. Laser colonnade + iris bowl. */
export function buildIrisBind(): string[] {
  return paint(156, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    put(10, fy - 1, "1");
    put(14, fy - 1, "B");
    put(18, fy - 3, "|");
    put(18, fy - 4, "|");
    fill(20, fy - 3, 4, "=");
    put(22, fy - 4, ";");
    put(28, fy - 1, "2");
    put(32, fy - 1, "%");
    put(34, fy - 1, "i");
    put(38, fy - 3, "|");
    put(38, fy - 4, "|");
    put(38, fy - 5, "|");
    fill(40, fy - 3, 5, "=");
    put(48, fy - 1, "B");
    put(50, fy - 1, "0");
    perch(g, fy, 54, ";");
    put(64, fy - 1, "5");
    put(68, fy - 1, "%");
    put(70, fy - 1, "h");
    fill(74, fy - 3, 6, "=");
    put(76, fy - 4, ";");
    put(82, fy - 3, "|");
    put(82, fy - 4, "|");
    fill(86, fy - 2, 5, "=");
    put(92, fy - 1, "!");
    fill(98, fy - 3, 5, "=");
    put(108, fy - 1, "B");
    put(112, fy - 1, "0");
    put(116, fy - 1, "%");
    put(118, fy - 1, "i");
    perch(g, fy, 122, "$");
    put(134, fy - 3, "|");
    put(134, fy - 4, "|");
    put(140, fy - 1, "2");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  });
}

/** XII — Scriptorium. Cascade desks. Bounce or Compose. */
export function buildScriptorium(): string[] {
  return paint(144, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    put(10, fy - 1, "1");
    fill(14, fy, 3, ".");
    put(15, fy - 1, "T");
    fill(20, fy - 2, 4, "=");
    put(22, fy - 3, "t");
    put(24, fy - 3, "i");
    fill(20, fy - 4, 3, "=");
    put(21, fy - 5, "?");
    put(28, fy - 1, "2");
    fill(32, fy, 3, ".");
    put(33, fy - 1, "T");
    put(38, fy - 1, "3");
    put(42, fy - 1, "%");
    put(44, fy - 1, "i");
    fill(48, fy - 2, 5, "=");
    fill(50, fy - 4, 3, "=");
    put(52, fy - 5, "?");
    put(58, fy - 1, "1");
    fill(62, fy, 3, ".");
    put(63, fy - 1, "T");
    put(70, fy - 1, "5");
    put(72, fy - 1, "2");
    put(76, fy - 1, "%");
    put(78, fy - 1, "h");
    fill(82, fy - 4, 4, "=");
    put(84, fy - 5, "$");
    fill(90, fy, 3, ".");
    put(91, fy - 1, "T");
    put(98, fy - 1, "1");
    put(100, fy - 1, "0");
    fill(104, fy - 2, 5, "=");
    put(106, fy - 3, "i");
    put(114, fy - 1, "3");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** XIII — Rule and Storm. Four compact clauses. */
export function buildRuleStorm(): string[] {
  return paint(156, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(10, fy - 4, 2, "v");
    fill(10, fy - 3, 2, "v");
    fill(10, fy - 2, 2, "v");
    fill(10, fy - 1, 2, "v");
    put(14, fy - 1, "1");
    put(18, fy - 1, "4");
    put(20, fy - 1, "4");
    put(22, fy - 1, "4");
    put(26, fy - 1, "%");
    put(28, fy - 1, "i");
    fill(32, fy, 6, "/");
    put(34, fy - 1, "8");
    put(36, fy - 1, "8");
    put(40, fy - 1, "2");
    perch(g, fy, 44, ";");
    fill(54, fy, 3, ".");
    put(55, fy - 1, "T");
    put(62, fy - 1, "1");
    put(66, fy - 1, "%");
    put(68, fy - 1, "h");
    put(72, fy - 1, "4");
    put(74, fy - 1, "8");
    put(76, fy - 1, "5");
    terrace(g, fy, 80);
    fill(94, fy - 4, 2, "v");
    fill(94, fy - 3, 2, "v");
    fill(94, fy - 2, 2, "v");
    put(100, fy - 1, "4");
    put(102, fy - 1, "2");
    put(106, fy - 1, "%");
    put(108, fy - 1, "i");
    fill(112, fy, 5, "/");
    put(114, fy - 1, "8");
    perch(g, fy, 122, "$");
    fill(132, fy, 3, ".");
    put(133, fy - 1, "T");
    put(140, fy - 1, "1");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  });
}

/** XIV — Operator Approach. Switchback: TIDE low, secret high. */
export function buildApproach(): string[] {
  return paint(148, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    put(10, fy - 1, "1");
    fill(14, fy, 3, ".");
    put(14, fy - 1, "`");
    put(15, fy - 1, "`");
    fill(20, fy - 2, 5, "=");
    put(22, fy - 3, "I");
    put(24, fy - 3, "?");
    put(30, fy - 1, "2");
    fill(34, fy, 1, "g");
    perch(g, fy, 38, "?");
    put(48, fy - 1, "%");
    put(50, fy - 1, "i");
    fill(54, fy, 3, ".");
    put(55, fy - 1, ")");
    put(56, fy - 1, ")");
    fill(60, fy - 3, 5, "=");
    put(62, fy - 4, "?");
    put(70, fy - 1, "5");
    put(72, fy - 1, "2");
    fill(76, fy - 4, 2, "v");
    fill(76, fy - 3, 2, "v");
    fill(76, fy - 2, 2, "v");
    put(78, fy - 5, "$");
    put(84, fy - 1, "1");
    put(88, fy - 1, "%");
    put(90, fy - 1, "h");
    fill(94, fy - 2, 5, "=");
    put(96, fy - 3, "7");
    put(104, fy - 1, "0");
    fill(108, fy, 3, ".");
    put(108, fy - 1, "`");
    put(109, fy - 1, "`");
    terrace(g, fy, 114);
    put(128, fy - 1, "3");
    put(132, fy - 1, "1");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  });
}

/** XV — The Iconostasis. Short nave, loft packs, Archivant. */
export function buildIconostasis(): string[] {
  return paint(132, 15, 10, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    put(10, fy - 1, "1");
    put(14, fy - 1, "Q");
    terrace(g, fy, 18);
    put(20, fy - 3, "?");
    put(28, fy - 1, "%");
    put(30, fy - 1, "h");
    put(32, fy - 1, "i");
    fill(36, fy - 2, 6, "=");
    fill(48, fy - 4, 8, "=");
    put(50, fy - 5, "?");
    put(52, fy - 5, "Q");
    fill(62, fy - 2, 6, "=");
    put(54, fy - 1, "!");
    put(44, fy - 1, "Q");
    put(64, fy - 1, "U");
    put(76, fy - 1, "%");
    put(78, fy - 1, "i");
    perch(g, fy, 82, "$");
    put(94, fy - 1, "Q");
    put(98, fy - 1, "2");
    terrace(g, fy, 102);
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  });
}
