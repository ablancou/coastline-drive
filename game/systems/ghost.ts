/**
 * Ghost-lap recording + playback data. A ghost is your best run on a track,
 * stored as a flat sample list [tMs, x, z, yaw, ...] captured at a fixed rate
 * and replayed on later attempts so you're always racing your own best self.
 *
 * Module-level mutable state (no React) — written from the physics/frame loops.
 */

const STORAGE_PREFIX = "coastline-drive:ghost:";
/** Samples per second — 12 Hz is plenty; playback interpolates between them. */
const SAMPLE_HZ = 12;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;
/** Values per sample: time, x, z, yaw. */
const STRIDE = 4;
/** Hard cap (~8 minutes) so a parked car can never grow the buffer forever. */
const MAX_SAMPLES = SAMPLE_HZ * 60 * 8;

export interface GhostData {
  /** Flat [tMs, x, z, yaw] samples, ascending in time. */
  samples: number[];
  /** Total run time in ms. */
  totalMs: number;
}

/** Sector boundaries as road progress (t). Three sectors per sprint. */
export const SECTOR_TS = [0.33, 0.66] as const;

// --- Recording -------------------------------------------------------------

let recording: number[] = [];
let recordingActive = false;
let nextSampleAt = 0;

export function startGhostRecording(): void {
  recording = [];
  recordingActive = true;
  nextSampleAt = 0;
}

export function stopGhostRecording(): void {
  recordingActive = false;
}

/** Called each frame with the run's elapsed time; samples at a fixed rate. */
export function recordGhostSample(
  elapsedMs: number,
  x: number,
  z: number,
  yaw: number,
): void {
  if (!recordingActive) return;
  if (elapsedMs < nextSampleAt) return;
  if (recording.length >= MAX_SAMPLES * STRIDE) return;
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(yaw)) return;
  nextSampleAt = elapsedMs + SAMPLE_INTERVAL_MS;
  recording.push(
    Math.round(elapsedMs),
    Math.round(x * 10) / 10,
    Math.round(z * 10) / 10,
    Math.round(yaw * 1000) / 1000,
  );
}

/**
 * Persist the just-recorded run as this track's ghost. Call only when the run
 * is a new personal best. Returns the stored ghost (also becomes the active
 * playback ghost on the next run).
 */
export function saveGhostRun(trackId: string, totalMs: number): GhostData | null {
  if (recording.length < STRIDE * 4) return null;
  const data: GhostData = { samples: recording.slice(), totalMs };
  try {
    window.localStorage.setItem(STORAGE_PREFIX + trackId, JSON.stringify(data));
  } catch {
    /* quota / privacy mode — the ghost just won't persist */
  }
  return data;
}

export function loadGhost(trackId: string): GhostData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + trackId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GhostData;
    if (!Array.isArray(parsed?.samples) || parsed.samples.length < STRIDE * 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

// --- Playback --------------------------------------------------------------

export interface GhostPose {
  x: number;
  z: number;
  yaw: number;
  /** False once the ghost has finished its run (it parks at the line). */
  running: boolean;
}

/**
 * Sample a ghost at `elapsedMs`, interpolating between recorded frames.
 * `cursor` is a caller-held index hint so playback stays O(1) per frame.
 */
export function sampleGhost(
  ghost: GhostData,
  elapsedMs: number,
  out: GhostPose,
  cursor: { i: number },
): GhostPose {
  const s = ghost.samples;
  const last = s.length - STRIDE;

  // Advance the cursor to the segment containing elapsedMs (monotonic playback).
  let i = Math.min(Math.max(cursor.i, 0), last);
  while (i < last && s[i + STRIDE]! <= elapsedMs) i += STRIDE;
  while (i > 0 && s[i]! > elapsedMs) i -= STRIDE;
  cursor.i = i;

  const t0 = s[i]!;
  if (i >= last) {
    out.x = s[last + 1]!;
    out.z = s[last + 2]!;
    out.yaw = s[last + 3]!;
    out.running = false;
    return out;
  }

  const t1 = s[i + STRIDE]!;
  const span = t1 - t0;
  const k = span > 0 ? Math.min(1, Math.max(0, (elapsedMs - t0) / span)) : 0;

  const x0 = s[i + 1]!;
  const z0 = s[i + 2]!;
  const y0 = s[i + 3]!;
  const x1 = s[i + STRIDE + 1]!;
  const z1 = s[i + STRIDE + 2]!;
  let y1 = s[i + STRIDE + 3]!;

  // Shortest-arc yaw interpolation (headings wrap at ±π).
  let dy = y1 - y0;
  if (dy > Math.PI) dy -= Math.PI * 2;
  else if (dy < -Math.PI) dy += Math.PI * 2;
  y1 = y0 + dy;

  out.x = x0 + (x1 - x0) * k;
  out.z = z0 + (z1 - z0) * k;
  out.yaw = y0 + (y1 - y0) * k;
  out.running = true;
  return out;
}
