/**
 * Stitch partials into dist/. Node only — no packages.
 * Usage: node scripts/build.mjs
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, report } from './check.mjs';
import { loadLocales } from './locales.mjs';

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

// Run every href, src, poster, and srcset URL in the page through `change`.
function rewriteUrls(html, change) {
  return html
    .replace(/(\s(?:href|src|poster)=")([^"]*)"/g, (_, attr, url) => `${attr}${change(url)}"`)
    .replace(/(\ssrcset=")([^"]*)"/g, (_, attr, list) =>
      `${attr}${list.split(',').map((entry) => entry.trim().replace(/^\S+/, change)).join(', ')}"`
    );
}

// GitHub Pages serves 404.html at any missing path, so its relative links would
// resolve against that path. Pin them to the site root instead.
function rootRelative(html) {
  const base = new URL(SITE_URL).pathname;
  return rewriteUrls(html, (url) => (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(url) ? url : base + url.replace(/^\.\//, '')));
}

// The Czech copy lives in cs/: its page links stay next to it, and the shared files are one folder up.
function fromSubfolder(html) {
  return rewriteUrls(html, (url) => (/^(assets|css|js)\//.test(url) ? '../' + url : url));
}

// The same strings i18n.js uses in the browser.
const locales = loadLocales(src);

function lookup(lang, key) {
  let node = locales[lang];
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !(part in node)) return null;
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
}

const t = (lang, key) => lookup(lang, key) ?? lookup('en', key);

// What i18n.js apply() does in the browser, done once here so the Czech copy is Czech before any script runs.
// data-i18n replaces an element's text, so it only goes on elements that hold nothing but text.
function translate(html, lang, file) {
  let done = 0;
  html = html.replace(
    /(<([a-z][a-z0-9]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (whole, open, _tag, key, _text, close) => {
      done += 1;
      const value = t(lang, key);
      return value == null ? whole : open + escapeHtml(value) + close;
    }
  );
  const all = html.match(/\sdata-i18n="/g)?.length ?? 0;
  if (done !== all) console.warn(`${file}: ${all - done} data-i18n element(s) hold markup, so the build left them in English.`);
  for (const [from, to] of [
    ['data-i18n-aria', 'aria-label'],
    ['data-i18n-alt', 'alt'],
    ['data-i18n-placeholder', 'placeholder'],
  ]) {
    html = html.replace(new RegExp(`<[a-z][^>]*\\s${from}="([^"]+)"[^>]*>`, 'g'), (tag, key) => {
      const value = t(lang, key);
      if (value == null) return tag;
      const attr = `${to}="${escapeHtml(value)}"`;
      const existing = new RegExp(`\\s${to}="[^"]*"`);
      return existing.test(tag)
        ? tag.replace(existing, () => ` ${attr}`)
        : tag.replace(/\s*\/?>$/, (end) => ` ${attr}${end}`);
    });
  }
  return html;
}

const head = await readFile(join(src, 'partials', 'head.html'), 'utf8');
const header = await readFile(join(src, 'partials', 'header.html'), 'utf8');
const footer = await readFile(join(src, 'partials', 'footer.html'), 'utf8');
const icons = await readFile(join(src, 'partials', 'icons.html'), 'utf8');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// The footer's "Last updated": the date of the latest commit, or today outside git.
function lastUpdated() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
const dotted = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};
const updatedIso = lastUpdated();
const updated = dotted(updatedIso);

// changes.html: the bot's commit history, from GitHub, or from a clone next to this repo when offline.
const BOT_REPO = 'KingVojtas/dzbanek-bot-2.0';
// Housekeeping commits that mean nothing to someone using the bot.
const QUIET = /deploy skill|prettier|readme|prisma|fingerprint|layout key|initial commit/i;
const pragueDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' });

async function botCommits() {
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'dzbanek-site-build' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${BOT_REPO}/commits?per_page=100`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    return (await response.json()).map((entry) => ({
      sha: entry.sha,
      date: pragueDay.format(new Date(entry.commit.committer.date)),
      subject: entry.commit.message.split('\n')[0],
    }));
  } catch (error) {
    try {
      const log = execFileSync('git', ['log', '-100', '--format=%H%x09%cs%x09%s'], {
        cwd: join(root, '..', 'Dzbanek-bot 2.0'),
        encoding: 'utf8',
      });
      console.warn(`Changes: ${error.message}, read the local clone instead.`);
      return log
        .trim()
        .split('\n')
        .map((line) => {
          const [sha, date, subject] = line.split('\t');
          return { sha, date, subject };
        });
    } catch {
      console.warn(`Changes: ${error.message}, and no local clone. The page links to GitHub instead.`);
      return [];
    }
  }
}

const escapeHtml = (text) =>
  text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

function kindOf(subject) {
  if (/^add\b/i.test(subject)) return ['new', 'New'];
  if (/\bfix(es|ed)?\b|unescape/i.test(subject)) return ['fix', 'Fix'];
  return ['tweak', 'Better'];
}

// One long slip from the kitchen printer, a day per block, newest on top.
function changesLog(commits) {
  const shown = commits.filter((commit) => !QUIET.test(commit.subject));
  if (shown.length === 0) {
    return `<p class="receipt-empty"><a class="link-arrow" href="${github}/commits/main" target="_blank" rel="noopener noreferrer"><span data-i18n="changes.empty">The list didn’t load this time. Every change is on GitHub.</span> <svg width="16" height="16" aria-hidden="true"><use href="#i-arrow-right" /></svg></a></p>`;
  }
  const days = new Map();
  for (const commit of shown) {
    if (!days.has(commit.date)) days.set(commit.date, []);
    days.get(commit.date).push(commit);
  }
  const blocks = [...days].map(([date, list]) => {
    const rows = list.map((commit) => {
      const [kind, label] = kindOf(commit.subject);
      const text = escapeHtml(commit.subject.replace(/\.$/, ''));
      const sha = commit.sha.slice(0, 7);
      return `<li><span class="log-kind is-${kind}" data-i18n="changes.${kind}">${label}</span><span class="log-text">${text}</span><a class="log-sha" href="${github}/commit/${commit.sha}" target="_blank" rel="noopener noreferrer" aria-label="Commit ${sha} on GitHub">${sha}</a></li>`;
    });
    return `<li class="log-day"><h2><time datetime="${date}">${dotted(date)}</time></h2><ul>${rows.join('')}</ul></li>`;
  });
  const first = shown[shown.length - 1].date;
  return `<ol class="log">${blocks.join('')}</ol>
<p class="log-total"><span data-i18n="changes.total">Total</span><b>${shown.length}</b></p>
<p class="log-since"><span data-i18n="changes.since">Cooking since</span> <time datetime="${first}">${dotted(first)}</time></p>`;
}

const commits = await botCommits();
const changes = changesLog(commits);

// css/site.css?v=1a2b3c4d: a returning visitor gets the new file right after a deploy, not a cached mix.
const versions = new Map();
async function hashFiles(dir, prefix) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await hashFiles(path, `${prefix}${entry.name}/`);
    else versions.set(prefix + entry.name, createHash('sha256').update(await readFile(path)).digest('hex').slice(0, 8));
  }
}
await hashFiles(join(src, 'css'), 'css/');
await hashFiles(join(src, 'js'), 'js/');
const versioned = (html) =>
  html.replace(/(\s(?:href|src)="[^"?]*?)((?:css|js)\/[^"?]+)"/g, (whole, start, path) =>
    versions.has(path) ? `${start}${path}?v=${versions.get(path)}"` : whole
  );

const shared = { invite, github, ogImage, updated, updatedIso, changes };
const pages = (await readdir(join(src, 'pages'))).filter((name) => name.endsWith('.html'));

// English at the root, Czech under cs/. 404.html is one page for both; i18n.js switches it.
const LANGS = {
  en: { dir: '', locale: 'en_US' },
  cs: { dir: 'cs/', locale: 'cs_CZ' },
};
const pageUrl = (lang, name) => new URL(LANGS[lang].dir + name, SITE_URL).href;
// Search engines read this on the home page: what Dzbanek is, that it's free, and where to add it.
const jsonLd = (lang, description) =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Dzbanek',
    description,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Discord',
    inLanguage: lang,
    url: pageUrl(lang, ''),
    image: ogImage,
    installUrl: invite,
    sameAs: [github],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }).replace(/</g, '\\u003c')}</script>`;
const sitemap = [];

for (const file of pages) {
  const raw = await readFile(join(src, 'pages', file), 'utf8');
  const page = field(raw, 'page') || 'home';
  const missing = file === '404.html';
  const name = file === 'index.html' ? '' : file;
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
    .map((script) => `<script src="js/${script}"></script>`)
    .join('\n');
  const content = raw.replace(/<!--\s*(title|description|page|scripts):[\s\S]*?-->\s*/g, '').trim();
  const alternates = missing
    ? ''
    : [
        `<link rel="alternate" hreflang="en" href="${pageUrl('en', name)}" />`,
        `<link rel="alternate" hreflang="cs" href="${pageUrl('cs', name)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${pageUrl('en', name)}" />`,
      ].join('\n  ');
  if (!missing) sitemap.push(name);

  for (const lang of missing ? ['en'] : ['en', 'cs']) {
    const other = lang === 'en' ? 'cs' : 'en';
    const title = lang === 'en' ? field(raw, 'title') || 'Dzbanek' : t(lang, `meta.${page}Title`) || 'Dzbanek';
    const description = lang === 'en' ? field(raw, 'description') : t(lang, `meta.${page}Description`) || '';
    const url = pageUrl(lang, name);
    const canonical = missing
      ? ''
      : `<link rel="canonical" href="${url}" />\n  <meta property="og:url" content="${url}" />`;
    // The switch and theme-boot.js link straight to the other copy of this page. 404.html has none, so it links home.
    const here = missing ? '' : name;
    const href = {
      en: lang === 'en' ? here || './' : '../' + here,
      cs: lang === 'cs' ? here || './' : 'cs/' + here,
    };
    const switches = {
      hrefEn: href.en,
      hrefCs: href.cs,
      currentEn: ` aria-current="${lang === 'en'}"`,
      currentCs: ` aria-current="${lang === 'cs'}"`,
    };
    const htmlAttrs = missing ? '' : ` data-href-en="${href.en}" data-href-cs="${href.cs}"`;
    const headFill = {
      ...shared,
      title: escapeHtml(title),
      description: escapeHtml(description),
      canonical,
      alternates,
      video,
      locale: LANGS[lang].locale,
      localeAlt: LANGS[other].locale,
      imageAlt: escapeHtml(t(lang, 'hero.alt') || ''),
      jsonLd: file === 'index.html' ? jsonLd(lang, description) : '',
    };
    let html = `<!DOCTYPE html>
<html lang="${lang}"${htmlAttrs}>
${fill(head, headFill)}
<body data-page="${page}">
${icons.trim()}
${fill(header, { ...shared, ...switches })}
<main id="main" tabindex="-1">
${fill(content, shared)}
</main>
${fill(footer, shared)}
${scripts}
</body>
</html>
`;
    if (lang !== 'en') html = fromSubfolder(translate(html, lang, file));
    if (missing) html = rootRelative(html);
    html = versioned(html);
    await mkdir(join(dist, LANGS[lang].dir), { recursive: true });
    await writeFile(join(dist, LANGS[lang].dir, file), html, 'utf8');
  }
}

// Both copies of every page, each naming the other.
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
  .flatMap((name) =>
    ['en', 'cs'].map(
      (lang) => `  <url>
    <loc>${pageUrl(lang, name)}</loc>
    <lastmod>${updatedIso}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${pageUrl('en', name)}" />
    <xhtml:link rel="alternate" hreflang="cs" href="${pageUrl('cs', name)}" />
  </url>`
    )
  )
  .join('\n')}
</urlset>
`,
  'utf8'
);
// Crawlers only read robots.txt at the root of a domain, so it only helps once the site has its own.
if (new URL(SITE_URL).pathname === '/') {
  const map = new URL('sitemap.xml', SITE_URL).href;
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${map}\n`, 'utf8');
}

await cp(join(src, 'css'), join(dist, 'css'), { recursive: true });
await cp(join(src, 'js'), join(dist, 'js'), { recursive: true });
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
// A custom domain, once there is one, travels with the published folder as CNAME.
await cp(join(root, 'CNAME'), join(dist, 'CNAME')).catch(() => {});

console.log(`Built ${pages.length} pages, ${sitemap.length} of them also in Czech, into dist/`);

const newestBotDate = commits.find((commit) => !QUIET.test(commit.subject))?.date;
if (!report(check({ root, dist, siteUrl: SITE_URL, newestBotDate }))) process.exitCode = 1;
