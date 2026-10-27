/**
 * Checks the built site in dist/. Node only — no packages.
 * Runs at the end of scripts/build.mjs, so a failure stops the Pages deploy.
 * Usage on its own: node scripts/check.mjs
 *
 * Errors: a string in one locale but not the other, a data-i18n key or a
 * script's string key with no English, a link to a file or #id that isn't there, command
 * counts on commands.html that don't add up.
 * Warning: the bot has a newer change than the home page's "What's cooking".
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { flatKeys, loadLocales } from './locales.mjs';

const FILE_LIKE = /\.(html|js|css|json|jpe?g|png|webp|svg|mp3|mp4|vtt|woff2?)$/i;

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'assets' ? [] : htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const ids = new Map();
function idsOf(file) {
  if (!ids.has(file)) {
    const html = readFileSync(file, 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return ids.get(file);
}

function urlsOf(html) {
  const urls = [...html.matchAll(/\s(?:href|src|poster)="([^"]*)"/g)].map((match) => match[1]);
  for (const [, list] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    urls.push(...list.split(',').map((entry) => entry.trim().split(/\s+/)[0]));
  }
  return urls;
}

export function check({ root, dist, siteUrl, newestBotDate }) {
  const errors = [];
  const warnings = [];
  const src = join(root, 'src');
  const locales = loadLocales(src);
  const en = new Set(flatKeys(locales.en));
  const cs = new Set(flatKeys(locales.cs));

  // Both languages have the same strings.
  for (const key of en) if (!cs.has(key)) errors.push(`cs.js is missing "${key}"`);
  for (const key of cs) if (!en.has(key)) errors.push(`en.js is missing "${key}" (it is only in cs.js)`);

  // Every key the pages use has a string.
  const pages = htmlFiles(dist);
  const rel = (file) => relative(dist, file).split(sep).join('/');
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    for (const [, key] of html.matchAll(/\sdata-i18n(?:-aria|-alt|-placeholder)?="([^"]+)"/g)) {
      if (!en.has(key)) errors.push(`${rel(file)} uses "${key}", which en.js doesn't have`);
    }
  }

  // Keys the scripts look up, like ui('demo.topic', …) or ['demo.station', 'Station'].
  const tops = new Set(Object.keys(locales.en));
  const scripts = readdirSync(join(src, 'js')).filter((name) => name.endsWith('.js'));
  for (const name of scripts) {
    const code = readFileSync(join(src, 'js', name), 'utf8');
    // A prefix that gets a name added on ('clock.ev.' + id) ends in a dot and is skipped.
    for (const [, key] of code.matchAll(/['"`]([a-z][A-Za-z]*\.[A-Za-z0-9_.]*[A-Za-z0-9_])['"`]/g)) {
      if (!tops.has(key.split('.')[0]) || FILE_LIKE.test(key)) continue;
      if (!en.has(key)) errors.push(`js/${name} looks up "${key}", which en.js doesn't have`);
      else if (!cs.has(key)) errors.push(`js/${name} looks up "${key}", which cs.js doesn't have`);
    }
  }

  // Links and files inside the site, and #ids on the page they point at.
  const base = new URL(siteUrl).pathname;
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    for (const url of new Set(urlsOf(html))) {
      if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) continue;
      const [path, hash] = url.split('#');
      let target = file;
      if (path) {
        const clean = path.split('?')[0];
        target = clean.startsWith('/')
          ? join(dist, clean.startsWith(base) ? clean.slice(base.length) : clean)
          : join(dirname(file), clean);
        if (clean.endsWith('/') || clean === '.' || clean === '..') target = join(target, 'index.html');
        if (!existsSync(target)) {
          errors.push(`${rel(file)} links to ${url}, which isn't there`);
          continue;
        }
      }
      if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
        errors.push(`${rel(file)} links to ${url}, but there's no id="${hash}"`);
      }
    }
  }

  // The command counts on commands.html: each shelf button matches its shelf, they add up to the
  // "All N of them" in both languages, and to the demo's menu, which lists every command.
  const commandsPage = join(dist, 'commands.html');
  if (existsSync(commandsPage)) {
    const html = readFileSync(commandsPage, 'utf8');
    const shelves = new Map([...html.matchAll(/id="(cmd-g\w+)">[\s\S]*?<span class="cmd-count">(\d+)<\/span>/g)].map((m) => [m[1], Number(m[2])]));
    for (const [, id, count] of html.matchAll(/<a href="#(cmd-g\w+)">[\s\S]*?<b>(\d+)<\/b><\/a>/g)) {
      if (shelves.get(id) !== Number(count)) errors.push(`commands.html: the ${id} button says ${count}, its shelf says ${shelves.get(id)}`);
    }
    const total = [...shelves.values()].reduce((sum, count) => sum + count, 0);
    for (const lang of ['en', 'cs']) {
      const said = Number(locales[lang].commands?.refLead?.match(/\d+/)?.[0]);
      if (said !== total) errors.push(`${lang}.js commands.refLead says ${said} commands, the shelves add up to ${total}`);
    }
    const demo = readFileSync(join(src, 'js', 'discord-demo.js'), 'utf8');
    const menu = demo.slice(demo.indexOf('const COMMANDS = ['), demo.indexOf('];', demo.indexOf('const COMMANDS = [')));
    const inDemo = menu.match(/\{ name: '/g)?.length ?? 0;
    if (inDemo !== total) errors.push(`The demo's menu has ${inDemo} commands, the shelves on commands.html add up to ${total}`);
  }

  // The home page's "What's cooking" should mention the bot's latest change.
  if (newestBotDate) {
    const home = readFileSync(join(src, 'pages', 'index.html'), 'utf8');
    const list = home.slice(home.indexOf('id="changelog"'));
    const newest = list.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (newest && newestBotDate > newest) {
      warnings.push(`The bot changed on ${newestBotDate}, but "What's cooking" on the home page stops at ${newest}.`);
    }
  }

  return { errors, warnings };
}

export function report({ errors, warnings }) {
  for (const warning of warnings) console.warn(`Check: ${warning}`);
  for (const error of errors) console.error(`Check failed: ${error}`);
  return errors.length === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const build = readFileSync(join(root, 'scripts', 'build.mjs'), 'utf8');
  const siteUrl = build.match(/const SITE_URL = '([^']+)'/)[1];
  if (!report(check({ root, dist: join(root, 'dist'), siteUrl }))) process.exitCode = 1;
  else console.log('Check passed.');
}
