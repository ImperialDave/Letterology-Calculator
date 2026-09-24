import * as THREE from "three";

/** Three bands: shadow, middle, lit. Nearest filter keeps the steps hard. */
export function toonGradient(): THREE.DataTexture {
  const data = new Uint8Array([115, 191, 255]);
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
  const shell = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
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
    const next = list.map((material) => {
      const source = material as THREE.MeshStandardMaterial;
      const map = "map" in source ? source.map : null;
      const color = "color" in source && source.color ? source.color.getHex() : 0xffffff;
      const toon = toonMaterial(color, map);
      if (map) map.colorSpace = THREE.SRGBColorSpace;
      return toon;
    });
    mesh.material = next.length === 1 ? next[0] : next;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (outline && !mesh.children.some((item) => item.name === "outline")) addOutline(mesh, thickness);
  });
}
