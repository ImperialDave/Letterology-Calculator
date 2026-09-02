import * as THREE from "three";
import { PAINTS, fillTex, paintBrass, paintCloud, paintGrass, paintHull, paintIce, paintInkWater, paintLead, paintRust, paintScale, paintSlagWater, type Plot } from "./tex-paint";

export const INK = 0x5ee0c0;
export const BRASS = 0xe8d48a;
export const RUST = 0xd45a4a;
export const LEAD = 0x3a4248;
export const PAPER = 0xc9b896;
export const FOG = 0x6a9080;
export const OLIVE = 0x3d5a40;

const cache = new Map<string, THREE.Texture>();

export function n64Mat(color: number, opts?: { map?: THREE.Texture; emissive?: number; glow?: number }) {
  return new THREE.MeshLambertMaterial({
    color,
    map: opts?.map,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.glow ?? (opts?.emissive ? 0.55 : 0),
    flatShading: true,
  });
}

function fromPaint(name: string, paint: (plot: Plot, n: number) => void, n = 64) {
  const hit = cache.get(name);
  if (hit) return hit;
  const buf = Uint8Array.from(fillTex(n, paint));
  const tex = new THREE.DataTexture(buf, n, n, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.needsUpdate = true;
  cache.set(name, tex);
  if (typeof THREE.TextureLoader !== "undefined") {
    new THREE.TextureLoader().load(
      `/glyphbound/sortie/tex/${name}.png`,
      (loaded) => {
        loaded.magFilter = THREE.NearestFilter;
        loaded.minFilter = THREE.NearestFilter;
        loaded.wrapS = THREE.RepeatWrapping;
        loaded.wrapT = THREE.RepeatWrapping;
        loaded.colorSpace = THREE.SRGBColorSpace;
        tex.image = loaded.image;
        tex.needsUpdate = true;
      },
      undefined,
      () => {},
    );
  }
  return tex;
}

export function tileTex(paint: (plot: Plot, n: number) => void, n = 64) {
  return fromPaint("anon-" + paint.name, paint, n);
}

export const inkWaterTex = () => fromPaint("water-ink", paintInkWater);
export const iceWaterTex = () => fromPaint("water-ice", PAINTS["water-ice"]);
export const slagWaterTex = () => fromPaint("water-slag", paintSlagWater);
export const leadTex = () => fromPaint("ground-lead", paintLead);
export const brassTex = () => fromPaint("metal-brass", paintBrass);
export const rustTex = () => fromPaint("metal-rust", paintRust);
export const grassLeadTex = () => fromPaint("ground-grass", paintGrass);
export const iceGroundTex = () => fromPaint("ground-ice", paintIce);
export const ashTex = () => fromPaint("ground-ash", PAINTS["ground-ash"]);
export const scaleOliveTex = () => fromPaint("scale-olive", paintScale);
export const cloudTex = () => fromPaint("cloud-paper", paintCloud);
export const hullTex = () => fromPaint("ship-hull", paintHull);
