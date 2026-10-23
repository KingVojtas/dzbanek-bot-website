// Finishes the ad: node encode.mjs <adDir> [grain]
// video-120.mp4 (120 fps render) -> 30 fps with motion blur (and film grain if asked), plus mix.wav
// -> dzbanek-ad-1080.mp4 and dzbanek-ad-720.mp4, ready for assets/ad/.
import path from "node:path";
import { execFileSync } from "node:child_process";
const [dir, grainArg] = process.argv.slice(2);
// No grain by default: on a big screen it read as noise over the photo.
const grain = Number(grainArg ?? 0);
const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-v", "error", ...args], { stdio: "inherit" });
const p = (f) => path.join(dir, f);

// Each 30 fps frame blends two 120 fps frames, 1/120 s apart: the blur of a 180° shutter,
// with the samples close enough that fast moves smear instead of doubling.
// The render comes in as full-range JPEG frames; the web files are standard TV range.
const look = `tmix=frames=2:weights='1 1',fps=30` + (grain > 0 ? `,noise=c0s=${grain}:c0f=t+u` : '');
ff(["-i", p("video-120.mp4"), "-vf", `${look},scale=in_range=pc:out_range=tv,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-an", p("master-30.mp4")]);

for (const [name, w, h, crf] of [["dzbanek-ad-1080.mp4", 1920, 1080, 23], ["dzbanek-ad-720.mp4", 1280, 720, 24]]) {
  const scale = w === 1920 ? "null" : `scale=${w}:${h}:flags=lanczos`;
  ff(["-i", p("master-30.mp4"), "-i", p("mix.wav"), "-map", "0:v:0", "-map", "1:a:0", "-vf", scale,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest", "-movflags", "+faststart", p(name)]);
  console.log("wrote", name);
}
