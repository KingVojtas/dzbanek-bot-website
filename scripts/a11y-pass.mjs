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
  if (!s.includes('id="main"') && s.includes('<main')) {
    s = s.replace(/<main(\s|>)/, '<main id="main"$1');
    // avoid double id
    s = s.replace(/id="main" id="main"/g, 'id="main"');
    changed = true;
  }
  if (changed) {
    await writeFile(p, s);
    console.log('updated', f);
  }
}
