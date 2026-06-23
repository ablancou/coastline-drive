import { VEHICLE_CONFIG } from "@/game/constants/vehicle";

/**
 * Procedural engine + tire/wind audio via the Web Audio API — zero sample files.
 * Built as a lazy singleton: the AudioContext is only created after a user
 * gesture (browser autoplay policy), then driven from telemetry each frame.
 */
interface EngineAudioGraph {
  ctx: AudioContext;
  master: GainNode;
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  sub: OscillatorNode;
  engineGain: GainNode;
  lowpass: BiquadFilterNode;
  tireGain: GainNode;
  windGain: GainNode;
  musicGain: GainNode;
  musicOscs: OscillatorNode[];
  noise: AudioBuffer;
}

const cfg = VEHICLE_CONFIG;
// Inline-6 firing order feel: firing freq = rpm/60 * cylinders/2.
const FIRING_FACTOR = 3;

let graph: EngineAudioGraph | null = null;
let running = false;
let muted = false;
let musicMuted = false;
let chordIdx = -1;
let nextChordAt = 0;

// Slow chord pad progression (low triads, Hz).
const CHORDS: number[][] = [
  [110.0, 164.81, 220.0], // Am
  [87.31, 130.81, 174.61], // F
  [130.81, 196.0, 261.63], // C
  [98.0, 146.83, 196.0], // G
];

// Smoothed targets (updated each frame, ramped on the audio thread).
let curFreq = 40;

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function build(): EngineAudioGraph {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctor();

  const master = new GainNode(ctx, { gain: 0.0 });
  master.connect(ctx.destination);

  // --- Engine: two detuned saws + a sub, shaped by a throttle-opening lowpass.
  const lowpass = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: 600,
    Q: 6,
  });
  const engineGain = new GainNode(ctx, { gain: 0.12 });
  lowpass.connect(engineGain).connect(master);

  const oscA = new OscillatorNode(ctx, { type: "sawtooth", frequency: 40 });
  const oscB = new OscillatorNode(ctx, {
    type: "sawtooth",
    frequency: 80,
    detune: 8,
  });
  const sub = new OscillatorNode(ctx, { type: "triangle", frequency: 40 });
  oscA.connect(lowpass);
  oscB.connect(lowpass);
  sub.connect(engineGain);
  oscA.start();
  oscB.start();
  sub.start();

  // --- Tire/road + wind: filtered looping noise.
  const noise = makeNoiseBuffer(ctx);

  const tireSrc = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  const tireBand = new BiquadFilterNode(ctx, {
    type: "bandpass",
    frequency: 1400,
    Q: 1.2,
  });
  const tireGain = new GainNode(ctx, { gain: 0 });
  tireSrc.connect(tireBand).connect(tireGain).connect(master);
  tireSrc.start();

  const windSrc = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  const windLp = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: 500,
    Q: 0.7,
  });
  const windGain = new GainNode(ctx, { gain: 0 });
  windSrc.connect(windLp).connect(windGain).connect(master);
  windSrc.start();

  // Ambient ocean wash: filtered noise with a slow LFO swelling the gain.
  const waveSrc = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  const waveLp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 360, Q: 0.6 });
  const waveGain = new GainNode(ctx, { gain: 0.05 });
  waveSrc.connect(waveLp).connect(waveGain).connect(master);
  waveSrc.start();
  const lfo = new OscillatorNode(ctx, { type: "sine", frequency: 0.12 });
  const lfoGain = new GainNode(ctx, { gain: 0.035 });
  lfo.connect(lfoGain).connect(waveGain.gain);
  lfo.start();

  // --- Generative music: a soft 3-voice chord pad through a warm lowpass.
  const musicLp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 700, Q: 0.5 });
  const musicGain = new GainNode(ctx, { gain: musicMuted ? 0 : 0.06 });
  musicLp.connect(musicGain).connect(master);
  const musicOscs = [0, 1, 2].map((i) => {
    const o = new OscillatorNode(ctx, { type: "triangle", frequency: 110 + i * 50 });
    o.connect(musicLp);
    o.start();
    return o;
  });

  return {
    ctx,
    master,
    oscA,
    oscB,
    sub,
    engineGain,
    lowpass,
    tireGain,
    windGain,
    musicGain,
    musicOscs,
    noise,
  };
}

export function startEngineAudio(): void {
  try {
    if (!graph) graph = build();
    void graph.ctx.resume();
    running = true;
    // Fade master in.
    const now = graph.ctx.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setTargetAtTime(muted ? 0 : 0.5, now, 0.3);
  } catch {
    running = false;
  }
}

export function pauseEngineAudio(): void {
  if (!graph) return;
  running = false;
  const now = graph.ctx.currentTime;
  graph.master.gain.setTargetAtTime(0, now, 0.15);
  // Suspend slightly after the fade so it doesn't click.
  window.setTimeout(() => {
    if (!running && graph) void graph.ctx.suspend();
  }, 250);
}

export function isEngineAudioRunning(): boolean {
  return running && !!graph;
}

/**
 * One-shot collision sound — a filtered noise burst (scrape/crash) plus a low
 * body thud. `intensity` 0..1 scales loudness and brightness.
 */
export function playImpact(intensity: number): void {
  if (!graph || !running) return;
  const g = graph;
  const t = g.ctx.currentTime;
  const vol = Math.min(0.9, Math.max(0.12, intensity));

  // Crash/scrape: noise burst through a band/lowpass with a fast decay.
  const src = new AudioBufferSourceNode(g.ctx, { buffer: g.noise });
  const filt = new BiquadFilterNode(g.ctx, {
    type: "lowpass",
    frequency: 900 + intensity * 2600,
    Q: 1,
  });
  const env = new GainNode(g.ctx, { gain: 0 });
  src.connect(filt).connect(env).connect(g.master);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0008, t + 0.32);
  src.start(t);
  src.stop(t + 0.36);

  // Body thud: low triangle with a quick pitch drop.
  const thud = new OscillatorNode(g.ctx, { type: "triangle", frequency: 90 });
  const thudGain = new GainNode(g.ctx, { gain: 0 });
  thud.connect(thudGain).connect(g.master);
  thud.frequency.setValueAtTime(90, t);
  thud.frequency.exponentialRampToValueAtTime(38, t + 0.18);
  thudGain.gain.setValueAtTime(0.0001, t);
  thudGain.gain.exponentialRampToValueAtTime(vol * 0.8, t + 0.01);
  thudGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.25);
  thud.start(t);
  thud.stop(t + 0.28);
}

export function setEngineAudioMuted(value: boolean): void {
  muted = value;
  if (!graph) return;
  const now = graph.ctx.currentTime;
  graph.master.gain.setTargetAtTime(muted ? 0 : 0.5, now, 0.1);
}

export function toggleEngineAudioMuted(): boolean {
  setEngineAudioMuted(!muted);
  return muted;
}

export function toggleMusic(): boolean {
  musicMuted = !musicMuted;
  if (graph) graph.musicGain.gain.setTargetAtTime(musicMuted ? 0 : 0.06, graph.ctx.currentTime, 0.4);
  return musicMuted;
}

/** Advance the chord pad over time. Called each frame. */
export function updateMusic(): void {
  if (!graph || !running) return;
  const t = graph.ctx.currentTime;
  if (t < nextChordAt) return;
  nextChordAt = t + 5.5;
  chordIdx = (chordIdx + 1) % CHORDS.length;
  const chord = CHORDS[chordIdx]!;
  graph.musicOscs.forEach((o, i) => {
    o.frequency.setTargetAtTime(chord[i] ?? 110, t, 0.6);
  });
}

/**
 * Drive the audio from telemetry. Called every frame from inside the Canvas.
 * All ramps happen on the audio thread for click-free, smooth response.
 */
export function updateEngineAudio(
  rpm: number,
  speedKmh: number,
  throttle: number,
  handbrake: boolean,
  steerAbs: number,
  slipAbs = 0,
): void {
  if (!graph || !running) return;
  const g = graph;
  const t = g.ctx.currentTime;

  const safeRpm = Number.isFinite(rpm) ? rpm : cfg.idleRpm;
  const safeSpeed = Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  const thr = Number.isFinite(throttle) ? Math.min(1, Math.max(0, throttle)) : 0;
  const steer = Number.isFinite(steerAbs) ? Math.min(1, Math.abs(steerAbs)) : 0;

  // Gearbox feel: rev rises within a gear, then drops on the up-shift.
  const GEARS = [14, 30, 46, 64, 86, 999]; // upper speed (km/h) of each gear
  let gear = 0;
  while (gear < GEARS.length - 1 && safeSpeed > GEARS[gear]!) gear++;
  const gearLo = gear === 0 ? 0 : GEARS[gear - 1]!;
  const gearHi = GEARS[gear]!;
  const rev = Math.min(1, Math.max(0, (safeSpeed - gearLo) / (gearHi - gearLo)));
  // Idle floor + per-gear rev sweep + a little from throttle (load growl).
  const baseHz = 44 + rev * 150 + thr * 22;
  const targetFreq = Number.isFinite(baseHz) ? baseHz : 45;
  curFreq += (targetFreq - curFreq) * 0.22;
  g.oscA.frequency.setTargetAtTime(curFreq, t, 0.03);
  g.oscB.frequency.setTargetAtTime(curFreq * 2, t, 0.03);
  g.sub.frequency.setTargetAtTime(curFreq * 0.5, t, 0.05);

  // Throttle opens the filter (brighter under load) and lifts engine gain.
  const rpmNorm = Math.min(1, safeRpm / cfg.maxRpm);
  g.lowpass.frequency.setTargetAtTime(500 + rpmNorm * 3200 + thr * 1600, t, 0.05);
  g.engineGain.gain.setTargetAtTime(0.1 + thr * 0.14, t, 0.08);

  // Wind grows with speed; tire roll + screech with speed and cornering/handbrake.
  const speedNorm = Math.min(1, safeSpeed / 220);
  g.windGain.gain.setTargetAtTime(speedNorm * 0.18, t, 0.1);

  const slip = Number.isFinite(slipAbs) ? Math.min(1, Math.abs(slipAbs) * 2.6) : 0;
  const screech = (handbrake ? 0.45 : 0) + steer * speedNorm * 0.35 + slip * speedNorm * 0.8;
  const tireBase = speedNorm * 0.06;
  g.tireGain.gain.setTargetAtTime(tireBase + screech * speedNorm * 0.3, t, 0.06);
}
