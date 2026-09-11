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
  laser: () => {
    const n = 0.85 + Math.random() * 0.3;
    beep(920 * n, 0.04, "square", 0.04);
    beep(480 * n, 0.055, "triangle", 0.028);
    beep(180, 0.03, "sawtooth", 0.018);
  },
  charge: () => {
    beep(180, 0.28, "sawtooth", 0.055);
    beep(360, 0.18, "triangle", 0.03);
  },
  lock: () => {
    beep(980, 0.08, "square", 0.04);
    beep(1320, 0.1, "triangle", 0.03);
  },
  warn: () => beep(170, 0.16, "sawtooth", 0.055),
  hit: () => {
    beep(210 + Math.random() * 50, 0.07, "square", 0.05);
    beep(90 + Math.random() * 30, 0.12, "triangle", 0.055);
  },
  boom: () => {
    beep(70 + Math.random() * 24, 0.28, "sawtooth", 0.08);
    beep(160, 0.16, "triangle", 0.05);
    beep(40, 0.22, "sine", 0.04);
  },
  roll: () => beep(420, 0.18, "sine", 0.04),
  splash: () => beep(90, 0.2, "triangle", 0.05),
  wake: () => beep(70 + Math.random() * 20, 0.08, "triangle", 0.012),
  win: () => {
    beep(523, 0.15, "square", 0.05);
    setTimeout(() => beep(784, 0.25, "square", 0.05), 120);
  },
  dead: () => beep(80, 0.4, "sawtooth", 0.07),
};
