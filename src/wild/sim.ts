/** On-foot third person. A/D strafe. They do not steer. */

export type V2 = { x: number; z: number };

export const SPIRE = { x: 112, z: 0 };
export const SERIF = { x: 14, z: 20 };
export const SCRIPT = { x: 102, z: 9 };
export const HERDER = { x: 8.6, z: 13.2 };
export const CALDERA = { x: 230, z: -18 };
export const STAG_A = { x: 18, z: 5 };
export const STAG_B = { x: 34, z: 3.5 };
export const HOUSES = [
  { x: 11.5, z: 16, h: 5.6 },
  { x: -8.5, z: 15, h: 4.7 },
];

export type WildInput = {
  forward: number;
  strafe: number;
  look: number;
  jumpHeld: boolean;
  hop: boolean;
  cut: boolean;
  talk: boolean;
};

export type WildState = {
  x: number;
  z: number;
  y: number;
  yaw: number;
  camYaw: number;
  stamina: number;
  grounded: boolean;
  climbing: boolean;
  fluttering: boolean;
  vy: number;
  stagX: number;
  stagZ: number;
  stagYaw: number;
  stagHits: number;
  stagFreed: boolean;
  stagFlee: number;
  stagPatrol: number;
  serif: 0 | 1 | 2;
  scriptorium: boolean;
  spireReached: boolean;
  campTalked: boolean;
  slash: number;
  slashCd: number;
  time: number;
  toast: string;
  toastLeft: number;
  speed: number;
};

const SPEED = 5.15;

export function forwardFromYaw(yaw: number): V2 {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

export function rightFromForward(forward: V2): V2 {
  return { x: -forward.z, z: forward.x };
}

export function freshWild(): WildState {
  return {
    x: 0,
    z: 6,
    y: 0,
    yaw: -Math.PI / 2,
    camYaw: -Math.PI / 2,
    stamina: 100,
    grounded: true,
    climbing: false,
    fluttering: false,
    vy: 0,
    stagX: 26,
    stagZ: 4.2,
    stagYaw: -Math.PI / 2,
    stagHits: 0,
    stagFreed: false,
    stagFlee: 0,
    stagPatrol: 0,
    serif: 0,
    scriptorium: false,
    spireReached: false,
    campTalked: false,
    slash: 0,
    slashCd: 0,
    time: 0,
    toast: "A numeral walks the trail. Cut it, not the deer.",
    toastLeft: 6,
    speed: 0,
  };
}

function dist(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}

function say(s: WildState, text: string) {
  s.toast = text;
  s.toastLeft = 5;
}

function channelK(s: WildState) {
  if (s.slashCd > 0) return;
  if (s.stamina < 8) {
    say(s, "The ink sputters.");
    s.slashCd = 0.35;
    return;
  }
  s.slashCd = 0.48;
  s.slash = 0.26;
  s.stamina = Math.max(0, s.stamina - 10);
  if (s.stagFreed) return;
  const dx = s.stagX - s.x;
  const dz = s.stagZ - s.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.001 || d > 3.7) return;
  const face = forwardFromYaw(s.yaw);
  if ((face.x * dx + face.z * dz) / d < 0.35) return;
  s.stagHits += 1;
  if (s.stagHits >= 3) {
    s.stagFreed = true;
    s.stagFlee = 6.5;
    say(s, "The numeral cracks. The stag remembers it is a stag.");
  } else {
    say(s, s.stagHits === 1 ? "The brand splits." : "Ink runs off the brow.");
  }
}

function talk(s: WildState) {
  const dSerif = dist(s.x, s.z, SERIF.x, SERIF.z);
  const dScript = dist(s.x, s.z, SCRIPT.x, SCRIPT.z);
  const dHerder = dist(s.x, s.z, HERDER.x, HERDER.z);
  const dSpire = dist(s.x, s.z, SPIRE.x, SPIRE.z);
  const atBell = dSpire < 3.5 && s.y > 18;
  if (atBell) {
    s.spireReached = true;
    if (s.serif === 1) {
      s.serif = 2;
      say(s, "The spire keeps the line. One verse returns to the steppe.");
    } else if (s.serif === 0) {
      say(s, "A serif is still out in the grass, south of the trail.");
    } else {
      say(s, "The bell is quiet. The verse is already here.");
    }
    return;
  }
  let best = 2.4;
  let id = 0;
  if (s.serif === 0 && dSerif < best) {
    best = dSerif;
    id = 1;
  }
  if (dScript < best) {
    best = dScript;
    id = 2;
  }
  if (dHerder < best) {
    best = dHerder;
    id = 3;
  }
  if (id === 1) {
    s.serif = 1;
    say(s, "The serif climbs your staff.");
  } else if (id === 2) {
    s.scriptorium = true;
    say(s, "The vowel A is missing. It is held in the high paper cliffs. The paperwing will not hold air until A returns.");
  } else if (id === 3) {
    s.campTalked = true;
    say(s, "The count started at the coast. Cut the numeral, not the deer.");
  } else {
    say(s, "Wind, and nothing that answers.");
  }
}

export function objectiveLine(s: WildState) {
  if (!s.stagFreed) return "Cut the brand on the stag. Leave the animal alive.";
  if (s.serif === 0) return "The stag is free. A serif hides south of the trail.";
  if (!s.spireReached) return "Climb the First Spire. The serif rides your staff.";
  if (s.serif === 1) return "Give the serif to the bell.";
  if (!s.scriptorium) return "Read the scriptorium at the spire's foot.";
  return "The vowel A is missing. The caldera will not open.";
}

export function stepWild(s: WildState, input: WildInput, dt: number) {
  if (dt < 0) dt = 0;
  if (dt > 0.05) dt = 0.05;
  s.time += dt;
  if (s.toastLeft > 0) s.toastLeft -= dt;
  s.camYaw -= input.look * dt;
  const forward = forwardFromYaw(s.camYaw);
  const right = rightFromForward(forward);
  let wx = forward.x * input.forward + right.x * input.strafe;
  let wz = forward.z * input.forward + right.z * input.strafe;
  const wish = Math.hypot(wx, wz);
  if (wish > 1) {
    wx /= wish;
    wz /= wish;
  }
  const moving = wish > 0.05;
  const speed = SPEED;
  s.speed = moving ? speed * Math.min(wish, 1) : 0;
  const spireD = dist(s.x, s.z, SPIRE.x, SPIRE.z);
  s.fluttering = false;
  s.climbing = false;
  if (spireD > 1.05 && spireD < 2.7 && s.y < 22 && input.forward > 0.2 && s.stamina > 0) {
    s.climbing = true;
    s.grounded = false;
    s.vy = 0;
    s.y = Math.min(23, s.y + 3.15 * dt);
    const ang = Math.atan2(s.z - SPIRE.z, s.x - SPIRE.x);
    s.x = SPIRE.x + Math.cos(ang) * 1.6;
    s.z = SPIRE.z + Math.sin(ang) * 1.6;
    s.stamina -= 15 * dt;
  } else {
    s.x += wx * speed * dt;
    s.z += wz * speed * dt;
    if (s.grounded && input.hop && s.vy === 0) {
      s.vy = 6.2;
      s.grounded = false;
      s.y = 0.2;
    }
    if (!s.grounded) {
      s.vy -= 17 * dt;
      if (input.jumpHeld && s.vy < 0 && s.stamina > 0) {
        s.fluttering = true;
        s.vy = Math.max(s.vy, -1.55);
        s.stamina -= 18 * dt;
      }
      s.y += s.vy * dt;
      if (s.y <= 0) {
        s.y = 0;
        s.vy = 0;
        s.grounded = true;
        s.fluttering = false;
      }
    }
    if (moving) s.yaw = Math.atan2(-wx, -wz);
  }
  if (s.y > 20 && spireD < 3.4) s.spireReached = true;
  if (s.grounded && !s.climbing) s.stamina = Math.min(100, s.stamina + 18 * dt);
  s.stamina = Math.max(0, Math.min(100, s.stamina));

  const cd = dist(s.x, s.z, CALDERA.x, CALDERA.z);
  if (cd < 46) {
    const nx = (s.x - CALDERA.x) / Math.max(cd, 0.001);
    const nz = (s.z - CALDERA.z) / Math.max(cd, 0.001);
    s.x = CALDERA.x + nx * 52;
    s.z = CALDERA.z + nz * 52;
    s.y = 0;
    s.grounded = true;
    say(s, "The rim shreds the paperwing. The names are not all spoken.");
  }

  if (input.cut) channelK(s);
  if (s.slash > 0) s.slash -= dt;
  if (s.slashCd > 0) s.slashCd -= dt;
  if (input.talk) talk(s);

  if (!s.stagFreed) {
    const pd = dist(s.x, s.z, s.stagX, s.stagZ);
    let tx = s.stagX;
    let tz = s.stagZ;
    let spd = 0;
    if (pd < 13) {
      tx = s.x;
      tz = s.z;
      spd = pd < 2.6 ? 0 : 4.6;
    } else {
      s.stagPatrol += dt * 0.16;
      const cycle = s.stagPatrol % 2;
      const u = cycle < 1 ? cycle : 2 - cycle;
      tx = STAG_A.x + (STAG_B.x - STAG_A.x) * u;
      tz = STAG_A.z + (STAG_B.z - STAG_A.z) * u;
      spd = 2.5;
    }
    const dx = tx - s.stagX;
    const dz = tz - s.stagZ;
    const L = Math.hypot(dx, dz);
    if (L > 0.04 && spd > 0) {
      const step = Math.min(L, spd * dt);
      s.stagX += (dx / L) * step;
      s.stagZ += (dz / L) * step;
      s.stagYaw = Math.atan2(-dx, -dz);
    }
  } else if (s.stagFlee > 0) {
    s.stagFlee -= dt;
    const dx = s.stagX - s.x;
    const dz = s.stagZ - s.z;
    const L = Math.hypot(dx, dz) || 1;
    s.stagX += (dx / L) * 8.2 * dt;
    s.stagZ += (dz / L) * 8.2 * dt;
  }
}

export function saveWild(s: WildState) {
  localStorage.setItem("unwritten-wild", JSON.stringify(s));
}

export function loadWild(): WildState | null {
  try {
    const raw = localStorage.getItem("unwritten-wild");
    if (!raw) return null;
    return { ...freshWild(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}
