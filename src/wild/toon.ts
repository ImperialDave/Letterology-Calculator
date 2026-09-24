import * as THREE from "three";

/** Three bands: shadow, middle, lit. The shadow stays bright enough that a color still reads. */
export function toonGradient(): THREE.DataTexture {
  const data = new Uint8Array([168, 214, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

const GRADIENT = toonGradient();

export function toonMaterial(color: number, map?: THREE.Texture | null) {
  return new THREE.MeshToonMaterial({
    color,
    map: map ?? null,
    gradientMap: GRADIENT,
  });
}

/** A texture is shown at full strength. A part with no texture keeps the color it was given. */
export function authoredToon(source: THREE.Material) {
  const painted = source as THREE.MeshStandardMaterial;
  const map = "map" in painted ? painted.map : null;
  const toon = toonMaterial(0xffffff, map);
  if (!map && painted.color) toon.color.copy(painted.color);
  if (map) map.colorSpace = THREE.SRGBColorSpace;
  return toon;
}

const STAG_COAT = [0x241810, 0x5c3318, 0xa85a32, 0xc47848, 0xf0d8b0] as const;

/** Darkest slot becomes the hoof, brightest the belly. The order of the input is preserved. */
export function stagCoat(luminances: number[]) {
  const order = luminances.map((lum, index) => ({ lum, index })).sort((a, b) => a.lum - b.lum);
  const coats = new Array<number>(luminances.length);
  order.forEach((slot, rank) => {
    const t = order.length === 1 ? 1 : rank / (order.length - 1);
    coats[slot.index] = STAG_COAT[Math.round(t * (STAG_COAT.length - 1))];
  });
  return coats;
}

/** Ink line in view space, so a scaled house and a small barrel get a similar stroke. */
export function outlineMaterial(thickness = 0.028) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x1c243f,
    side: THREE.BackSide,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uThickness = { value: thickness };
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `vec4 mvPosition = vec4(transformed, 1.0);
       mvPosition = modelViewMatrix * mvPosition;
       vec3 outlineNormal = normalize(normalMatrix * objectNormal);
       mvPosition.xyz += outlineNormal * uThickness;
       gl_Position = projectionMatrix * mvPosition;`,
    );
  };
  return material;
}

export function addOutline(mesh: THREE.Mesh, thickness = 0.028) {
  const skinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh;
  const shell = skinned
    ? new THREE.SkinnedMesh(mesh.geometry, outlineMaterial(thickness))
    : new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  if (skinned) {
    const skin = mesh as THREE.SkinnedMesh;
    const rig = shell as THREE.SkinnedMesh;
    rig.bind(skin.skeleton, skin.bindMatrix);
    rig.bindMode = skin.bindMode;
  }
  shell.name = "outline";
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.frustumCulled = false;
  mesh.add(shell);
}

/** Replace standard materials with the shared toon ramp. Outlines are optional. */
export function toonify(root: THREE.Object3D, outline = false, thickness = 0.028) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh.name === "outline") return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = list.map((material) => authoredToon(material));
    mesh.material = next.length === 1 ? next[0] : next;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (outline && !mesh.children.some((item) => item.name === "outline")) addOutline(mesh, thickness);
  });
}
