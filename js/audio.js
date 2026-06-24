export class CyberAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambientGain = null;
    this.effectsGain = null;
    this.musicGain = null;
    this.enabled = true;
    this.ambientStarted = false;
    this.musicStarted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.musicProfile = 1;
  }

  async initialize() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.context.destination);
      this.effectsGain = this.context.createGain();
      this.ambientGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.effectsGain.gain.value = 0.72;
      this.ambientGain.gain.value = 0.42;
      this.musicGain.gain.value = 0.38;
      this.effectsGain.connect(this.master);
      this.ambientGain.connect(this.master);
      this.musicGain.connect(this.master);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.startAmbient();
    this.startMusic();
  }

  setChannelVolume(channel, value) {
    const gainNode = {
      music: this.musicGain,
      ambient: this.ambientGain,
      effects: this.effectsGain,
    }[channel];

    if (!gainNode || !this.context) return;
    const normalized = Math.max(0, Math.min(1, Number(value)));
    gainNode.gain.cancelScheduledValues(this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(normalized, this.context.currentTime + 0.08);
  }

  setMusicProfile(profile) {
    this.musicProfile = Math.max(0, Math.min(2, Number(profile) || 0));
  }

  async suspend() {
    if (this.context?.state === "running") await this.context.suspend();
  }

  async resume() {
    if (this.context?.state === "suspended" && this.enabled) await this.context.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!this.master || !this.context) return;

    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.linearRampToValueAtTime(enabled ? 0.35 : 0, this.context.currentTime + 0.08);
  }

  tone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.1,
    type = "square",
    volume = 0.08,
    delay = 0,
  } = {}) {
    if (!this.context || !this.master || !this.enabled) return;

    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.effectsGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(duration = 0.12, volume = 0.035) {
    if (!this.context || !this.master || !this.enabled) return;

    const sampleCount = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);
    source.start();
  }

  play(name) {
    const sounds = {
      hover: () => this.tone({ frequency: 1600, endFrequency: 1200, duration: 0.035, volume: 0.018 }),
      click: () => this.tone({ frequency: 260, endFrequency: 520, duration: 0.07, volume: 0.045 }),
      generate: () => {
        this.noise(0.16, 0.025);
        [110, 165, 247].forEach((frequency, index) =>
          this.tone({ frequency, endFrequency: frequency * 1.4, duration: 0.22, type: "sawtooth", volume: 0.045, delay: index * 0.07 }),
        );
      },
      move: () => this.tone({ frequency: 130, endFrequency: 95, duration: 0.045, volume: 0.018 }),
      wall: () => this.tone({ frequency: 75, endFrequency: 45, duration: 0.1, type: "sawtooth", volume: 0.04 }),
      shard: () => {
        [660, 880, 1320].forEach((frequency, index) =>
          this.tone({ frequency, duration: 0.12, type: "square", volume: 0.04, delay: index * 0.055 }),
        );
      },
      locked: () => {
        this.tone({ frequency: 190, endFrequency: 120, duration: 0.13, volume: 0.05 });
        this.tone({ frequency: 160, endFrequency: 100, duration: 0.13, volume: 0.04, delay: 0.12 });
      },
      lose: () => {
        this.noise(0.5, 0.08);
        this.tone({ frequency: 240, endFrequency: 38, duration: 0.65, type: "sawtooth", volume: 0.09 });
      },
      win: () => {
        [220, 330, 440, 660, 880].forEach((frequency, index) =>
          this.tone({ frequency, endFrequency: frequency * 1.15, duration: 0.35, type: "triangle", volume: 0.055, delay: index * 0.09 }),
        );
      },
      copy: () => {
        this.tone({ frequency: 900, duration: 0.08, volume: 0.04 });
        this.tone({ frequency: 1350, duration: 0.12, volume: 0.04, delay: 0.08 });
      },
      jackIn: () => {
        this.noise(0.45, 0.045);
        this.tone({ frequency: 42, endFrequency: 220, duration: 1.1, type: "sawtooth", volume: 0.1 });
        this.tone({ frequency: 880, endFrequency: 1760, duration: 0.18, volume: 0.05, delay: 0.9 });
      },
    };

    sounds[name]?.();
  }

  startAmbient() {
    if (this.ambientStarted || !this.context || !this.master) return;
    this.ambientStarted = true;

    const low = this.context.createOscillator();
    const high = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    low.type = "sawtooth";
    low.frequency.value = 42;
    high.type = "sine";
    high.frequency.value = 84.5;
    filter.type = "lowpass";
    filter.frequency.value = 150;
    low.connect(filter);
    high.connect(filter);
    const droneGain = this.context.createGain();
    droneGain.gain.value = 0.075;
    filter.connect(droneGain);
    droneGain.connect(this.ambientGain);
    low.start();
    high.start();
  }

  startMusic() {
    if (this.musicStarted || !this.context || !this.musicGain) return;
    this.musicStarted = true;
    const profiles = [
      {
        bass: [55, 55, 65.41, 49, 55, 73.42, 65.41, 49],
        arp: [220, 261.63, 329.63, 392, 329.63, 261.63, 246.94, 196],
        step: 0.48,
      },
      {
        bass: [55, 55, 65.41, 49, 55, 82.41, 65.41, 49],
        arp: [220, 261.63, 329.63, 392, 329.63, 261.63, 246.94, 196],
        step: 0.43,
      },
      {
        bass: [55, 65.41, 73.42, 49, 82.41, 73.42, 65.41, 98],
        arp: [329.63, 392, 440, 523.25, 493.88, 392, 349.23, 293.66],
        step: 0.35,
      },
    ];

    const playMusicTone = (frequency, duration, type, volume, delay = 0) => {
      if (!this.enabled || !this.context) return;
      const start = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = type === "sawtooth" ? 420 : 1800;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    };

    this.nextNoteTime = this.context.currentTime + 0.08;
    const schedule = () => {
      if (!this.context) return;
      const profile = profiles[this.musicProfile];

      while (this.nextNoteTime < this.context.currentTime + 0.12) {
        const step = this.musicStep % profile.bass.length;
        const delay = Math.max(0, this.nextNoteTime - this.context.currentTime);
        playMusicTone(profile.bass[step], profile.step * 0.95, "sawtooth", 0.055, delay);
        if (step % 2 === 0) {
          playMusicTone(profile.arp[step], 0.16, "square", 0.022, delay + 0.04);
          playMusicTone(
            profile.arp[(step + 2) % profile.arp.length],
            0.12,
            "triangle",
            0.018,
            delay + profile.step / 2,
          );
        }
        this.nextNoteTime += profile.step;
        this.musicStep += 1;
      }
      this.musicTimer = window.setTimeout(schedule, 25);
    };
    schedule();
  }
}
