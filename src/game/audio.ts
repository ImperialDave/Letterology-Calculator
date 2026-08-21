export class AudioBus {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;
  volume = 0.7;
  private unlocked = false;

  unlock(): void {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : this.volume * this.volume;
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.unlocked = true;
    } catch {
      /* audio optional */
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.apply();
  }

  setVolume(v: number): void {
    this.volume = v;
    this.apply();
  }

  private apply(): void {
    if (!this.master || !this.ctx) return;
    const g = this.muted ? 0 : this.volume * this.volume;
    this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  resume(): void {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, slide = 0): void {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private noise(dur: number, gain = 0.12, hp = 400): void {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  drill(intensity: number): void {
    this.noise(0.05, 0.035 + intensity * 0.04, 200);
    this.tone(80 + intensity * 40, 0.06, "sawtooth", 0.03, -20);
  }

  collect(): void {
    const f = 520 + Math.random() * 80;
    this.tone(f, 0.08, "triangle", 0.09);
    this.tone(f * 1.5, 0.12, "sine", 0.06);
  }

  sell(): void {
    this.tone(440, 0.09, "square", 0.07);
    this.tone(660, 0.14, "triangle", 0.05, 80);
  }

  damage(): void {
    this.noise(0.16, 0.16, 120);
    this.tone(180, 0.18, "sawtooth", 0.08, -120);
  }

  explode(): void {
    this.noise(0.45, 0.28, 80);
    this.tone(140, 0.4, "sawtooth", 0.12, -100);
  }

  buy(): void {
    this.tone(330, 0.07, "square", 0.06);
    this.tone(495, 0.1, "triangle", 0.05);
  }

  boom(): void {
    this.noise(0.22, 0.2, 90);
    this.tone(90, 0.25, "sine", 0.1, -40);
  }

  ui(): void {
    this.tone(520, 0.04, "square", 0.04);
  }

  warn(): void {
    this.tone(240, 0.1, "square", 0.07);
  }

  thrust(): void {
    this.noise(0.04, 0.02, 300);
  }
}
