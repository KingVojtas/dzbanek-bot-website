/**
 * Stitch partials into dist/. Node only — no packages.
 * Usage: node scripts/build.mjs
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

// Where the site is served. Canonical links, og:url, og:image, and the 404 page's asset paths come from it.
const SITE_URL = 'https://kingvojtas.github.io/dzbanek-bot-website/';
const invite =
  'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3173440&scope=bot%20applications.commands';
const github = 'https://github.com/KingVojtas/dzbanek-bot-2.0';
const ogImage = new URL('assets/kitchen-hero.jpg', SITE_URL).href;
// The home page carries the ad, so a pasted link can play it in Discord.
const ogVideo = new URL('assets/ad/dzbanek-ad-720.mp4', SITE_URL).href;

function fill(template, map) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in map ? String(map[key]) : ''));
}

function field(raw, name) {
  const match = raw.match(new RegExp(`<!--\\s*${name}:\\s*([\\s\\S]*?)\\s*-->`));
  return match ? match[1].trim() : '';
}

// GitHub Pages serves 404.html at any missing path, so its relative links would
// resolve against that path. Pin them to the site root instead.
function rootRelative(html) {
  const base = new URL(SITE_URL).pathname;
  const pin = (url) => (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(url) ? url : base + url);
  return html
    .replace(/(\s(?:href|src)=")([^"]*)"/g, (_, attr, url) => `${attr}${pin(url)}"`)
    .replace(/(\ssrcset=")([^"]*)"/g, (_, attr, list) =>
      `${attr}${list.split(',').map((entry) => entry.trim().replace(/^\S+/, pin)).join(', ')}"`
    );
}

const head = await readFile(join(src, 'partials', 'head.html'), 'utf8');
const header = await readFile(join(src, 'partials', 'header.html'), 'utf8');
const footer = await readFile(join(src, 'partials', 'footer.html'), 'utf8');
const icons = await readFile(join(src, 'partials', 'icons.html'), 'utf8');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const shared = { invite, github, ogImage };
const pages = (await readdir(join(src, 'pages'))).filter((name) => name.endsWith('.html'));

for (const file of pages) {
  const raw = await readFile(join(src, 'pages', file), 'utf8');
  const title = field(raw, 'title') || 'Dzbanek';
  const description = field(raw, 'description');
  const page = field(raw, 'page') || 'home';
  const missing = file === '404.html';
  const url = new URL(file === 'index.html' ? '' : file, SITE_URL).href;
  const canonical = missing
    ? ''
    : `<link rel="canonical" href="${url}" />\n  <meta property="og:url" content="${url}" />`;
  const video =
    file === 'index.html'
      ? [
          `<meta property="og:video" content="${ogVideo}" />`,
          `<meta property="og:video:secure_url" content="${ogVideo}" />`,
          '<meta property="og:video:type" content="video/mp4" />',
          '<meta property="og:video:width" content="1280" />',
          '<meta property="og:video:height" content="720" />',
        ].join('\n  ')
      : '';
  // <!-- scripts: clock.js radio.js --> loads page-only scripts after the shared ones.
  const scripts = field(raw, 'scripts')
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => `<script src="js/${name}"></script>`)
    .join('\n');
  const content = raw.replace(/<!--\s*(title|description|page|scripts):[\s\S]*?-->\s*/g, '').trim();
  const html = `<!DOCTYPE html>
<html lang="en">
${fill(head, { ...shared, title, description, canonical, video })}
<body data-page="${page}">
${icons.trim()}
${fill(header, shared)}
<main id="main" tabindex="-1">
${fill(content, shared)}
</main>
${fill(footer, shared)}
${scripts}
</body>
</html>
`;
  await writeFile(join(dist, file), missing ? rootRelative(html) : html, 'utf8');
}

await cp(join(src, 'css'), join(dist, 'css'), { recursive: true });
await cp(join(src, 'js'), join(dist, 'js'), { recursive: true });
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
// A custom domain, once there is one, travels with the published folder as CNAME.
await cp(join(root, 'CNAME'), join(dist, 'CNAME')).catch(() => {});

console.log(`Built ${pages.length} pages into dist/`);
