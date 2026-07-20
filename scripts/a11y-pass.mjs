import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const files = (await readdir(root)).filter((f) => f.endsWith('.html'));

for (const f of files) {
  const p = join(root, f);
  let s = await readFile(p, 'utf8');
  let changed = false;
  if (!s.includes('class="skip-link"') && /<body[^>]*>/.test(s)) {
    s = s.replace(/(<body[^>]*>)/, '$1\n    <a href="#main" class="skip-link">Skip to content</a>');
    changed = true;
  }
  // Add id="main" only if main has no id at all (never create dual ids)
  if (s.includes('<main') && !/<main[^>]*\bid=/.test(s)) {
    s = s.replace(/<main(\s|>)/, '<main id="main"$1');
    changed = true;
  }
  // Repair accidental dual ids: id="main" id="foo" → keep both roles via wrapper-safe first id only
  if (/id="main"\s+id="/.test(s)) {
    s = s.replace(/id="main"\s+id="([^"]+)"/g, 'id="main" data-legacy-id="$1"');
    changed = true;
  }
  if (changed) {
    await writeFile(p, s);
    console.log('updated', f);
  }
}
