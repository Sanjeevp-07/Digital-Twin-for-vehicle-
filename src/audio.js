// High-Fidelity Procedural Web Audio API Engine Synthesizer

export class EngineAudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;

    // Audio Nodes
    this.masterGain = null;
    
    // Starter Motor
    this.starterOsc = null;
    this.starterGain = null;

    // Engine Synthesis
    this.oscFundamental = null;
    this.oscSub = null;
    this.oscHarmonic = null;
    this.noiseNode = null;
    this.engineGain = null;
    this.filterNode = null;
    this.distortionNode = null;

    // Turbocharger
    this.turboOsc = null;
    this.turboGain = null;
    this.turboSpool = 0;

    // Last states for transients
    this.lastThrottle = 0;
    this.lastRpm = 0;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Distortion / Saturation Curve
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(18);
    this.distortionNode.oversample = '2x';

    // 2. Low-Pass Filter (opens with throttle)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Oscillators for engine combustion tone
    this.oscFundamental = this.ctx.createOscillator();
    this.oscFundamental.type = 'sawtooth';
    this.oscFundamental.frequency.setValueAtTime(30, this.ctx.currentTime);

    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.setValueAtTime(15, this.ctx.currentTime);

    this.oscHarmonic = this.ctx.createOscillator();
    this.oscHarmonic.type = 'sawtooth';
    this.oscHarmonic.frequency.setValueAtTime(60, this.ctx.currentTime);

    // Starter Motor
    this.starterOsc = this.ctx.createOscillator();
    this.starterOsc.type = 'square';
    this.starterOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.starterGain = this.ctx.createGain();
    this.starterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.starterOsc.connect(this.starterGain);
    this.starterGain.connect(this.masterGain);

    // Turbo whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    // Connect graph
    this.oscFundamental.connect(this.distortionNode);
    this.oscSub.connect(this.distortionNode);
    this.oscHarmonic.connect(this.distortionNode);
    this.distortionNode.connect(this.filterNode);
    this.filterNode.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    // Start running oscillators
    this.oscFundamental.start();
    this.oscSub.start();
    this.oscHarmonic.start();
    this.starterOsc.start();
    this.turboOsc.start();

    this.initialized = true;
  }

  makeDistortionCurve(amount) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? 0.35 : 0.0, this.ctx.currentTime, 0.05);
    }
    return this.enabled;
  }

  update(physics) {
    if (!this.enabled) return;
    if (!this.initialized) {
      // AudioContext needs a user gesture to resume/init
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // 1. Starter Sound
    if (physics.starterActive) {
      const starterFreq = 75 + Math.sin(t * 28) * 20;
      this.starterOsc.frequency.setTargetAtTime(starterFreq, t, 0.03);
      this.starterGain.gain.setTargetAtTime(0.2, t, 0.05);
    } else {
      this.starterGain.gain.setTargetAtTime(0.0, t, 0.05);
    }

    // 2. Engine Tone & Frequencies
    if (physics.running && physics.rpm > 100) {
      // Cylinder firing frequency: (RPM / 60) * (cylinders / 2)
      const firingFreq = (physics.rpm / 60.0) * (physics.cfg.cylinders / 2.0);
      
      // Fundamental, sub-harmonic, and upper harmonic
      this.oscFundamental.frequency.setTargetAtTime(Math.max(15, firingFreq), t, 0.02);
      this.oscSub.frequency.setTargetAtTime(Math.max(10, firingFreq * 0.5), t, 0.02);
      this.oscHarmonic.frequency.setTargetAtTime(Math.max(20, firingFreq * 2.0), t, 0.02);

      // Lowpass filter cutoff opens up aggressively with throttle
      // Idle: ~350Hz, Wide Open Throttle: ~3200Hz
      const targetCutoff = 320 + Math.pow(physics.rpm / physics.cfg.redlineRpm, 1.2) * 1200 + Math.pow(physics.throttle, 1.5) * 1800;
      this.filterNode.frequency.setTargetAtTime(targetCutoff, t, 0.04);

      // Gain based on RPM and throttle
      let targetGain = 0.22 + (physics.rpm / physics.cfg.redlineRpm) * 0.25 + physics.throttle * 0.25;

      // Rev-limiter stutter cut
      if (physics.rpm >= physics.cfg.redlineRpm - 80 && physics.throttle > 0.9) {
        if (Math.sin(t * 45) > 0) {
          targetGain *= 0.1;
        }
      }

      this.engineGain.gain.setTargetAtTime(targetGain, t, 0.03);

      // 3. Turbocharger Spool Whistle
      const targetTurboSpool = (physics.rpm / physics.cfg.redlineRpm) * (0.3 + 0.7 * physics.throttle);
      this.turboSpool += (targetTurboSpool - this.turboSpool) * 0.08;
      
      this.turboOsc.frequency.setTargetAtTime(1400 + this.turboSpool * 3200, t, 0.05);
      this.turboGain.gain.setTargetAtTime(this.turboSpool * 0.08, t, 0.05);

      // 4. Blow-off Valve / Exhaust Pop Transient
      if (this.lastThrottle > 0.7 && physics.throttle < 0.2 && physics.rpm > 3500) {
        this.triggerPopOrBlowOff();
      }

      this.lastThrottle = physics.throttle;
      this.lastRpm = physics.rpm;

    } else {
      // Engine off
      this.engineGain.gain.setTargetAtTime(0.0, t, 0.08);
      this.turboGain.gain.setTargetAtTime(0.0, t, 0.05);
    }
  }

  triggerPopOrBlowOff() {
    if (!this.ctx || !this.enabled) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const popGain = this.ctx.createGain();
      popGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(popGain);
      popGain.connect(this.masterGain);

      whiteNoise.start();
    } catch (e) {
      // Ignore transient audio error
    }
  }
}

