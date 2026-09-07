/** Joint FK for giant robots. No three.js. Yaw 0 faces −Z, same as the C-wing. */

export interface JointBind {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

export interface JointDef {
  id: string;
  parent: string | null;
  bind: JointBind;
}

export interface PartDef {
  id: string;
  joint: string;
  hp: number;
  mark: boolean;
  destroyable: boolean;
  radius: number;
  kill?: boolean;
  support?: boolean;
  breakRadio?: { who: string; text: string };
}

export interface JointPose {
  rx: number;
  ry: number;
  rz: number;
}

export type RigPose = Record<string, JointPose>;

export interface WorldXform {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export function emptyPose(joints: JointDef[]): RigPose {
  const pose: RigPose = {};
  for (const j of joints) pose[j.id] = { rx: 0, ry: 0, rz: 0 };
  return pose;
}

function rotY(x: number, z: number, yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: x * c + z * s, z: -x * s - z * c };
}

/** Pitch then roll in parent space, then the facing yaw (model +Z → world −Z). */
function rotLocal(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  if (rx) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    const ny = y * c - z * s;
    const nz = y * s + z * c;
    y = ny;
    z = nz;
  }
  if (rz) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    const nx = x * c - y * s;
    const ny = x * s + y * c;
    x = nx;
    y = ny;
  }
  const p = rotY(x, z, ry);
  return { x: p.x, y, z: p.z };
}

/** Bind +Z is model forward; yaw 0 maps that to world −Z. Parent rx/rz swing children. */
export function fk(joints: JointDef[], pose: RigPose, root: { x: number; y: number; z: number; yaw: number }): Record<string, WorldXform> {
  const world: Record<string, WorldXform> = {};
  for (const j of joints) {
    const pr = pose[j.id] ?? { rx: 0, ry: 0, rz: 0 };
    const lx = j.bind.x;
    const ly = j.bind.y;
    const lz = j.bind.z;
    const rx = (j.bind.rx ?? 0) + pr.rx;
    const ry = (j.bind.ry ?? 0) + pr.ry;
    const rz = (j.bind.rz ?? 0) + pr.rz;
    if (!j.parent) {
      const p = rotY(lx, lz, root.yaw);
      world[j.id] = { x: root.x + p.x, y: root.y + ly, z: root.z + p.z, rx, ry: root.yaw + ry, rz };
      continue;
    }
    const par = world[j.parent];
    const p = rotLocal(lx, ly, lz, par.rx, par.ry, par.rz);
    world[j.id] = {
      x: par.x + p.x,
      y: par.y + p.y,
      z: par.z + p.z,
      rx: par.rx + rx,
      ry: par.ry + ry,
      rz: par.rz + rz,
    };
  }
  return world;
}

export function partWorld(parts: PartDef[], xforms: Record<string, WorldXform>, id: string) {
  const p = parts.find((n) => n.id === id);
  if (!p) return null;
  return xforms[p.joint] ?? null;
}
