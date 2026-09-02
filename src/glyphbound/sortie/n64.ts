import * as THREE from "three";

export const INK = 0x5ee0c0;
export const BRASS = 0xe8d48a;
export const RUST = 0xd45a4a;
export const LEAD = 0x3a4248;
export const PAPER = 0xc9b896;
export const FOG = 0x6a9080;

export function n64Mat(color: number, opts?: { map?: THREE.Texture; emissive?: number }) {
  return new THREE.MeshLambertMaterial({
    color,
    map: opts?.map,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissive ? 0.35 : 0,
    flatShading: true,
  });
}

export function tileTex(paint: (c: CanvasRenderingContext2D, n: number) => void, n = 64) {
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  paint(g, n);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function inkWaterTex() {
  return tileTex((g, n) => {
    g.fillStyle = "#163028";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = i % 2 ? "#2a5a48" : "#1c3c34";
      g.beginPath();
      const y = (i * 7) % n;
      g.moveTo(0, y);
      g.quadraticCurveTo(n * 0.4, y + 4, n, y);
      g.stroke();
    }
    g.fillStyle = "#5ee0c0";
    g.globalAlpha = 0.15;
    g.fillRect(8, 20, 12, 3);
    g.globalAlpha = 1;
  });
}

export function leadTex() {
  return tileTex((g, n) => {
    g.fillStyle = "#2a3238";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#3e4a52";
    for (let y = 0; y < n; y += 8) g.fillRect(0, y, n, 3);
    g.fillStyle = "#1a2024";
    for (let x = 0; x < n; x += 11) g.fillRect(x, 0, 2, n);
    g.fillStyle = "#c9b896";
    g.globalAlpha = 0.2;
    g.fillRect(4, 4, 6, 6);
    g.globalAlpha = 1;
  });
}

export function brassTex() {
  return tileTex((g, n) => {
    g.fillStyle = "#6a5428";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#e8d48a";
    g.globalAlpha = 0.35;
    for (let i = 0; i < 12; i++) g.fillRect((i * 13) % n, (i * 9) % n, 8, 3);
    g.globalAlpha = 1;
  });
}

export function grassLeadTex() {
  return tileTex((g, n) => {
    g.fillStyle = "#1a3020";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#3d6a44";
    for (let i = 0; i < 40; i++) g.fillRect((i * 17) % n, (i * 11) % n, 3, 5);
    g.fillStyle = "#2a3238";
    for (let i = 0; i < 8; i++) g.fillRect((i * 19) % n, (i * 7) % n, 10, 4);
  });
}
