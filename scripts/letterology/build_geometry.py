#!/usr/bin/env python3
"""Build the 26-house geometry tables from the live ally/enemy graph.

Reads src/lib/letterology/circle.ts so the tables cannot drift from the
doctrine. Writes a generated TypeScript module the site engines import.

Algorithms (all in numpy — no extra deps):
  • Floyd–Warshall shortest paths on the ally graph
  • Signed enemy overlay (direct opposition)
  • Combinatorial Laplacian + spectral embedding (Fiedler and friends)
  • Laplacian pseudoinverse → resistance (commute-time) distance
  • Eigenvector centrality on the ally adjacency
  • Brandes-style betweenness via predecessor reconstruction
  • Sinkhorn entropic optimal transport (used later at runtime)
  • A resonance score that is continuous, not four buckets

Re-run:  python3 scripts/letterology/build_geometry.py
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CIRCLE_TS = ROOT / "src/lib/letterology/circle.ts"
OUT_TS = ROOT / "src/lib/letterology/generated/geometry-tables.ts"
OUT_REPORT = ROOT / "src/lib/letterology/generated/geometry-report.json"

ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
N = 26
IDX = {ch: i for i, ch in enumerate(ALPHA)}


def parse_triples(name: str, source: str) -> dict[str, list[str]]:
    block = re.search(
        rf"const {name}: Record<Letter, \[Letter, Letter, Letter\]> = \{{(.*?)\n\}};",
        source,
        re.S,
    )
    if not block:
        raise SystemExit(f"could not find {name} in circle.ts")
    found = re.findall(r'([A-Z]): \["([A-Z])", "([A-Z])", "([A-Z])"\]', block.group(1))
    if len(found) != 26:
        raise SystemExit(f"{name}: expected 26 houses, got {len(found)}")
    return {row[0]: [row[1], row[2], row[3]] for row in found}


def floyd(adj: np.ndarray) -> np.ndarray:
    dist = adj.astype(np.float64).copy()
    dist[dist == 0] = np.inf
    np.fill_diagonal(dist, 0.0)
    for k in range(N):
        dist = np.minimum(dist, dist[:, k][:, None] + dist[k, :][None, :])
    if not np.isfinite(dist).all():
        raise SystemExit("ally graph is disconnected — Floyd left infinities")
    return dist


def eigenvector_centrality(adj: np.ndarray) -> np.ndarray:
    vals, vecs = np.linalg.eig(adj.astype(np.float64))
    k = int(np.argmax(vals.real))
    v = np.abs(vecs[:, k].real)
    s = v.sum()
    return v / s if s else v


def laplacian(adj: np.ndarray) -> np.ndarray:
    deg = np.diag(adj.sum(axis=1))
    return deg - adj


def spectral_embedding(adj: np.ndarray, dim: int = 4) -> np.ndarray:
    L = laplacian(adj)
    vals, vecs = np.linalg.eigh(L)
    # skip the trivial 0-eigenvalue
    emb = vecs[:, 1 : 1 + dim]
    norms = np.linalg.norm(emb, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return emb / norms


def cosine_matrix(emb: np.ndarray) -> np.ndarray:
    return np.clip(emb @ emb.T, -1.0, 1.0)


def resistance_distance(adj: np.ndarray) -> np.ndarray:
    L = laplacian(adj)
    pinv = np.linalg.pinv(L)
    diag = np.diag(pinv)
    return diag[:, None] + diag[None, :] - 2.0 * pinv


def betweenness(dist: np.ndarray, adj: np.ndarray) -> np.ndarray:
    """Unweighted betweenness via counting shortest paths (Brandes-lite)."""
    score = np.zeros(N)
    neighbors = [[j for j in range(N) if adj[i, j] == 1] for i in range(N)]
    for s in range(N):
        stack: list[int] = []
        pred: list[list[int]] = [[] for _ in range(N)]
        sigma = np.zeros(N)
        sigma[s] = 1.0
        dist_s = np.full(N, -1)
        dist_s[s] = 0
        queue = [s]
        while queue:
            v = queue.pop(0)
            stack.append(v)
            for w in neighbors[v]:
                if dist_s[w] < 0:
                    dist_s[w] = dist_s[v] + 1
                    queue.append(w)
                if dist_s[w] == dist_s[v] + 1:
                    sigma[w] += sigma[v]
                    pred[w].append(v)
        delta = np.zeros(N)
        while stack:
            w = stack.pop()
            for v in pred[w]:
                if sigma[w]:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
            if w != s:
                score[w] += delta[w]
    s = score.sum()
    return score / s if s else score


def resonance(hop: np.ndarray, spec: np.ndarray, resist: np.ndarray, enemy: np.ndarray) -> np.ndarray:
    """Continuous 0–100 kinship. Official allies stay high; enemies are pulled down."""
    hop_term = 1.0 / (1.0 + 0.16 * np.power(hop, 1.45))
    spec_term = (spec + 1.0) / 2.0
    rmax = float(resist.max()) or 1.0
    resist_term = 1.0 - resist / rmax
    raw = 100.0 * (0.62 * hop_term + 0.24 * spec_term + 0.14 * resist_term)
    # Official allies stay in the high band, but spectrum still separates them.
    ally = (hop == 1) & (enemy == 0)
    raw = np.where(ally, 84.0 + 14.0 * spec_term, raw)
    raw = np.where(enemy > 0, 12.0 + 28.0 * spec_term + 8.0 * resist_term, raw)
    np.fill_diagonal(raw, 100.0)
    return np.clip(np.rint(raw), 0, 100).astype(int)


def sinkhorn_cost(p: np.ndarray, q: np.ndarray, cost: np.ndarray, eps: float = 0.12, iters: int = 60) -> float:
    p = p / (p.sum() + 1e-12)
    q = q / (q.sum() + 1e-12)
    K = np.exp(-cost / max(eps, 1e-6))
    u = np.ones(N)
    v = np.ones(N)
    for _ in range(iters):
        u = p / (K @ v + 1e-12)
        v = q / (K.T @ u + 1e-12)
    P = u[:, None] * K * v[None, :]
    return float((P * cost).sum())


def circular_w1(p: np.ndarray, q: np.ndarray) -> float:
    d = p / (p.sum() + 1e-12) - q / (q.sum() + 1e-12)
    cdf = np.cumsum(d)
    return float(np.mean(np.abs(cdf - np.median(cdf))))


def js_similarity(p: np.ndarray, q: np.ndarray) -> float:
    p = p / (p.sum() + 1e-12)
    q = q / (q.sum() + 1e-12)
    m = 0.5 * (p + q)

    def kl(a: np.ndarray, b: np.ndarray) -> float:
        mask = a > 0
        return float(np.sum(a[mask] * np.log((a[mask] + 1e-12) / (b[mask] + 1e-12))))

    js = 0.5 * kl(p, m) + 0.5 * kl(q, m)
    # JS is in [0, ln 2]
    return float(1.0 - js / math.log(2.0))


def matrix_literal(mat: np.ndarray, indent: int = 2) -> str:
    pad = " " * indent
    rows = []
    for row in mat:
        inner = ", ".join(str(int(x)) if float(x).is_integer() else f"{float(x):.6g}" for x in row)
        rows.append(f"{pad}[{inner}]")
    return "[\n" + ",\n".join(rows) + "\n]"


def vec_literal(vec: np.ndarray) -> str:
    inner = ", ".join(f"{float(x):.8g}" for x in vec)
    return f"[{inner}]"


def main() -> None:
    source = CIRCLE_TS.read_text()
    allies = parse_triples("ALLIES", source)
    enemies = parse_triples("ENEMIES", source)

    adj = np.zeros((N, N), dtype=np.int32)
    enemy = np.zeros((N, N), dtype=np.int32)
    for a, others in allies.items():
        i = IDX[a]
        for b in others:
            j = IDX[b]
            adj[i, j] = 1
            adj[j, i] = 1
    for a, others in enemies.items():
        i = IDX[a]
        for b in others:
            j = IDX[b]
            enemy[i, j] = 1
            enemy[j, i] = 1

    # sanity: 3-regular, undirected, no ally/enemy overlap
    degrees = adj.sum(axis=1)
    if not np.all(degrees == 3):
        raise SystemExit(f"ally graph is not 3-regular: {degrees.tolist()}")
    if np.any((adj > 0) & (enemy > 0)):
        raise SystemExit("a pair is both ally and enemy")

    hop = floyd(adj)
    spec = cosine_matrix(spectral_embedding(adj, dim=4))
    resist = resistance_distance(adj)
    central = eigenvector_centrality(adj)
    between = betweenness(hop, adj)
    closeness = (N - 1) / np.maximum(hop.sum(axis=1), 1.0)
    closeness = closeness / closeness.sum()
    reso = resonance(hop, spec, resist, enemy)

    # uniqueness vs the old 4-bucket score
    buckets = np.full((N, N), 44, dtype=int)
    np.fill_diagonal(buckets, 78)
    buckets[adj == 1] = 92
    buckets[enemy == 1] = 26
    old_unique = len(set(buckets[np.triu_indices(N, 1)].tolist()))
    new_unique = len(set(reso[np.triu_indices(N, 1)].tolist()))

    # sample name masses: LOVELACE vs OCTAVIA, ADA vs BELLA
    def mass(name: str) -> np.ndarray:
        v = np.zeros(N)
        for ch in name.upper():
            if ch in IDX:
                v[IDX[ch]] += 1.0
        return v

    samples = {
        "lovelace×octavia": (mass("LOVELACE"), mass("OCTAVIA")),
        "ada×bella": (mass("ADA"), mass("BELLA")),
        "zora×baldwin": (mass("ZORA"), mass("BALDWIN")),
        "lovelace×lovelace": (mass("LOVELACE"), mass("LOVELACE")),
    }
    sample_out = {}
    hop_cost = hop / (hop.max() or 1.0)
    for key, (p, q) in samples.items():
        left, right = key.split("×")
        sample_out[key] = {
            "circularW1": round(circular_w1(p, q), 5),
            "js": round(js_similarity(p, q), 5),
            "sinkhorn": round(sinkhorn_cost(p, q, hop_cost), 5),
            "houseResonance": int(reso[IDX[left[0].upper()], IDX[right[0].upper()]]),
        }

    report = {
        "houses": N,
        "allyEdges": int(adj.sum() // 2),
        "enemyEdges": int(enemy.sum() // 2),
        "diameter": int(hop.max()),
        "meanHop": float(hop[np.triu_indices(N, 1)].mean()),
        "oldBucketDistinct": old_unique,
        "resonanceDistinct": new_unique,
        "centrality": {ALPHA[i]: round(float(central[i]), 5) for i in range(N)},
        "closeness": {ALPHA[i]: round(float(closeness[i]), 5) for i in range(N)},
        "betweenness": {ALPHA[i]: round(float(between[i]), 5) for i in range(N)},
        "samples": sample_out,
        "note": "Resonance is continuous. Old kind-score had 4 values; this table has far more.",
    }
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(json.dumps(report, indent=2) + "\n")

    # millicosine so TS stays integer-clean
    spec_i = np.clip(np.rint(spec * 1000), -1000, 1000).astype(int)
    resist_i = np.clip(np.rint(resist * 1000), 0, 100000).astype(int)
    hop_i = np.rint(hop).astype(int)

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        f"""/* Generated by scripts/letterology/build_geometry.py — do not edit. */
export const GEO_ALPHA = "{ALPHA}";

/** Ally-graph hop distance. 0 on the diagonal, 1 for an official ally. */
export const HOP: number[][] = {matrix_literal(hop_i)};

/** Continuous 0–100 resonance (hop + spectrum + resistance, enemies pulled down). */
export const RESONANCE: number[][] = {matrix_literal(reso)};

/** Spectral cosine × 1000 from the Laplacian embedding. */
export const SPECTRAL_MILLI: number[][] = {matrix_literal(spec_i)};

/** Resistance / commute-time distance × 1000. */
export const RESIST_MILLI: number[][] = {matrix_literal(resist_i)};

/** Eigenvector centrality on the ally graph (flat if the graph is regular). */
export const CENTRALITY: number[] = {vec_literal(central)};

/** Closeness centrality (normalized). */
export const CLOSENESS: number[] = {vec_literal(closeness)};

/** Betweenness (normalized) on the ally graph. */
export const BETWEENNESS: number[] = {vec_literal(between)};
"""
    )

    print(json.dumps({
        "wrote": str(OUT_TS.relative_to(ROOT)),
        "report": str(OUT_REPORT.relative_to(ROOT)),
        "diameter": report["diameter"],
        "oldBucketDistinct": old_unique,
        "resonanceDistinct": new_unique,
        "samples": sample_out,
    }, indent=2))


if __name__ == "__main__":
    main()
