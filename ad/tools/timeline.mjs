// Places each voice line in its scene and records every word's absolute time:
// node timeline.mjs <adDir>  ->  timeline.json, captions-en.vtt
// lead = gap before the line starts in its scene; tail = gap after it ends (time for visuals to land).
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
const lines = JSON.parse(fs.readFileSync(path.join(dir, "lines.json"), "utf8"));
const LEAD = { kitchen: 1.2, intro: 0.35, music: 0.7, radio: 0.35, board: 0.4, deals: 0.35, welcome: 0.45, chair: 0.6 };
const TAIL = { kitchen: 0.25, intro: 0.85, music: 0.55, radio: 0.55, board: 0.55, deals: 0.5, welcome: 0.55, chair: 2.6 };
const show = (w) => w.replace(/Dzbahnek/g, "Dzbanek");
let t = 0;
const scenes = [];
for (const l of lines) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "vo", l.id + ".json"), "utf8")).Metadata;
  const lead = LEAD[l.id] ?? 0.5;
  const words = meta.filter((m) => m.Type === "WordBoundary").map((m) => ({
    w: show(m.Data.text.Text),
    s: +(t + lead + m.Data.Offset / 1e7).toFixed(3),
    e: +(t + lead + (m.Data.Offset + m.Data.Duration) / 1e7).toFixed(3),
  }));
  const end = words.at(-1).e + (TAIL[l.id] ?? 0.6);
  scenes.push({ id: l.id, start: +t.toFixed(3), voAt: +(t + lead).toFixed(3), end: +end.toFixed(3), text: show(l.say), words });
  t = end;
}
const duration = +t.toFixed(3);
fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify({ duration, scenes }, null, 1));
// Captions: one cue per sentence, split at the punctuation in the script.
const vtt = (x) => { const ms = Math.round(x * 1000); return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`; };
// Captions show what you'd type or read, not how it's said.
const written = (x) => x.replace(/slash play/gi, "/play").replace(/three thirty-three/gi, "3:33");
const cues = [];
for (const s of scenes) {
  const sentences = s.text.match(/[^.?!]+[.?!]+/g).map((x) => x.trim());
  let wi = 0;
  for (const sentence of sentences) {
    const n = sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    const ws = s.words.slice(wi, wi + n);
    wi += n;
    cues.push({ from: ws[0].s, to: ws.at(-1).e + 0.25, text: written(sentence) });
  }
}
fs.writeFileSync(path.join(dir, "captions-en.vtt"), "WEBVTT\n\n" + cues.map((c) => `${vtt(c.from)} --> ${vtt(c.to)}\n${c.text}\n`).join("\n"));
console.log("duration", duration);
for (const s of scenes) console.log(s.id.padEnd(8), "start", s.start, "vo", s.voAt, "end", s.end);
