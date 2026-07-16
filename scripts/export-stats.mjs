/**
 * Export live bot stats → data/stats.json for the public website.
 *
 * Usage (bot must be running):
 *   node scripts/export-stats.mjs
 *   node scripts/export-stats.mjs http://127.0.0.1:3848
 *
 * Then commit and push data/stats.json so friends see updated numbers on
 * https://dzbanek-bot.vojtas.io / GitHub Pages.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'data', 'stats.json');
const apiBase = (process.argv[2] || 'http://127.0.0.1:3848').replace(/\/$/, '');

const res = await fetch(`${apiBase}/api/stats`);
if (!res.ok) {
  console.error(`Failed to fetch ${apiBase}/api/stats → HTTP ${res.status}`);
  process.exit(1);
}

const raw = await res.json();
const payload = {
  servers: raw.servers ?? raw.serverCount ?? null,
  approxUsers: raw.approxUsers ?? raw.userCount ?? raw.users ?? null,
  totalPlays: raw.totalPlays ?? raw.plays ?? null,
  totalSkips: raw.totalSkips ?? raw.skips ?? null,
  totalWishlistAdds: raw.totalWishlistAdds ?? raw.wishlistAdds ?? null,
  uniqueUsersTracked: raw.uniqueUsersTracked ?? raw.trackedUsers ?? null,
  // Do not export process uptime (misleading in a static snapshot)
  uptimeSec: null,
  generatedAt: raw.generatedAt || new Date().toISOString(),
  history: Array.isArray(raw.history) ? raw.history : [],
  source: 'snapshot',
  note: 'Public snapshot for static hosting. Refresh with: node scripts/export-stats.mjs',
};

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outFile}`);
console.log(
  `servers=${payload.servers} users=${payload.approxUsers} plays=${payload.totalPlays} at ${payload.generatedAt}`,
);
console.log('Commit and push data/stats.json to update the live website.');
