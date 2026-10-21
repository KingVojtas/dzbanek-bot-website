# Dzbanek website

Presentation site for **[Dzbanek-bot 2.0](https://github.com/KingVojtas/dzbanek-bot-2.0)**: a Discord kitchen that plays music, streams Czech radio, and posts Steam and Epic deals.

The bot has no website API. This site does not show live stats, and it does not log anyone in.

## Project overview

Four static pages and a 404, one stylesheet, vanilla JavaScript. No framework and no `npm install` for the site itself.

| File | What it is |
| --- | --- |
| `index.html` | The kitchen: hero, music, radio, the Prague kitchen-hours dial, deals, the Kitchen Board, welcomes, FAQ, invite |
| `commands.html` | A pretend `#kitchen` channel you can type `/` into, then `/play`, `/queue`, `/stop`, `/remove`, `/radio`, `/setup`, and the card buttons |
| `radio.html` | A tuner for Kiss, Rock Radio, and Radio Beat, Catch → Play, and a Friday Radio Night vote you can click |
| `setup.html` | Channel setup, auto-detected channel names, permissions, Server Members intent |
| `404.html` | The empty shelf. GitHub Pages serves it for missing paths |

Every card, the demo channel, and the vote are examples that run in the browser tab. The clock is the only live thing, and it is the browser's own Europe/Prague time.

English is in the HTML. Czech is in `src/js/locales/cs.js`. The header switches language and light/dark. The night theme matches the kitchen photos copied from the bot (`assets/kitchen-hero.jpg`, `assets/kitchen-thumb.jpg`). `assets/avatar.jpg` (128 px) and `assets/kitchen-square.jpg` (640 px) are smaller copies of the thumb for avatars and cards. `assets/dzbanek.svg` is the favicon.

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
src/css/site.css       wood, cream, and clay: tokens, chrome, Discord cards, pages, motion
src/js/config.js       invite URL and GitHub URL
src/js/i18n.js         EN / CS, ?lang=, localStorage dzbanek_lang
src/js/theme-boot.js   theme before first paint, adds html.js
src/js/theme.js        localStorage dzbanek_theme
src/js/site.js         year, menu, nav pill, hero light, copy buttons, command filter
src/js/reveal.js       scroll reveals ([data-reveal], [data-reveal-group])
src/js/clock.js        Europe/Prague clock and the next scheduled event
src/js/discord-demo.js the #kitchen demo on commands.html
src/js/radio.js        tuner and Radio Night vote on radio.html
scripts/build.mjs
dist/             generated, not committed
```

`config.js` is the single list of public links:

```js
window.DZBANEK = {
  INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3173440&scope=bot%20applications.commands',
  GITHUB: 'https://github.com/KingVojtas/dzbanek-bot-2.0',
};
```

Pages are HTML comments plus the unique markup. The build fills `{{invite}}` and `{{github}}` and wraps each page in the shared chrome. Script order on every page: `theme-boot.js` in `<head>`, then `config.js`, both locales, `i18n.js`, `site.js`, `theme.js`, `reveal.js`, `clock.js`. A page can load its own scripts after those with a comment:

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

GitHub Pages has to be set to **GitHub Actions** for that workflow to be the source. The site lives in `KingVojtas/dzbanek-bot-website` and is served at `dzbanek-bot.vojtas.io`: the `CNAME` file in the root is copied into `dist` by the build, and the DNS `CNAME` points at `kingvojtas.github.io`.

Publishing these files does not host the bot. Dzbanek-bot 2.0 stays a Node process on a home PC or a VPS, with FFmpeg and Deno available, as its own README describes.
