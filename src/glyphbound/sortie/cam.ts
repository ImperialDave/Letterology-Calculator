/** Shared chase / cockpit camera. No three.js. */

export const CHASE_BACK = 16;
export const CHASE_UP = 2.4;
export const CHASE_LOOK = 16;
export const CHASE_FOV = 52;
export const BOOST_FOV = 62;
export const COCKPIT_FWD = 1.35;
export const COCKPIT_UP = 0.55;
export const COCKPIT_LOOK = 22;
export const COCKPIT_FOV = 68;
export const DEFAULT_ASPECT = 16 / 9;
export const CAM_POS_K = 9;
export const CAM_LOOK_K = 12;

export type AimCraft = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  cockpit: boolean;
  speed: number;
  aspect?: number;
};

export function shipFwd(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  return {
    x: -Math.sin(yaw) * cp,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cp,
  };
}

export function inBox(sx: number, sy: number, r: number, aspect = DEFAULT_ASPECT) {
  return Math.abs(sy) < r && Math.abs(sx) * aspect < r;
}

/** Chase/cockpit projection. sx/sy are NDC −1..1 of the frame. */
export function aimScreen(s: AimCraft, tx: number, ty: number, tz: number) {
  const f = shipFwd(s.yaw, s.pitch);
  const aspect = s.aspect && s.aspect > 0.3 ? s.aspect : DEFAULT_ASPECT;
  let ox: number;
  let oy: number;
  let oz: number;
  let lx: number;
  let ly: number;
  let lz: number;
  let fov: number;
  if (s.cockpit) {
    ox = s.x + f.x * COCKPIT_FWD;
    oy = s.y + f.y * COCKPIT_FWD + COCKPIT_UP;
    oz = s.z + f.z * COCKPIT_FWD;
    lx = s.x + f.x * COCKPIT_LOOK;
    ly = s.y + f.y * COCKPIT_LOOK;
    lz = s.z + f.z * COCKPIT_LOOK;
    fov = COCKPIT_FOV;
  } else {
    ox = s.x - f.x * CHASE_BACK;
    oy = s.y - f.y * CHASE_BACK + CHASE_UP;
    oz = s.z - f.z * CHASE_BACK;
    lx = s.x + f.x * CHASE_LOOK;
    ly = s.y + f.y * CHASE_LOOK;
    lz = s.z + f.z * CHASE_LOOK;
    fov = s.speed > 70 ? BOOST_FOV : CHASE_FOV;
  }
  let fx = lx - ox;
  let fy = ly - oy;
  let fz = lz - oz;
  const fn = Math.hypot(fx, fy, fz) || 1;
  fx /= fn;
  fy /= fn;
  fz /= fn;
  let rx = fy * 0 - fz * 1;
  let ry = fz * 0 - fx * 0;
  let rz = fx * 1 - fy * 0;
  const rn = Math.hypot(rx, ry, rz) || 1;
  rx /= rn;
  ry /= rn;
  rz /= rn;
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;
  const dx = tx - ox;
  const dy = ty - oy;
  const dz = tz - oz;
  const z = dx * fx + dy * fy + dz * fz;
  const x = dx * rx + dy * ry + dz * rz;
  const y = dx * ux + dy * uy + dz * uz;
  if (z < 6) return { sx: 0, sy: 0, z, on: false };
  const tan = Math.tan(((fov * Math.PI) / 180) / 2);
  const sx = x / z / (tan * aspect);
  const sy = y / z / tan;
  return { sx, sy, z, on: Math.abs(sx) < 1.05 && Math.abs(sy) < 1 };
}
