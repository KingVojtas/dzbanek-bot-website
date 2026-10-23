// Usage: node tts.mjs <outDir> <lines.json>   (VOICE, RATE env override the defaults)
// Writes <id>.mp3 plus <id>.json word timings. Retries when the service rate-limits.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "node:fs";
import path from "node:path";
const [outDir, linesFile] = process.argv.slice(2);
const lines = JSON.parse(fs.readFileSync(linesFile, "utf8"));
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const l of lines) {
  if (only && !only.includes(l.id)) continue;
  for (let attempt = 1; ; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(l.voice ?? process.env.VOICE ?? "en-US-AndrewMultilingualNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
      const dir = path.join(outDir, l.id);
      fs.mkdirSync(dir, { recursive: true });
      const f = await tts.toFile(dir, l.say, { rate: l.rate ?? process.env.RATE ?? "-6%", pitch: l.pitch ?? "+0Hz" });
      const p = typeof f === "string" ? f : f.audioFilePath;
      fs.renameSync(p, path.join(outDir, l.id + ".mp3"));
      if (f.metadataFilePath) fs.renameSync(f.metadataFilePath, path.join(outDir, l.id + ".json"));
      fs.rmSync(dir, { recursive: true, force: true });
      tts.close?.();
      console.log("ok", l.id);
      break;
    } catch (e) {
      if (attempt >= 6) throw e;
      const wait = 15000 * attempt;
      console.log(`retry ${l.id} in ${wait / 1000}s (${e.message.slice(0, 60)})`);
      await sleep(wait);
    }
  }
  await sleep(2500);
}
process.exit(0);
