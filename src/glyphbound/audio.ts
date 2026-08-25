export class AudioBus {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  music: GainNode | null = null;
  muted = false;
  musicOn = true;
  step = 0;
  acc = 0;
  started = false;

  unlock() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        try {
          this.ctx = new AC({ latencyHint: "interactive" });
        } catch {
          this.ctx = new AC();
        }
        this.master = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.music = this.ctx.createGain();
        this.sfx.gain.value = 0.28;
        this.music.gain.value = 0.16;
        this.sfx.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* private mode / old Safari */
    }
    this.started = true;
  }

  setMuted(v: boolean) {
    this.muted = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0 : 1, this.ctx.currentTime, 0.03);
    }
  }

  tone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    gain = 0.12,
    slide = 0,
    dest: "sfx" | "music" = "sfx",
  ) {
    if (!this.ctx || !this.sfx || !this.music || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest === "music" ? this.music : this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur: number, gain = 0.08) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 800;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  sfxJump() {
    this.tone(420, 0.12, "square", 0.07, 180);
  }
  sfxLand() {
    this.noise(0.08, 0.05);
    this.tone(90, 0.08, "sine", 0.08);
  }
  sfxSlash() {
    this.noise(0.06, 0.06);
    this.tone(880, 0.08, "sawtooth", 0.05, -400);
  }
  sfxShot() {
    this.tone(640, 0.07, "square", 0.05, 220);
    this.tone(980, 0.09, "triangle", 0.04, -280);
  }
  sfxHit() {
    this.tone(160, 0.1, "square", 0.1, -80);
    this.noise(0.1, 0.07);
  }
  sfxHurt() {
    this.tone(220, 0.16, "sawtooth", 0.09, -140);
  }
  sfxBlock() {
    this.tone(300, 0.1, "triangle", 0.08, 80);
    this.tone(180, 0.14, "sine", 0.07);
    this.noise(0.06, 0.04);
  }
  sfxPickup() {
    this.tone(660, 0.1, "sine", 0.07, 200);
    this.tone(990, 0.14, "sine", 0.05, 120);
  }
  sfxWord() {
    this.tone(520, 0.18, "triangle", 0.08, 80);
    this.tone(780, 0.22, "sine", 0.05);
  }
  sfxTransform() {
    this.tone(196, 0.4, "sawtooth", 0.08, 220);
    this.tone(392, 0.5, "triangle", 0.06, 280);
    this.tone(784, 0.6, "sine", 0.04, 120);
  }
  sfxDeath() {
    this.tone(110, 0.4, "sawtooth", 0.1, -70);
  }
  sfxSwap() {
    this.tone(500, 0.08, "triangle", 0.06, 80);
  }
  sfxUi() {
    this.tone(640, 0.06, "square", 0.04);
  }

  tickMusic(dt: number) {
    if (!this.started || this.muted || !this.musicOn) return;
    this.acc += dt;
    const beat = 0.22;
    while (this.acc >= beat) {
      this.acc -= beat;
      this.step = (this.step + 1) % 16;
      const bass = [110, 110, 98, 82.4, 110, 130.8, 98, 87.3];
      const lead = [0, 330, 0, 392, 0, 262, 330, 0, 392, 0, 494, 0, 330, 262, 0, 392];
      if (this.step % 2 === 0) this.tone(bass[(this.step / 2) | 0], 0.18, "sine", 0.05, 0, "music");
      const n = lead[this.step];
      if (n) this.tone(n, 0.12, "triangle", 0.035, 0, "music");
      if (this.step % 4 === 0) this.noise(0.03, 0.02);
    }
  }
}
