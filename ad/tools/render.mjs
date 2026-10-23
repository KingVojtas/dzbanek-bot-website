// node render.mjs <adDir> stills <t1,t2,...> [outDir]
// node render.mjs <adDir> video <out.mp4> [fps]
// node render.mjs <adDir> cues            -> cues.json (sound cues + chapter starts)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
const [dir, mode, arg, extra] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync(path.join(dir, "timeline.json"), "utf8"));
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars", "--mute-audio", "--font-render-hinting=none"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERR", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error("CONSOLE", m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((t) => { window.TIMELINE = t; }, tl);
await page.goto(pathToFileURL(path.join(dir, "ad.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(() => window.ready);
const shot = async (t, type = "png") => {
  await page.evaluate((t) => window.render(t), t);
  return page.screenshot({ type, quality: type === "jpeg" ? 92 : undefined, optimizeForSpeed: true });
};
if (mode === "stills") {
  const out = extra || path.join(dir, "stills");
  fs.mkdirSync(out, { recursive: true });
  for (const t of arg.split(",").map(Number)) fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(5, "0")}.jpg`), await shot(t, "jpeg"));
  console.log("stills written to", out);
} else if (mode === "cues") {
  const cues = await page.evaluate(() => ({ sfx: window.SFX_EVENTS, chapters: window.CHAPTERS }));
  fs.writeFileSync(path.join(dir, "cues.json"), JSON.stringify(cues, null, 1));
  console.log("sfx", cues.sfx.length, "chapters", JSON.stringify(cues.chapters));
} else if (mode === "video") {
  const FPS = Number(extra || 60);
  const n = Math.ceil(tl.duration * FPS);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p", "-r", String(FPS), arg], { stdio: ["pipe", "ignore", "inherit"] });
  const started = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await shot(i / FPS, "jpeg");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`frame ${i}/${n} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("done in", ((Date.now() - started) / 1000).toFixed(0), "s");
}
await browser.close();
