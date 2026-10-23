# Dzbanek website

Presentation site for **[Dzbanek-bot 2.0](https://github.com/KingVojtas/dzbanek-bot-2.0)**: a Discord kitchen that plays music, streams Czech radio, and posts Steam and Epic deals.

The bot has no website API. This site does not show live stats, and it does not log anyone in.

## Project overview

Four static pages and a 404, one stylesheet, vanilla JavaScript. No framework and no `npm install` for the site itself.

| File | What it is |
| --- | --- |
| `index.html` | The kitchen: the hero ad, music, radio, the Prague kitchen-hours dial, deals, the Kitchen Board, welcomes, FAQ, invite |
| `commands.html` | A pretend `#kitchen` channel you can type `/` into, then `/play`, `/queue`, `/stop`, `/remove`, `/radio`, `/setup`, and the card buttons |
| `radio.html` | A tuner for Kiss, Rock Radio, and Radio Beat, Catch → Play, and a Friday Radio Night vote you can click |
| `setup.html` | Channel setup, auto-detected channel names, permissions, Server Members intent |
| `404.html` | The empty shelf. GitHub Pages serves it for missing paths |

Every card, the demo channel, and the vote are examples that run in the browser tab. The clock is the only live thing, and it is the browser's own Europe/Prague time.

English is in the HTML. Czech is in `src/js/locales/cs.js`. The header switches language and light/dark. The night theme matches the kitchen photo copied from the bot (`assets/kitchen-hero.jpg`). Every small pitcher on the site is the bot's Discord avatar, made from `ad/assets/bot-avatar.png`: `assets/avatar.jpg` (160 px) for the Discord examples, the navbar and the footer, `assets/avatar-large.*` (435 px) for the invite at the bottom and the 404 page, plus `assets/favicon.png` and `assets/apple-touch-icon.png`. The `.webp` files next to the JPGs are what browsers load first, and the JPGs are the fallback. `assets/fonts/` holds the self-hosted Fraunces, Outfit, JetBrains Mono, and Caveat for the handwriting (latin and latin-ext, which has the Czech letters).

The home hero plays the 54-second Dzbanek ad (`src/js/film.js`). Its first frame is `kitchen-hero.jpg` and so is its last, so the photo seems to start moving and the ad hands back to the hero without a jump. On the first visit of a browser session it starts muted, since browsers only allow sound after a click; "Turn on sound" restarts it with the voice-over and captions. It skips the autoplay for `prefers-reduced-motion` and data saver, and the round sticker plays it with sound. `assets/ad/` holds a 1080p and a 720p H.264 encode (phones get the 720p) and EN / CS captions. `og:video` on the home page points at the 720p file, so a pasted link plays the ad in Discord. The ad's source, and how to rebuild it, is in `ad/` (see `ad/README.md`).

`scripts/build.mjs` stitches `src/partials/` and `src/pages/` into `dist/`. That folder is what you open, and what GitHub Pages publishes.

The invite uses application id `923262419923513445` and permission bitfield `3173440` (Connect, Speak, View Channel, Send Messages, Embed Links, Manage Messages, Add Reactions).

## Local setup

From this folder:

```bash
node scripts/build.mjs
npx serve dist
```

Open the URL `serve` prints (usually `http://localhost:3000`).

The bot is a separate project. Its README is the full setup. Short version, from `Dzbanek-bot 2.0` next to this folder:

```bash
npm install
npx prisma db push
# .env with DISCORD_TOKEN
npm run deploy
npm run dev
```

This website does not start the bot.

## Code breakdown

```
src/partials/          head, header, footer, icons (inline SVG sprite)
src/pages/             page content only
src/css/site.css       wood, cream, and clay: fonts, tokens, chrome, Discord cards, pages, motion
src/js/i18n.js         EN / CS, ?lang=, localStorage dzbanek_lang
src/js/theme-boot.js   theme before first paint, adds html.js
src/js/theme.js        localStorage dzbanek_theme
src/js/site.js         year, menu, nav pill, copy buttons, command filter
src/js/reveal.js       scroll reveals ([data-reveal], [data-reveal-group])
src/js/clock.js        Europe/Prague clock and the next scheduled event
src/js/discord-demo.js the #kitchen demo on commands.html
src/js/radio.js        tuner and Radio Night vote on radio.html
src/js/film.js         the hero ad on index.html: autoplay, sound, chapters, captions, glow
scripts/build.mjs
dist/             generated, not committed
```

The top of `scripts/build.mjs` is the single list of public links: `SITE_URL` (where the site is served), the invite URL, and the GitHub URL. `SITE_URL` sets the canonical link, `og:url`, `og:image`, and the asset paths in `404.html`, which GitHub Pages serves at any missing path.

Pages are HTML comments plus the unique markup. The build fills `{{invite}}` and `{{github}}` and wraps each page in the shared chrome. Script order on every page: `theme-boot.js` in `<head>`, then both locales, `i18n.js`, `site.js`, `theme.js`, `reveal.js`, `clock.js`. A page can load its own scripts after those with a comment:

```html
<!-- scripts: discord-demo.js -->
```

Everything respects `prefers-reduced-motion`, and with JavaScript off the pages still read in English (the demos hide their controls).

## Deployment and hosting

`.github/workflows/pages.yml` runs on a push to `main`:

```yaml
- run: node scripts/build.mjs
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
- uses: actions/deploy-pages@v4
```

GitHub Pages has to be set to **GitHub Actions** for that workflow to be the source. The site lives in `KingVojtas/dzbanek-bot-website` and is served at `https://kingvojtas.github.io/dzbanek-bot-website/`, the `SITE_URL` in `scripts/build.mjs`. For a custom domain later: add a `CNAME` file with the domain to the root (the build copies it into `dist`), point the DNS `CNAME` at `kingvojtas.github.io`, set the domain under Settings → Pages, and change `SITE_URL`.

Publishing these files does not host the bot. Dzbanek-bot 2.0 stays a Node process on a home PC or a VPS, with FFmpeg and Deno available, as its own README describes.
