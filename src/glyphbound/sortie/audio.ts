let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockSortieAudio() {
  ac();
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export const sortieSfx = {
  laser: () => beep(880, 0.08, "square", 0.04),
  charge: () => beep(220, 0.22, "sawtooth", 0.06),
  hit: () => beep(160, 0.12, "triangle", 0.07),
  roll: () => beep(420, 0.18, "sine", 0.04),
  splash: () => beep(90, 0.2, "triangle", 0.05),
  win: () => {
    beep(523, 0.15, "square", 0.05);
    setTimeout(() => beep(784, 0.25, "square", 0.05), 120);
  },
  dead: () => beep(80, 0.4, "sawtooth", 0.07),
};
