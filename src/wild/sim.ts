/** On-foot third person. A/D strafe. They do not steer. */

import { playerSolids, REACH, slideMove, SOLID_R, stagSolids } from "./bodies";
import { nearestExamine } from "./props";
import { CALDERA, HERDER, SCRIPT, SERIF, SPIRE, STAG_A, STAG_B } from "./layout";
import { terrainHeight } from "./terrain";

export type V2 = { x: number; z: number };

export { CALDERA, HERDER, HOUSES, SCRIPT, SERIF, SPIRE, STAG_A, STAG_B } from "./layout";

export type WildInput = {
  forward: number;
  strafe: number;
  look: number;
  jumpHeld: boolean;
  hop: boolean;
  cut: boolean;
  talk: boolean;
  sprint: boolean;
};

export type Gait = "idle" | "walk" | "run" | "rise" | "fall" | "land";

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
  gait: Gait;
  landed: number;
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
    y: terrainHeight(0, 6),
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
    gait: "idle",
    landed: 0,
  };
}

function approach(current: number, target: number, rate: number) {
  const delta = target - current;
  if (Math.abs(delta) <= rate) return target;
  return current + Math.sign(delta) * rate;
}

function turnToward(from: number, to: number, maxStep: number) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + Math.max(-maxStep, Math.min(maxStep, delta));
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
  if (d < 0.001 || d > REACH.stag) return;
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
  const atBell = dSpire < REACH.bell && s.y > 18;
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
  let best = Infinity;
  let id = 0;
  if (s.serif === 0 && dSerif < REACH.serif && dSerif < best) {
    best = dSerif;
    id = 1;
  }
  if (dScript < REACH.script && dScript < best) {
    best = dScript;
    id = 2;
  }
  if (dHerder < REACH.herder && dHerder < best) {
    best = dHerder;
    id = 3;
  }
  const examined = nearestExamine(s.x, s.z);
  if (examined && examined.d < best) {
    say(s, examined.say);
    return;
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

export function contextPrompt(s: WildState): string | null {
  const dStag = dist(s.x, s.z, s.stagX, s.stagZ);
  const dSerif = dist(s.x, s.z, SERIF.x, SERIF.z);
  const dScript = dist(s.x, s.z, SCRIPT.x, SCRIPT.z);
  const dHerder = dist(s.x, s.z, HERDER.x, HERDER.z);
  const dSpire = dist(s.x, s.z, SPIRE.x, SPIRE.z);
  const top = terrainHeight(SPIRE.x, SPIRE.z) + 18;
  if (!s.stagFreed && dStag < REACH.stag) return "Cut the brand";
  if (dSpire > REACH.climbInner && dSpire < REACH.climbOuter && s.y < top - 0.4) return "Climb";
  if (dSpire < REACH.bell && s.y > top - 3 && s.serif === 1) return "Give the serif";
  if (s.serif === 0 && dSerif < REACH.serif) return "Speak";
  if (dScript < REACH.script || dHerder < REACH.herder) return "Speak";
  if (nearestExamine(s.x, s.z)) return "Speak";
  return null;
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
  const cap = (input.sprint ? SPEED : SPEED * 0.48) * (moving ? Math.min(wish, 1) : 0);
  s.speed = approach(s.speed, cap, (cap >= s.speed ? 12 : 16) * dt);
  const speed = s.speed;
  const spireBase = terrainHeight(SPIRE.x, SPIRE.z);
  const spireTop = spireBase + 18;
  const spireD = dist(s.x, s.z, SPIRE.x, SPIRE.z);
  s.fluttering = false;
  s.climbing = false;
  if (spireD > REACH.climbInner && spireD < REACH.climbOuter && s.y < spireTop - 0.3 && input.forward > 0.2 && s.stamina > 0) {
    s.climbing = true;
    s.grounded = false;
    s.vy = 0;
    s.y = Math.min(spireTop, s.y + 3.15 * dt);
    const ang = Math.atan2(s.z - SPIRE.z, s.x - SPIRE.x);
    s.x = SPIRE.x + Math.cos(ang) * REACH.climbPin;
    s.z = SPIRE.z + Math.sin(ang) * REACH.climbPin;
    s.stamina -= 15 * dt;
  } else {
    const wish = slideMove(s.x, s.z, s.x + wx * speed * dt, s.z + wz * speed * dt, playerSolids(s));
    const x1 = wish.x;
    const z1 = wish.z;
    const h0 = terrainHeight(s.x, s.z);
    const h1 = terrainHeight(x1, z1);
    const run = Math.hypot(x1 - s.x, z1 - s.z);
    const slope = run > 0.0001 ? (h1 - h0) / run : 0;
    const steep = slope > 0.8 && h1 > h0 + 0.02;
    if (s.grounded && steep && input.forward > 0.1 && s.stamina > 0 && moving) {
      s.climbing = true;
      s.x = x1;
      s.z = z1;
      s.y = h1;
      s.vy = 0;
      s.stamina -= 12 * dt;
    } else if (s.grounded && steep && moving) {
      // Too steep to walk. Climb, or go around.
    } else {
      s.x = x1;
      s.z = z1;
      const ground = terrainHeight(s.x, s.z);
      if (s.grounded && input.hop) {
        s.vy = 6.2;
        s.grounded = false;
        s.y = ground + 0.15;
      }
      if (!s.grounded) {
        s.vy -= 17 * dt;
        if (input.jumpHeld && s.vy < 0 && s.stamina > 0) {
          s.fluttering = true;
          s.vy = Math.max(s.vy, -1.55);
          s.stamina -= 18 * dt;
        }
        s.y += s.vy * dt;
        if (s.y <= ground) {
          if (s.vy < -1) s.landed = 0.28;
          s.y = ground;
          s.vy = 0;
          s.grounded = true;
          s.fluttering = false;
        }
      } else {
        s.y = ground;
      }
    }
    if (moving && speed > 0.2) s.yaw = turnToward(s.yaw, Math.atan2(-wx, -wz), 9 * dt);
  }
  if (s.landed > 0) {
    s.gait = "land";
    s.landed -= dt;
  } else if (!s.grounded && s.vy > 0.35) s.gait = "rise";
  else if (!s.grounded) s.gait = "fall";
  else if (s.speed > SPEED * 0.62) s.gait = "run";
  else if (s.speed > 0.35) s.gait = "walk";
  else s.gait = "idle";
  if (s.y > spireBase + 15 && dist(s.x, s.z, SPIRE.x, SPIRE.z) < REACH.bell) {
    if (!s.spireReached) say(s, "The bell has no clapper. The steppe is on the sheet now.");
    s.spireReached = true;
  }
  if (s.grounded && !s.climbing) s.stamina = Math.min(100, s.stamina + 18 * dt);
  s.stamina = Math.max(0, Math.min(100, s.stamina));

  const cd = dist(s.x, s.z, CALDERA.x, CALDERA.z);
  if (cd < 46) {
    const nx = (s.x - CALDERA.x) / Math.max(cd, 0.001);
    const nz = (s.z - CALDERA.z) / Math.max(cd, 0.001);
    s.x = CALDERA.x + nx * 52;
    s.z = CALDERA.z + nz * 52;
    s.y = terrainHeight(s.x, s.z);
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
      const next = slideMove(s.stagX, s.stagZ, s.stagX + (dx / L) * step, s.stagZ + (dz / L) * step, stagSolids(s), SOLID_R.stag);
      s.stagX = next.x;
      s.stagZ = next.z;
      s.stagYaw = Math.atan2(-dx, -dz);
    }
  } else if (s.stagFlee > 0) {
    s.stagFlee -= dt;
    const dx = s.stagX - s.x;
    const dz = s.stagZ - s.z;
    const L = Math.hypot(dx, dz) || 1;
    const next = slideMove(s.stagX, s.stagZ, s.stagX + (dx / L) * 8.2 * dt, s.stagZ + (dz / L) * 8.2 * dt, stagSolids(s), SOLID_R.stag);
    s.stagX = next.x;
    s.stagZ = next.z;
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
