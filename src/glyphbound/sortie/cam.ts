/** Shared chase / cockpit camera. No three.js. */

export const CHASE_BACK = 14;
export const CHASE_UP = 5.5;
export const CHASE_LOOK = 40;
export const CHASE_LOOK_LIFT = 5;
export const SIGHT_DIST = 100;
export const CONVERGE_DIST = 110;
export const SIGHT_CLAMP = 0.62;
export const CHASE_FOV = 50;
export const BOOST_FOV = 60;
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

export function clampSight(x: number, y: number) {
  const m = Math.hypot(x, y);
  if (m <= SIGHT_CLAMP) return { x, y };
  return { x: (x / m) * SIGHT_CLAMP, y: (y / m) * SIGHT_CLAMP };
}

type CamFrame = {
  ox: number;
  oy: number;
  oz: number;
  fx: number;
  fy: number;
  fz: number;
  rx: number;
  ry: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
  tan: number;
  aspect: number;
};

function camFrame(s: AimCraft): CamFrame {
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
    ly = s.y + f.y * CHASE_LOOK + CHASE_LOOK_LIFT;
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
  const tan = Math.tan(((fov * Math.PI) / 180) / 2);
  return { ox, oy, oz, fx, fy, fz, rx, ry, rz, ux, uy, uz, tan, aspect };
}

/** Where the nose sits on screen at a given range. Chase cam looks slightly down, so this is above center. */
export function gunPip(s: AimCraft, dist = SIGHT_DIST) {
  const f = shipFwd(s.yaw, s.pitch);
  return aimScreen(s, s.x + f.x * dist, s.y + f.y * dist, s.z + f.z * dist);
}

/** Screen offset of a world point from the director (sightX/Y), falling back to screen center. */
export function aimOff(s: AimCraft & { sightX?: number; sightY?: number }, tx: number, ty: number, tz: number) {
  const pip = aimScreen(s, tx, ty, tz);
  const dx = s.sightX ?? 0;
  const dy = s.sightY ?? 0;
  return {
    sx: pip.sx - dx,
    sy: pip.sy - dy,
    z: pip.z,
    on: pip.on,
    pipSx: pip.sx,
    pipSy: pip.sy,
  };
}

/** World point along the camera ray through NDC (sx, sy) at camera-forward depth `dist`. */
export function unproject(s: AimCraft, sx: number, sy: number, dist = CONVERGE_DIST) {
  const c = camFrame(s);
  const z = Math.max(12, dist);
  const x = sx * c.tan * c.aspect * z;
  const y = sy * c.tan * z;
  return {
    x: c.ox + c.fx * z + c.rx * x + c.ux * y,
    y: c.oy + c.fy * z + c.ry * x + c.uy * y,
    z: c.oz + c.fz * z + c.rz * x + c.uz * y,
  };
}

/** Chase/cockpit projection. sx/sy are NDC −1..1 of the frame. */
export function aimScreen(s: AimCraft, tx: number, ty: number, tz: number) {
  const c = camFrame(s);
  const dx = tx - c.ox;
  const dy = ty - c.oy;
  const dz = tz - c.oz;
  const z = dx * c.fx + dy * c.fy + dz * c.fz;
  const x = dx * c.rx + dy * c.ry + dz * c.rz;
  const y = dx * c.ux + dy * c.uy + dz * c.uz;
  if (z < 6) return { sx: 0, sy: 0, z, on: false };
  const sx = x / z / (c.tan * c.aspect);
  const sy = y / z / c.tan;
  return { sx, sy, z, on: Math.abs(sx) < 1.05 && Math.abs(sy) < 1 };
}
