/**
 * The pictures a pasted link shows for the inner pages (og:image): the page's title beside
 * a real piece of that page, in the night theme, in English and in Czech. Writes assets/og/.
 * Needs a fresh dist/ (node scripts/build.mjs), puppeteer-core from the ad tools
 * (cd ad/tools && npm install), and Chrome (CHROME=path to use another one).
 * Usage: node scripts/share-images.mjs [radio,setup]
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'assets', 'og');
const ONLY = process.argv[2]?.split(',');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const { default: puppeteer } = await import(pathToFileURL(join(ROOT, 'ad/tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).href);

const TEMPLATE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="/css/site.css">
<style>
  html, body { margin: 0; width: 1280px; height: 720px; overflow: hidden; background: var(--ink); }
  body { padding: 0 !important; }
  .og {
    position: relative; box-sizing: border-box; width: 1280px; height: 720px; overflow: hidden;
    display: grid; grid-template-columns: 520px 1fr; align-items: center;
    padding: 0 0 0 76px;
    background:
      radial-gradient(760px 480px at 88% 46%, rgba(224, 138, 69, 0.24), transparent 70%),
      radial-gradient(520px 320px at 0% 100%, rgba(255, 196, 119, 0.07), transparent 70%),
      var(--ink);
  }
  .og::before { content: ""; position: absolute; inset: 22px; border: 1px solid var(--rule-strong); border-radius: 12px; pointer-events: none; z-index: 3; }
  .og::after { content: ""; position: absolute; inset: 32px; border: 1px solid var(--rule); border-radius: 8px; pointer-events: none; z-index: 3; }
  .og-copy { position: relative; z-index: 2; }
  .og-brand { display: flex; align-items: center; gap: 16px; }
  .og-brand img { width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(224, 138, 69, 0.35); }
  .og-brand b { font: 600 36px/1 var(--serif); color: var(--cream); letter-spacing: -0.01em; }
  .og-brand i { display: block; margin-top: 6px; font: italic 400 21px/1 var(--serif); color: var(--accent-text); }
  .og-kick { display: flex; align-items: center; gap: 14px; margin-top: 64px; font: 600 16px/1 var(--sans); letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-text); }
  .og-kick::before { content: ""; width: 38px; height: 1.5px; background: var(--accent-text); }
  .og-title { margin: 22px 0 0; font: 600 68px/1.02 var(--serif); letter-spacing: -0.025em; color: var(--cream); text-wrap: balance; }
  .og-lead { margin: 26px 0 0; font: 400 25px/1.4 var(--sans); color: var(--cream-soft); max-width: 24ch; text-wrap: pretty; }
  .og-shot { position: relative; z-index: 1; justify-self: end; margin-right: 70px; }
  .og-shot img { display: block; border-radius: 16px; box-shadow: 0 40px 80px -24px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(246, 240, 230, 0.08); rotate: -1.6deg; transform-origin: 100% 50%; }
</style></head><body><div class="og">
  <div class="og-copy">
    <div class="og-brand"><img src="/assets/avatar.jpg" alt=""><span><b>Dzbanek</b><i data-tag></i></span></div>
    <p class="og-kick" data-kick></p>
    <h1 class="og-title" data-title></h1>
    <p class="og-lead" data-lead></p>
  </div>
  <div class="og-shot"><img data-shot alt=""></div>
</div></body></html>`;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/__og.html') { res.writeHead(200, { 'content-type': TYPES['.html'] }); res.end(TEMPLATE); return; }
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(DIST, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(''); }
}).listen(4320);

// What each page shows: the element to photograph, how much of it, and a short line under the title.
const PAGES = {
  commands: {
    prepare: async (page) => {
      await page.click("[data-demo-run='/play']");
      await new Promise((r) => setTimeout(r, 1600));
      await page.evaluate(() => {
        const log = document.querySelector('[data-demo-log]');
        log.querySelectorAll('.dc-msg.is-new').forEach((m) => m.classList.remove('is-new'));
        log.querySelectorAll('.dc-used').forEach((line) => (line.style.display = 'none'));
      });
    },
    el: '[data-demo-log] .dc-msg:has(.vinyl)',
    fit: true,
    width: 570,
    lead: { en: 'Try every command in a pretend Discord channel.', cs: 'Vyzkoušej každý příkaz v cvičném kanálu na Discordu.' },
  },
  radio: { el: '.tuner', width: 560, lead: { en: 'Seven live stations, and your server’s own.', cs: 'Sedm živých stanic a k tomu vlastní stanice serveru.' } },
  setup: { el: '.channel-groups', width: 600, lead: { en: 'Pick the channels, or let it find them.', cs: 'Vyber kanály, nebo je nech najít.' } },
  changes: { el: '.receipt-wrap.is-long .receipt', width: 600, crop: 560, lead: { en: 'Every change to the bot, day by day.', cs: 'Každá změna v botovi, den po dni.' } },
  privacy: { el: '.privacy-not', width: 560, lead: { en: 'Everything the bot keeps, and how to clear it.', cs: 'Všechno, co si bot pamatuje, a jak to smazat.' } },
  terms: { el: '#rules .recipe', width: 580, crop: 380, lead: { en: 'The house rules, short on purpose.', cs: 'Domácí řád, schválně krátký.' } },
};

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--mute-audio', '--hide-scrollbars', '--force-color-profile=srgb'],
});

for (const [name, spec] of Object.entries(PAGES)) {
  if (ONLY && !ONLY.includes(name)) continue;
  for (const lang of ['en', 'cs']) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'dark' }]);
    await page.goto(`http://localhost:4320/${lang === 'cs' ? 'cs/' : ''}${name}.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    if (spec.prepare) await spec.prepare(page);
    const words = await page.evaluate(() => ({
      kick: document.querySelector('.page-hero .kicker')?.textContent.trim(),
      title: document.querySelector('.page-hero h1')?.textContent.trim(),
      tag: document.querySelector('.brand-tagline')?.textContent.trim(),
    }));
    const handle = (await page.$$(spec.el)).pop();
    if (spec.fit) await handle.evaluate((el) => { el.style.width = 'fit-content'; el.style.paddingRight = '16px'; });
    if (spec.crop) await handle.evaluate((el, h) => { el.style.maxHeight = h + 'px'; el.style.overflow = 'hidden'; }, spec.crop);
    await new Promise((r) => setTimeout(r, 300));
    const shot = await handle.screenshot({ encoding: 'base64' });
    await ctx.close();

    const og = await browser.newPage();
    await og.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await og.goto('http://localhost:4320/__og.html', { waitUntil: 'networkidle0' });
    await og.evaluate(
      (w, shotData, width, lead) => {
        document.documentElement.lang = lead.lang;
        document.querySelector('[data-kick]').textContent = w.kick;
        document.querySelector('[data-title]').textContent = w.title;
        document.querySelector('[data-tag]').textContent = w.tag;
        document.querySelector('[data-lead]').textContent = lead.text;
        const img = document.querySelector('[data-shot]');
        img.style.width = width + 'px';
        img.src = 'data:image/png;base64,' + shotData;
        return new Promise((r) => (img.complete ? r() : (img.onload = r)));
      },
      words,
      shot,
      spec.width,
      { lang, text: spec.lead[lang] }
    );
    await og.evaluate(() => document.fonts.ready);
    const file = join(OUT, `${name}${lang === 'cs' ? '-cs' : ''}.jpg`);
    await og.screenshot({ path: file, type: 'jpeg', quality: 84 });
    await og.close();
    console.log(`assets/og/${name}${lang === 'cs' ? '-cs' : ''}.jpg: ${words.title}`);
  }
}
await browser.close();
server.close();
