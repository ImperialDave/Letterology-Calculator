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
  | "roll"
  | "dash"
  | "turn"
  | "die";

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
  /** 0–1 land settle after a hard plant. */
  land?: number;
  /** 0–1 dash smear. */
  dash?: number;
  /** 0–1 death dissolve. */
  die?: number;
  /** 0–1 facing settle. */
  turn?: number;
  /** Swim / sluice undulation. */
  swim?: number;
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
  follow: number;
  breath: number;
  blink: number;
  dash: number;
  die: number;
  turn: number;
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
  const meleeFollow = melee >= 0.58 && melee < 1 ? 1 - (melee - 0.58) / 0.42 : 0;
  const wind = Math.max(attackWind, meleeWind);
  const snap = Math.max(attackSnap, meleeSnap);
  const follow = meleeFollow;
  const aux = input.aux ?? 1;
  const lunge =
    aux < 0.18 ? (0.18 - aux) / 0.18 : aux < 0.35 ? -0.28 * ((0.35 - aux) / 0.17) : 0;
  const dash = Math.max(0, Math.min(1, input.dash ?? (special > 0.4 ? special : 0)));
  const die = Math.max(0, Math.min(1, input.die ?? 0));
  const turn = Math.max(0, Math.min(1, input.turn ?? 0));
  const land = Math.max(0, Math.min(1, input.land ?? ((input.squash ?? 1) > 1.08 ? Math.min(1, ((input.squash ?? 1) - 1.08) / 0.16) : 0)));
  const swim = Math.max(0, Math.min(1, input.swim ?? 0));
  const breath = grounded && run < 0.12 && !air ? 0.5 + 0.5 * Math.sin(gait * 0.55) : 0;
  const blink = ((gait * 0.31) % 3.2) > 3.02 ? 1 : 0;

  let sy = input.squash ?? 1;
  let stretch = input.stretch ?? 1;
  if (air) {
    sy *= vy < 0 ? 0.88 : 1.08;
    stretch *= vy < 0 ? 1.08 : 0.94;
  } else if (hang) sy *= 0.94;
  else sy *= 1 + contact * 0.05 * run + breath * 0.03 + land * 0.1;
  if (wind > 0) sy *= 1 - wind * 0.08;
  if (snap > 0) stretch *= 1 + snap * 0.1;
  if (follow > 0) stretch *= 1 + follow * 0.04;
  if (dash > 0) stretch *= 1 + dash * 0.16;
  if (die > 0) sy *= 1 + die * 0.2;
  sy = Math.max(0.72, Math.min(1.28, sy));
  stretch = Math.max(0.78, Math.min(1.28, stretch));

  let lean = 0;
  if (hang) lean = 0.08;
  else if (air) lean = Math.max(-0.18, Math.min(0.18, vx * 0.00055));
  else lean = step * 0.055 * Math.max(run, 0.15) + (breath - 0.5) * 0.02;
  if (hurt > 0) lean += Math.sin(hurt * 42) * 0.1;
  lean += (input.recoil ?? 0) * Math.min(1, hurt * 4) * 0.14;
  if (snap > 0) lean += snap * 0.07;
  if (follow > 0) lean += follow * 0.04;
  if (wind > 0) lean -= wind * 0.09;
  if (turn > 0) lean += (turn - 0.5) * 0.2;
  if (swim > 0) lean += Math.sin(gait) * 0.08 * swim;
  if (die > 0) lean += Math.sin(die * 18) * 0.16 * die;

  let bob: number;
  if (hang) bob = 2.2 + Math.sin(gait * 0.8) * 0.6;
  else if (air) bob = vy < 0 ? -1.6 : Math.min(5, vy * 0.0045);
  else if (run < 0.12) bob = breath * 1.4;
  else bob = contact * (1.6 + run * 1.4);
  if (land > 0) bob += land * 3.2;
  if (swim > 0) bob += Math.sin(gait * 1.4) * 2.2 * swim;

  let state: PoseState = "idle";
  if (die > 0.08) state = "die";
  else if (roll > 0) state = "dash";
  else if (dash > 0.35) state = "dash";
  else if (hurt > 0.08) state = "hurt";
  else if (snap > 0.2) state = "snap";
  else if (wind > 0.2) state = "wind";
  else if (hang) state = "hang";
  else if (air && vy < -40) state = "jump";
  else if (air) state = "fall";
  else if (land > 0.2 || (input.squash ?? 1) > 1.08) state = "land";
  else if (turn > 0.25) state = "turn";
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
    follow,
    breath,
    blink,
    dash,
    die,
    turn,
  };
}
