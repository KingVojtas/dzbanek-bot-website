// node sheet.mjs <out.jpg> <cols> <width> <img...>  -> one contact sheet
import { execFileSync } from "node:child_process";
const [out, cols, width, ...files] = process.argv.slice(2);
const c = Number(cols), w = Number(width), rows = Math.ceil(files.length / c);
const ins = files.flatMap((f) => ["-i", f]);
const pads = rows * c - files.length;
let g = files.map((_, i) => `[${i}:v]scale=${w}:-2[s${i}]`).join(";");
for (let p = 0; p < pads; p++) g += `;color=black:s=${w}x${Math.round(w * 9 / 16)}:d=1[p${p}]`;
const cells = [...files.map((_, i) => `[s${i}]`), ...Array.from({ length: pads }, (_, p) => `[p${p}]`)];
const rowLabels = [];
for (let r = 0; r < rows; r++) { g += `;${cells.slice(r * c, r * c + c).join("")}hstack=${c}[r${r}]`; rowLabels.push(`[r${r}]`); }
g += rows > 1 ? `;${rowLabels.join("")}vstack=${rows}[out]` : `;[r0]copy[out]`;
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", g, "-map", "[out]", "-frames:v", "1", "-q:v", "3", out]);
console.log("sheet", out);
