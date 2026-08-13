import {
  BETWEENNESS,
  CLOSENESS,
  GEO_ALPHA,
  HOP,
  RESIST_MILLI,
  RESONANCE,
  SPECTRAL_MILLI,
} from "./generated/geometry-tables";
import type { Horoscope, Letter } from "./types";

const N = 26;

export function letterIndex(letter: Letter): number {
  const index = GEO_ALPHA.indexOf(letter);
  return index >= 0 ? index : 0;
}

export function hopDistance(a: Letter, b: Letter): number {
  return HOP[letterIndex(a)][letterIndex(b)] ?? 0;
}

/** Continuous 0–100 kinship on the ally graph. Not four buckets. */
export function resonanceOf(a: Letter, b: Letter): number {
  return RESONANCE[letterIndex(a)][letterIndex(b)] ?? 0;
}

export function spectralCosine(a: Letter, b: Letter): number {
  return (SPECTRAL_MILLI[letterIndex(a)][letterIndex(b)] ?? 0) / 1000;
}

export function resistanceOf(a: Letter, b: Letter): number {
  return (RESIST_MILLI[letterIndex(a)][letterIndex(b)] ?? 0) / 1000;
}

export function closenessOf(letter: Letter): number {
  return CLOSENESS[letterIndex(letter)] ?? 0;
}

export function betweennessOf(letter: Letter): number {
  return BETWEENNESS[letterIndex(letter)] ?? 0;
}

export function massOf(h: Horoscope): number[] {
  const mass = Array.from({ length: N }, () => 0);
  for (const item of h.inventory) {
    mass[letterIndex(item.letter)] += item.weight;
  }
  return mass;
}

function normalize(mass: number[]): number[] {
  const sum = mass.reduce((n, x) => n + x, 0) || 1;
  return mass.map((x) => x / sum);
}

/** Circular Wasserstein-1 on the A–Z wheel. 0 = identical. */
export function circularW1(pRaw: number[], qRaw: number[]): number {
  const p = normalize(pRaw);
  const q = normalize(qRaw);
  const cdf: number[] = [];
  let run = 0;
  for (let i = 0; i < N; i += 1) {
    run += p[i] - q[i];
    cdf.push(run);
  }
  const sorted = [...cdf].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)] ?? 0;
  let acc = 0;
  for (const value of cdf) acc += Math.abs(value - mid);
  return acc / N;
}

/** Jensen–Shannon similarity in 0–1 (1 = identical). */
export function jsSimilarity(pRaw: number[], qRaw: number[]): number {
  const p = normalize(pRaw);
  const q = normalize(qRaw);
  let js = 0;
  for (let i = 0; i < N; i += 1) {
    const m = 0.5 * (p[i] + q[i]);
    if (p[i] > 0 && m > 0) js += 0.5 * p[i] * Math.log(p[i] / m);
    if (q[i] > 0 && m > 0) js += 0.5 * q[i] * Math.log(q[i] / m);
  }
  return Math.max(0, Math.min(1, 1 - js / Math.LN2));
}

/** Entropic OT cost using ally-graph hops as ground distance. */
export function sinkhornCost(pRaw: number[], qRaw: number[], eps = 0.12, iters = 50): number {
  const p = normalize(pRaw);
  const q = normalize(qRaw);
  const maxHop = 6;
  const K: number[][] = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (__, j) => Math.exp(-(HOP[i][j] / maxHop) / eps)),
  );
  let u = Array.from({ length: N }, () => 1);
  let v = Array.from({ length: N }, () => 1);
  for (let t = 0; t < iters; t += 1) {
    const nextU = p.map((pi, i) => {
      let s = 0;
      for (let j = 0; j < N; j += 1) s += K[i][j] * v[j];
      return pi / (s + 1e-12);
    });
    const nextV = q.map((qj, j) => {
      let s = 0;
      for (let i = 0; i < N; i += 1) s += K[i][j] * nextU[i];
      return qj / (s + 1e-12);
    });
    u = nextU;
    v = nextV;
  }
  let cost = 0;
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const pij = u[i] * K[i][j] * v[j];
      cost += pij * (HOP[i][j] / maxHop);
    }
  }
  return cost;
}

export interface PairGeometry {
  hops: { house: number; manner: number; field: number };
  resonance: { house: number; manner: number; field: number };
  transport: number;
  overlapJS: number;
  circleFit: number;
  meanHop: number;
}

export function pairGeometry(
  a: Horoscope,
  b: Horoscope,
): PairGeometry {
  const [aH, aM, aF] = a.triad;
  const [bH, bM, bF] = b.triad;
  const massA = massOf(a);
  const massB = massOf(b);
  const hops = {
    house: hopDistance(aH, bH),
    manner: hopDistance(aM, bM),
    field: hopDistance(aF, bF),
  };
  const resonance = {
    house: resonanceOf(aH, bH),
    manner: resonanceOf(aM, bM),
    field: resonanceOf(aF, bF),
  };
  const transport = Math.round(100 * (1 - Math.min(1, sinkhornCost(massA, massB))));
  const overlapJS = Math.round(100 * jsSimilarity(massA, massB));
  const circleFit = Math.round(100 * (1 - Math.min(1, circularW1(massA, massB) * 4)));
  const meanHop = (hops.house + hops.manner + hops.field) / 3;
  return { hops, resonance, transport, overlapJS, circleFit, meanHop };
}

export function hopPhrase(hops: number): string {
  if (hops <= 0) return "the same seat";
  if (hops === 1) return "one hop — an official ally";
  if (hops === 2) return "two hops on the ally graph";
  if (hops === 3) return "three hops — a short walk";
  if (hops === 4) return "four hops — a long walk";
  return `${hops} hops — the far side of the wheel`;
}
