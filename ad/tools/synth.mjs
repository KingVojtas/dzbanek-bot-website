// Renders the music bed and the sound effects for the ad, sample by sample.
// node synth.mjs <adDir>  ->  bed.wav, sfx.wav (48 kHz, stereo, 32-bit float)
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const tl = JSON.parse(fs.readFileSync(path.join(dir, "timeline.json"), "utf8"));
const cues = JSON.parse(fs.readFileSync(path.join(dir, "cues.json"), "utf8"));
const SR = 48000;
const DUR = tl.duration + 0.5;
const N = Math.ceil(DUR * SR);
const scene = Object.fromEntries(tl.scenes.map((s) => [s.id, s]));

// Seeded random, so every render sounds the same.
let seed = 20261023;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function writeWav(file, L, R) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 8);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 8, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { buf.writeFloatLE(L[i], 44 + i * 8); buf.writeFloatLE(R[i], 48 + i * 8); }
  fs.writeFileSync(file, buf);
}

// RBJ biquad, used for the drum and noise colours.
function biquad(type, f, q) {
  const w = TAU * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else { b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}

/* ---------------- music ---------------- */
const L = new Float32Array(N), R = new Float32Array(N);
const add = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

const BPM = 82, BEAT = 60 / BPM, BAR = BEAT * 4;
// ii-V-I-vi in C, with the colour notes a lo-fi player would reach for.
const CHORDS = [
  { root: 38, notes: [53, 57, 60, 64, 67] }, // Dm9  (F A C E G)
  { root: 43, notes: [53, 57, 59, 64, 67] }, // G13  (F A B E G)
  { root: 36, notes: [52, 55, 59, 62, 64] }, // Cmaj9 (E G B D E)
  { root: 45, notes: [52, 55, 60, 64, 67] }, // Am9  (E G C E G)
];
const drumsIn = scene.music.start - BEAT;
const drumsOut = scene.chair.start + 0.3;
const lastChordAt = Math.floor((scene.chair.start + 0.6) / BAR) * BAR + BAR;

// FM electric piano: carrier and modulator at 1:1, with a short bright tine at the attack.
function rhodes(at, midi, vel, len, pan) {
  const f = mtof(midi);
  const start = Math.floor(at * SR), n = Math.floor((len + 2.2) * SR);
  const detune = 1.0016;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const rel = t > len ? Math.exp(-(t - len) / 0.35) : 1;
    const env = Math.min(1, t / 0.004) * (0.55 * Math.exp(-t / 0.55) + 0.45 * Math.exp(-t / 3.2)) * rel;
    const idx = 1.6 * Math.exp(-t / 0.35) + 0.25;
    const a = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t));
    const b = Math.sin(TAU * f * detune * t + idx * Math.sin(TAU * f * detune * t));
    const tine = Math.sin(TAU * f * 7.02 * t) * Math.exp(-t / 0.03) * 0.18;
    const trem = 1 - 0.18 * (0.5 + 0.5 * Math.sin(TAU * 4.6 * (at + t)));
    const v = (a * 0.55 + b * 0.45 + tine) * env * vel * trem * 0.11;
    const p = pan + 0.25 * Math.sin(TAU * 0.35 * (at + t));
    add(start + k, v * (1 - Math.max(0, p)), v * (1 + Math.min(0, p)));
  }
}

function bass(at, midi, vel, len) {
  const f = mtof(midi), start = Math.floor(at * SR), n = Math.floor((len + 0.4) * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.008) * Math.exp(-t / 0.9) * (t > len ? Math.exp(-(t - len) / 0.08) : 1);
    const v = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t) + 0.08 * Math.sin(TAU * 3 * f * t)) * env * vel * 0.2;
    add(start + k, v, v);
  }
}

function kick(at, vel) {
  const start = Math.floor(at * SR), n = Math.floor(0.45 * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = 46 + 70 * Math.exp(-t / 0.035);
    ph += TAU * f / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.22) * vel * 0.32 + (rnd() - 0.5) * Math.exp(-t / 0.003) * 0.05 * vel;
    add(start + k, v, v);
  }
}

function brush(at, vel, pan) {
  const start = Math.floor(at * SR), n = Math.floor(0.32 * SR);
  const bp = biquad("bp", 2600, 0.7), hp = biquad("hp", 900, 0.7);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.012) * Math.exp(-t / 0.11);
    const v = hp(bp(rnd() * 2 - 1)) * env * vel * 0.22;
    add(start + k, v * (1 - pan), v * (1 + pan));
  }
}

function shaker(at, vel) {
  const start = Math.floor(at * SR), n = Math.floor(0.08 * SR);
  const hp = biquad("hp", 6500, 0.7);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const v = hp(rnd() * 2 - 1) * Math.min(1, t / 0.004) * Math.exp(-t / 0.022) * vel * 0.07;
    add(start + k, v * 0.8, v);
  }
}

const bars = Math.ceil(DUR / BAR);
for (let b = 0; b < bars; b++) {
  const at = b * BAR;
  if (at > lastChordAt) break;
  const ch = CHORDS[b % 4];
  const final = at >= lastChordAt - 0.01;
  // Chord on the one, slightly rolled like a real hand; a lighter re-hit on the "and" of two.
  ch.notes.forEach((m, i) => rhodes(at + i * 0.012 + rnd() * 0.006, m, 0.75 + rnd() * 0.15, final ? 4 : BEAT * 2.2, (i / (ch.notes.length - 1) - 0.5) * 0.5));
  if (!final) ch.notes.slice(1, 4).forEach((m, i) => rhodes(at + BEAT * 2.5 + i * 0.01, m, 0.4 + rnd() * 0.1, BEAT * 1.2, (i - 1) * 0.2));
  const drums = at + BEAT >= drumsIn && at < drumsOut;
  if (at >= drumsIn - BAR && at < drumsOut) {
    bass(at, ch.root, 0.9, BEAT * 1.6);
    bass(at + BEAT * 2.5, ch.root + (b % 2 ? 7 : 12), 0.6, BEAT * 1.2);
  }
  if (drums) {
    const swing = (i) => (i % 2 ? BEAT * 0.58 : 0) + Math.floor(i / 2) * BEAT;
    for (let i = 0; i < 8; i++) {
      const t8 = at + swing(i);
      if (t8 < drumsIn || t8 > drumsOut) continue;
      shaker(t8, i % 2 ? 0.6 : 1);
    }
    for (const k of [0, BEAT * 2, BEAT * 2.58]) if (at + k >= drumsIn && at + k < drumsOut) kick(at + k, k === BEAT * 2.58 ? 0.45 : 0.85);
    for (const s of [BEAT, BEAT * 3]) if (at + s >= drumsIn && at + s < drumsOut) brush(at + s, 0.9, 0.1);
  }
}
// The last chord gets its root too, held under the ring-out.
bass(lastChordAt, CHORDS[Math.round(lastChordAt / BAR) % 4].root, 0.7, 3);

// Vinyl: a quiet bed of hiss and the odd crackle.
{
  const lp = biquad("lp", 4000, 0.7), hp = biquad("hp", 300, 0.7);
  for (let i = 0; i < N; i++) {
    let v = hp(lp(rnd() * 2 - 1)) * 0.004;
    if (rnd() < 0.00045) v += (rnd() - 0.5) * 0.12;
    L[i] += v; R[i] += v * 0.9;
  }
}

// Tape: soft saturation and a gentle roll-off, then fades at both ends.
{
  const lpL = biquad("lp", 7000, 0.6), lpR = biquad("lp", 7000, 0.6);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 1.5) * Math.min(1, Math.max(0, (DUR - 0.3 - t) / 2.5));
    L[i] = Math.tanh(lpL(L[i]) * 1.6) / 1.6 * fade;
    R[i] = Math.tanh(lpR(R[i]) * 1.6) / 1.6 * fade;
  }
}
writeWav(path.join(dir, "bed.wav"), L, R);

/* ---------------- sound effects ---------------- */
const SL = new Float32Array(N), SR_ = new Float32Array(N);
const sadd = (i, l, r) => { if (i >= 0 && i < N) { SL[i] += l; SR_[i] += r; } };

function keyTick(at, vel, deep = false) {
  const start = Math.floor(at * SR), n = Math.floor(0.05 * SR);
  const bp = biquad("bp", (deep ? 1400 : 2200) + rnd() * 1200, 1.2);
  const body = (deep ? 140 : 190) + rnd() * 40;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const v = (bp(rnd() * 2 - 1) * Math.exp(-t / 0.006) * 0.8 + Math.sin(TAU * body * t) * Math.exp(-t / 0.012) * 0.35) * vel;
    sadd(start + k, v * 0.9, v);
  }
}
function mouse(at) {
  keyTick(at, 0.34);
  keyTick(at + 0.075, 0.17);
}
function tone(at, f0, f1, len, vel) {
  const start = Math.floor(at * SR), n = Math.floor(len * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.03);
    ph += TAU * f / SR;
    const v = (Math.sin(ph) + 0.15 * Math.sin(2 * ph)) * Math.min(1, t / 0.003) * Math.exp(-t / (len / 3)) * vel;
    sadd(start + k, v, v);
  }
}
function whoosh(at) {
  const start = Math.floor(at * SR), len = 0.9, n = Math.floor(len * SR);
  const bp = biquad("bp", 800, 0.8);
  for (let k = 0; k < n; k++) {
    const t = k / SR, x = t / len;
    const env = Math.sin(Math.PI * x) ** 2;
    const v = bp(rnd() * 2 - 1) * env * 0.35;
    sadd(start + k, v * (1 - x * 0.4), v * (0.6 + x * 0.4));
  }
}
for (const [at, kind] of cues.sfx) {
  const v = 0.75 + rnd() * 0.25;
  if (kind === "key") keyTick(at, 0.24 * v);
  else if (kind === "enter") keyTick(at, 0.5, true);
  else if (kind === "click") mouse(at);
  else if (kind === "msg") { tone(at, 620, 930, 0.18, 0.09); }
  else if (kind === "join") { tone(at, 523, 523, 0.3, 0.08); tone(at + 0.1, 784, 784, 0.35, 0.08); }
  else if (kind === "pop") tone(at, 380, 880, 0.09, 0.065 * v);
  else if (kind === "whoosh") whoosh(at);
}
writeWav(path.join(dir, "sfx.wav"), SL, SR_);
console.log("bed.wav and sfx.wav,", DUR.toFixed(2), "s");
