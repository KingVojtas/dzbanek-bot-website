/**
 * The EN and CS string tables, read the way the browser reads them: each
 * locale file fills window.DZBANEK_LOCALES, here a pretend window.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export function loadLocales(src) {
  const sandbox = { window: {} };
  for (const name of ['en', 'cs']) {
    vm.runInNewContext(readFileSync(join(src, 'js', 'locales', `${name}.js`), 'utf8'), sandbox);
  }
  return sandbox.window.DZBANEK_LOCALES;
}

/** Every string's dotted key, like "board.title". */
export function flatKeys(table, prefix = '') {
  return Object.entries(table).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}
