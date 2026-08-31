/** Shared locomotion clock for ink letters and Numberomicon wyrms. */
export type PoseState =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "hang"
  | "fall"
  | "land"
  | "wind"
  | "snap"
  | "hurt"
  | "roll";

export type PoseInput = {
  vx?: number;
  vy?: number;
  grounded?: boolean;
  hang?: boolean;
  special?: number;
  /** 0–1 melee / flourish swing. */
  melee?: number;
  /** Remaining shot-attack timer (seconds). */
  attack?: number;
  hurt?: number;
  roll?: number;
  squash?: number;
  stretch?: number;
  /** Integrator from tickGait — never wall-clock. */
  gait?: number;
  /** Last hit direction in facing space (−1 left, +1 right). */
  recoil?: number;
  /** Enemy bite/aux timer; small means a strike is live. */
  aux?: number;
};

export type Pose = {
  vx: number;
  vy: number;
  grounded: boolean;
  air: boolean;
  run: number;
  gait: number;
  step: number;
  pass: number;
  contact: number;
  sy: number;
  stretch: number;
  lean: number;
  bob: number;
  wind: number;
  snap: number;
  recoil: number;
  lunge: number;
  state: PoseState;
  special: number;
};

export function tickGait(gait: number, vx: number, grounded: boolean, dt: number): number {
  const spd = Math.abs(vx);
  const rate = !grounded ? 3.4 : spd > 28 ? 8.2 + Math.min(5.5, spd / 42) : 2.15;
  return gait + dt * rate;
}

/** True on each foot-down (half-period of the sine gait). */
export function gaitPlanted(prev: number, next: number): boolean {
  return Math.floor(prev / Math.PI) !== Math.floor(next / Math.PI);
}

export function meleePhase(melee: number, meleeMax: number, flourish = 0, flourishMax = 0): number {
  if (flourish > 0 && flourishMax > 0) return Math.max(0, Math.min(1, 1 - flourish / flourishMax));
  if (melee > 0 && meleeMax > 0) return Math.max(0, Math.min(1, 1 - melee / meleeMax));
  return 0;
}

export function poseOf(input: PoseInput = {}): Pose {
  const vx = input.vx ?? 0;
  const vy = input.vy ?? 0;
  const grounded = input.grounded ?? true;
  const hang = !!input.hang;
  const air = !grounded && !hang;
  const run = Math.min(1, Math.abs(vx) / 170);
  const gait = input.gait ?? 0;
  const step = Math.sin(gait);
  const pass = Math.sin(gait * 2);
  const contact = grounded ? Math.abs(step) : 0;
  const hurt = Math.max(0, input.hurt ?? 0);
  const roll = Math.max(0, input.roll ?? 0);
  const special = input.special ?? 0;
  const attack = Math.max(0, input.attack ?? 0);
  const melee = Math.max(0, Math.min(1, input.melee ?? 0));
  const atk = Math.max(0, Math.min(1, attack / 0.16));
  const attackWind = atk > 0.7 ? (atk - 0.7) / 0.3 : 0;
  const attackSnap = atk > 0 && atk <= 0.7 ? 1 - atk / 0.7 : 0;
  const meleeWind = melee > 0 && melee < 0.28 ? 1 - melee / 0.28 : 0;
  const meleeSnap = melee >= 0.28 && melee < 0.58 ? 1 - (melee - 0.28) / 0.3 : 0;
  const wind = Math.max(attackWind, meleeWind);
  const snap = Math.max(attackSnap, meleeSnap);
  const aux = input.aux ?? 1;
  const lunge =
    aux < 0.18 ? (0.18 - aux) / 0.18 : aux < 0.35 ? -0.28 * ((0.35 - aux) / 0.17) : 0;

  let sy = input.squash ?? 1;
  const stretch = input.stretch ?? 1;
  if (air) sy *= vy < 0 ? 0.9 : 1.07;
  else if (hang) sy *= 0.94;
  else sy *= 1 + contact * 0.04 * run;
  sy = Math.max(0.74, Math.min(1.22, sy));

  let lean = 0;
  if (hang) lean = 0.08;
  else if (air) lean = Math.max(-0.16, Math.min(0.16, vx * 0.0005));
  else lean = step * 0.05 * run;
  if (hurt > 0) lean += Math.sin(hurt * 42) * 0.1;
  lean += (input.recoil ?? 0) * Math.min(1, hurt * 4) * 0.14;
  if (snap > 0) lean += snap * 0.06;
  if (wind > 0) lean -= wind * 0.08;

  let bob: number;
  if (hang) bob = 2.2;
  else if (air) bob = vy < 0 ? -1.4 : Math.min(4, vy * 0.004);
  else bob = contact * (1.5 + run * 1.2);

  let state: PoseState = "idle";
  if (roll > 0) state = "roll";
  else if (hurt > 0.08) state = "hurt";
  else if (snap > 0.2) state = "snap";
  else if (wind > 0.2) state = "wind";
  else if (hang) state = "hang";
  else if (air && vy < -40) state = "jump";
  else if (air) state = "fall";
  else if ((input.squash ?? 1) > 1.08) state = "land";
  else if (run > 0.62) state = "run";
  else if (run > 0.12) state = "walk";

  return {
    vx,
    vy,
    grounded,
    air,
    run,
    gait,
    step,
    pass,
    contact,
    sy,
    stretch,
    lean,
    bob,
    wind,
    snap,
    recoil: input.recoil ?? 0,
    lunge,
    state,
    special,
  };
}
