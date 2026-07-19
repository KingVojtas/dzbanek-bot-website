/**
 * Bump common asset query strings across all HTML pages.
 * Usage: node scripts/bump-assets.mjs 20260720c
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const v = process.argv[2] || '20260720c';
const root = join(import.meta.dirname, '..');
const files = (await readdir(root)).filter((f) => f.endsWith('.html'));

const patterns = [
  [/css\/site\.css\?v=[^"']+/g, `css/site.css?v=${v}`],
  [/js\/theme-boot\.js\?v=[^"']+/g, `js/theme-boot.js?v=${v}`],
  [/js\/theme\.js\?v=[^"']+/g, `js/theme.js?v=${v}`],
  [/js\/locales\/en\.js\?v=[^"']+/g, `js/locales/en.js?v=${v}`],
  [/js\/locales\/cs\.js\?v=[^"']+/g, `js/locales/cs.js?v=${v}`],
  [/js\/locales\/en\.js"/g, `js/locales/en.js?v=${v}"`],
  [/js\/locales\/cs\.js"/g, `js/locales/cs.js?v=${v}"`],
  [/js\/config\.js\?v=[^"']+/g, `js/config.js?v=${v}`],
  [/js\/i18n\.js\?v=[^"']+/g, `js/i18n.js?v=${v}`],
  [/js\/site\.js\?v=[^"']+/g, `js/site.js?v=${v}`],
  [/js\/site\.js"/g, `js/site.js?v=${v}"`],
  [/js\/i18n\.js"/g, `js/i18n.js?v=${v}"`],
  [/js\/config\.js"/g, `js/config.js?v=${v}"`],
];

for (const f of files) {
  const p = join(root, f);
  let s = await readFile(p, 'utf8');
  const before = s;
  for (const [re, rep] of patterns) s = s.replace(re, rep);
  if (s !== before) {
    await writeFile(p, s);
    console.log('updated', f);
  } else {
    console.log('skip', f);
  }
}
console.log('done', v);
