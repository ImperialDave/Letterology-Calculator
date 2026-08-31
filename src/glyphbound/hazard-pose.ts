/** Shared hot/extend rules so draw and collision use one clock. */
import type { Solid } from "./types";
import {
  dropcapPose,
  grateHot,
  guillotinePose,
  shutterSlam,
  stamperPose,
} from "./toys";

export const SPIKE_PERIOD = 1.8;
export const SPIKE_HOT = 1.0;
export const LASER_PERIOD = 1.5;
export const LASER_HOT = 0.5;
export const GEYSER_PERIOD = 2.0;
export const GEYSER_HOT = 0.7;

export function spikeExtend(t: number, phase: number | undefined): number {
  if (phase == null) return 1;
  const cycle = (t + phase) % SPIKE_PERIOD;
  if (cycle < 0.2) return cycle / 0.2;
  if (cycle < SPIKE_HOT) return 1;
  if (cycle < SPIKE_HOT + 0.25) return 1 - (cycle - SPIKE_HOT) / 0.25;
  return 0;
}

/** Rising teeth are already lethal once they clear 35% so the tell is honest. */
export function spikeIsHot(t: number, phase: number | undefined): boolean {
  return spikeExtend(t, phase) > 0.35;
}

export function laserIsHot(t: number, phase: number): boolean {
  return (t + phase) % LASER_PERIOD < LASER_HOT;
}

export function geyserIsHot(t: number, phase: number): boolean {
  return (t + phase) % GEYSER_PERIOD < GEYSER_HOT;
}

/** True when touching this solid should hurt (or, for dropcap, while it falls). */
export function solidIsHot(s: Solid, t: number): boolean {
  const ph = s.phase ?? 0;
  switch (s.type) {
    case "stamper":
      return stamperPose(t, ph).hot;
    case "guillotine":
      return guillotinePose(t, ph).hot;
    case "grate":
      return grateHot(t, ph);
    case "shutter":
      return shutterSlam(t, ph);
    case "dropcap":
      return dropcapPose(t, ph).hot;
    case "censer":
    case "rotor":
    case "saw":
      return true;
    case "spike":
      return spikeIsHot(t, s.phase);
    case "laser":
      return laserIsHot(t, ph);
    default:
      return false;
  }
}
