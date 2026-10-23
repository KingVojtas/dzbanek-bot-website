// Builds the voice track and the final mix: node audio.mjs <adDir>  ->  vo.wav, mix.wav
// Needs bed.wav and sfx.wav from synth.mjs.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
const dir = process.argv[2];
const tl = JSON.parse(fs.readFileSync(path.join(dir, "timeline.json"), "utf8"));
const D = (tl.duration + 0.5).toFixed(3);
const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-v", "error", ...args], { encoding: "utf8" });

// Voice: every line at its cue, then a gentle broadcast chain and a hint of room.
const ins = tl.scenes.flatMap((s) => ["-i", path.join(dir, "vo", s.id + ".mp3")]);
const voice = tl.scenes.map((s, i) => `[${i}:a]aresample=48000,adelay=${Math.round(s.voAt * 1000)}:all=1[v${i}]`).join(";")
  + ";" + tl.scenes.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${tl.scenes.length}:normalize=0,apad,atrim=0:${D},`
  + "highpass=f=75,"
  + "equalizer=f=180:t=o:w=1:g=1.5,equalizer=f=3000:t=o:w=1.2:g=1.5,equalizer=f=7200:t=o:w=0.8:g=-3,"
  + "acompressor=threshold=-21dB:ratio=2.5:attack=8:release=160:makeup=2,"
  + "aecho=0.9:0.6:17|29|43:0.06|0.045|0.03,"
  + "aformat=channel_layouts=stereo[vo]";
ff([...ins, "-filter_complex", voice, "-map", "[vo]", "-ar", "48000", path.join(dir, "vo.wav")]);

// Mix: the bed ducks under the voice; effects sit just under it.
const graph = "[0:a]asplit[vo][sc];"
  + "[1:a]volume=-4dB[bed];[bed][sc]sidechaincompress=threshold=0.01:ratio=5:attack=50:release=700:makeup=1[duck];"
  + "[2:a]volume=-1dB[fx];"
  + "[vo][duck][fx]amix=inputs=3:normalize=0[pre]";
const pre = path.join(dir, "premix.wav");
ff(["-i", path.join(dir, "vo.wav"), "-i", path.join(dir, "bed.wav"), "-i", path.join(dir, "sfx.wav"), "-filter_complex", graph, "-map", "[pre]", "-ar", "48000", "-c:a", "pcm_f32le", pre]);

// Two-pass loudness normalisation to -16 LUFS, -1.5 dBTP. loudnorm reports on stderr.
const probe = spawnSync("ffmpeg", ["-hide_banner", "-i", pre, "-af", "loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const m = JSON.parse(probe.match(/{[^{}]*"target_offset"[^{}]*}/)[0]);
console.log("measured", m.input_i, "LUFS", m.input_tp, "dBTP");
ff(["-i", pre, "-af", `loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`, "-c:a", "pcm_s16le", path.join(dir, "mix.wav")]);
console.log("mix.wav done");
