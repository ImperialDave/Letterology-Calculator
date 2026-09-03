import * as THREE from "three";
import { PAINTS, fillTex, paintBrass, paintCloud, paintGrass, paintHull, paintIce, paintInkWater, paintLead, paintRock, paintRust, paintScale, paintSlagWater, type Plot } from "./tex-paint";

export const INK = 0x5ee0c0;
export const BRASS = 0xffe08a;
export const RUST = 0xff8060;
export const LEAD = 0xb8c8d4;
export const PAPER = 0xf0e4c4;
export const FOG = 0xb8e8f0;
export const OLIVE = 0x6edc58;

const cache = new Map<string, THREE.Texture>();

export function n64Mat(color: number, opts?: { map?: THREE.Texture; emissive?: number; glow?: number; vertexColors?: boolean }) {
  return new THREE.MeshLambertMaterial({
    color: opts?.map || opts?.vertexColors ? 0xffffff : color,
    map: opts?.map,
    vertexColors: opts?.vertexColors ?? false,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.glow ?? (opts?.emissive ? 0.55 : 0),
    flatShading: true,
  });
}

function makeTex(name: string, buf: Uint8ClampedArray, n: number) {
  let tex: THREE.Texture;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(new ImageData(buf, n, n), 0, 0);
      tex = new THREE.CanvasTexture(canvas);
    } else {
      tex = new THREE.DataTexture(Uint8Array.from(buf), n, n, THREE.RGBAFormat);
    }
  } else {
    tex = new THREE.DataTexture(Uint8Array.from(buf), n, n, THREE.RGBAFormat);
  }
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.needsUpdate = true;
  tex.name = name;
  return tex;
}

function fromPaint(name: string, paint: (plot: Plot, n: number) => void, n = 64) {
  const hit = cache.get(name);
  if (hit) return hit;
  const tex = makeTex(name, fillTex(n, paint), n);
  cache.set(name, tex);
  return tex;
}

export function tileTex(paint: (plot: Plot, n: number) => void, n = 64) {
  return fromPaint("anon-" + paint.name, paint, n);
}

export const inkWaterTex = () => fromPaint("water-ink", paintInkWater, 128);
export const iceWaterTex = () => fromPaint("water-ice", PAINTS["water-ice"], 128);
export const slagWaterTex = () => fromPaint("water-slag", paintSlagWater, 128);
export const leadTex = () => fromPaint("ground-lead", paintLead, 128);
export const brassTex = () => fromPaint("metal-brass", paintBrass, 128);
export const rustTex = () => fromPaint("metal-rust", paintRust, 128);
export const grassLeadTex = () => fromPaint("ground-grass", paintGrass, 128);
export const iceGroundTex = () => fromPaint("ground-ice", paintIce, 128);
export const ashTex = () => fromPaint("ground-ash", PAINTS["ground-ash"], 128);
export const scaleOliveTex = () => fromPaint("scale-olive", paintScale);
export const cloudTex = () => fromPaint("cloud-paper", paintCloud, 128);
export const hullTex = () => fromPaint("ship-hull", paintHull);
export const rockTex = () => fromPaint("ground-rock", paintRock, 128);
