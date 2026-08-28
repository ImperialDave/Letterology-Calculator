export class AudioBus {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  music: GainNode | null = null;
  muted = false;
  musicOn = true;
  sfxVol = 1;
  musicVol = 1;
  step = 0;
  acc = 0;
  started = false;
  private voices = 0;
  private readonly maxVoices = 12;
  private noiseBuf: AudioBuffer | null = null;
  private lastHit = 0;

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
        this.sfx.gain.value = 0.28 * this.sfxVol;
        this.music.gain.value = 0.16 * this.musicVol;
        this.sfx.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(this.ctx.destination);
        const n = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const d = n.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = n;
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

  setSfxVol(v: number) {
    this.sfxVol = Math.max(0, Math.min(1, v));
    if (this.sfx && this.ctx) this.sfx.gain.setTargetAtTime(0.28 * this.sfxVol, this.ctx.currentTime, 0.04);
  }

  setMusicVol(v: number) {
    this.musicVol = Math.max(0, Math.min(1, v));
    if (this.music && this.ctx) this.music.gain.setTargetAtTime(0.16 * this.musicVol, this.ctx.currentTime, 0.04);
  }

  duck(sec = 0.14) {
    if (!this.ctx || !this.music || this.muted) return;
    const t = this.ctx.currentTime;
    const rest = 0.16 * this.musicVol;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setValueAtTime(rest, t);
    this.music.gain.linearRampToValueAtTime(rest * 0.22, t + 0.03);
    this.music.gain.linearRampToValueAtTime(rest, t + Math.max(0.08, sec));
  }

  private release = () => {
    this.voices = Math.max(0, this.voices - 1);
  };

  tone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    gain = 0.12,
    slide = 0,
    dest: "sfx" | "music" = "sfx",
  ) {
    if (!this.ctx || !this.sfx || !this.music || this.muted) return;
    if (this.voices >= this.maxVoices) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    const jitter = 0.94 + Math.random() * 0.12;
    o.frequency.setValueAtTime(freq * jitter, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * jitter + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest === "music" ? this.music : this.sfx);
    o.onended = () => {
      try {
        o.disconnect();
        g.disconnect();
      } catch {
        /* already gone */
      }
      this.release();
    };
    this.voices += 1;
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur: number, gain = 0.08) {
    if (!this.ctx || !this.sfx || this.muted || !this.noiseBuf) return;
    if (this.voices >= this.maxVoices) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
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
    src.onended = () => {
      try {
        src.disconnect();
        f.disconnect();
        g.disconnect();
      } catch {
        /* already gone */
      }
      this.release();
    };
    this.voices += 1;
    src.start(t, 0, dur);
    try {
      src.stop(t + dur + 0.02);
    } catch {
      /* ignore */
    }
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
  }
  sfxHit() {
    const now = this.ctx?.currentTime ?? 0;
    if (now - this.lastHit < 0.04) return;
    this.lastHit = now;
    this.tone(160, 0.08, "square", 0.08, -80);
    this.noise(0.04, 0.04);
  }
  sfxHurt() {
    this.tone(220, 0.16, "sawtooth", 0.09, -140);
  }
  sfxBlock() {
    this.tone(300, 0.1, "triangle", 0.08, 80);
    this.tone(180, 0.14, "sine", 0.07);
  }
  sfxPickup() {
    this.tone(660, 0.1, "sine", 0.07, 200);
    this.tone(990, 0.14, "sine", 0.05, 120);
  }
  sfxWord() {
    this.tone(520, 0.18, "triangle", 0.08, 80);
  }
  sfxTransform() {
    this.tone(196, 0.4, "sawtooth", 0.08, 220);
    this.tone(392, 0.5, "triangle", 0.06, 280);
  }
  sfxDeath() {
    this.duck(0.28);
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
    if (this.voices >= this.maxVoices - 1) {
      this.acc = 0;
      return;
    }
    this.acc += dt;
    const beat = 0.44;
    if (this.acc < beat) return;
    this.acc -= beat;
    if (this.acc > beat) this.acc = 0;
    this.step = (this.step + 1) % 8;
    const bass = [110, 110, 98, 82.4, 110, 130.8, 98, 87.3];
    this.tone(bass[this.step], 0.28, "sine", 0.045, 0, "music");
    if (this.step % 2 === 0) this.tone(330, 0.1, "triangle", 0.025, 0, "music");
  }
}
