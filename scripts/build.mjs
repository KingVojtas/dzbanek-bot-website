/**
 * Stitch partials into dist/. Node only — no packages.
 * Usage: node scripts/build.mjs
 */
import { execFileSync } from 'node:child_process';
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

const changes = changesLog(await botCommits());

const shared = { invite, github, ogImage, updated, updatedIso, changes };
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
