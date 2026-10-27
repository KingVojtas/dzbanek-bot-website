# Dzbanek website

Presentation site for **[Dzbanek-bot 2.0](https://github.com/KingVojtas/dzbanek-bot-2.0)**: a Discord kitchen that plays music, streams live radio from Prague and London, and posts Steam and Epic deals.

The bot has no website API. This site does not show live stats, and it does not log anyone in.

## Project overview

Seven pages and a 404, one stylesheet, vanilla JavaScript. No framework and no `npm install` for the site itself.

| File | What it is |
| --- | --- |
| `index.html` | The kitchen as a cookbook: a title page with the hero ad, then the contents beside numbered chapters (music; a radio on the kitchen counter that plays the real stations, under a cabinet light in the tuned station’s colour; deals with small clocks set to their posting times; the Kitchen Board with its chef of the week; Kitchen Wrapped, the card the bot posts on the 1st; welcomes; setting it up; real server screenshots that open full size; FAQ; the changelog; and why I made Dzbanek, a stamped letter from me beside a chronicle of both bot versions), and the invite on the back cover |
| `commands.html` | A pretend `#kitchen` channel you can type `/` into (every command, Kitchen FM with 🔥 / 👎 and `/radio dedicate`, a three-round Kitchen Quiz, `/setup wrapped-preview` made from what you played there, and the card buttons), then the full command menu, grouped like the bot's `/help`, with a tab per group and every subcommand on its own line |
| `radio.html` | A tuner that plays all seven stations live (Kiss, Rock Radio, Radio Beat, Frekvence 1, Heart London, Capital London, Radio Paradise), what each one has on air, Kitchen FM (the bot’s own station, listed under them and explained in its own section with a dedication on its card; it has no stream to play here), Catch → Play, and a Friday Radio Night vote you can click |
| `setup.html` | Channel setup, auto-detected channel names, permissions, Server Members intent |
| `changes.html` | The big new things as cards, then every bot commit as one long kitchen-log receipt, printed by the build, with buttons that keep only New, Better, or Fix |
| `privacy.html` | What the bot keeps per server and per person (its tables in `prisma/schema.prisma` in the bot repo, the play log included), what it never keeps, what this site stores, and how to have something removed |
| `terms.html` | The house rules: the terms of use Discord asks a verified bot to link, next to the privacy page |
| `404.html` | The empty shelf. GitHub Pages serves it for missing paths |

Every card, the demo channel, and the vote are examples that run in the browser tab. The clock is the only live thing, and it is the browser's own Europe/Prague time.

English is in the HTML. Czech is in `src/js/locales/cs.js`, and the build writes a Czech copy of every page into `cs/` with it, so `/cs/` is Czech before any script runs and search engines see both (`hreflang` links and `sitemap.xml`). The header switches between the two copies, and light/dark. An old `?lang=` link, the saved choice, or a Czech or Slovak browser picks the copy before the page paints. `404.html` is one page for both languages. `data-i18n` replaces an element’s text, so put it only on elements that hold nothing but text; the build warns when one doesn’t. The night theme matches the kitchen photo copied from the bot (`assets/kitchen-hero.jpg`). Every small pitcher on the site is the bot's Discord avatar, made from `ad/assets/bot-avatar.png`: `assets/avatar.jpg` (160 px) for the Discord examples, the navbar and the footer, `assets/avatar-large.*` (435 px) for the invite at the bottom and the 404 page, plus `assets/favicon.png` and `assets/apple-touch-icon.png`. The `.webp` files next to the JPGs are what browsers load first, and the JPGs are the fallback. `assets/fonts/` holds the self-hosted Fraunces, Outfit, JetBrains Mono, and Caveat for the handwriting (latin and latin-ext, which has the Czech letters). The footer's "Last updated" date is the date of the latest commit; the build fills it in.

The radio plays the stations' public streams, the same ones the bot uses, in the bot's `/radio` order (`src/radio/station.ts` in the bot repo; Rock Radio needs its `https://` address here). `src/js/listen.js` holds the one list of stations; the radio page, the shelf radio and the vote read their names from it and their dial positions from the labels in the HTML, so a new station means a line there, its markup on `radio.html` and the home page, a `--key` colour in `site.css`, and its strings in both locales. Nothing plays until someone presses a key, and the ad mutes itself when the radio starts, and the other way round. The song titles come from radia.cz, which only answers `https://` pages, so on a local `http://` server those stations play but show no titles. Frekvence 1's come from Triton's public feed, Heart's and Capital's from Global's now-playing socket (`wss://metadata.musicradio.com/v2/now-playing`, the station's `heraldId` from globalplayer.com), and Radio Paradise's from the first metadata block of its own stream. Those three answer anywhere.

"What's cooking" on the home page is a short slip with the four newest changes; every change is on `changes.html`. To add one, put a new `<li>` at the top of the list in `src/pages/index.html` with the next free `changelog.cN` key, add that key to both locale files, and take the bottom `<li>` and its key out.

The site reads like a cookbook: a running head across the top of every page, a title page, and a colophon at the bottom. On the home page every `<section class="chapter">` takes its number from a CSS counter, and every caption with `class="plate-caption"` takes its figure number the same way, so moving or adding a section renumbers everything. A new chapter also needs a line in the contents (`.contents` in `src/pages/index.html`), which `src/js/contents.js` highlights while you read that chapter. The inner pages open with the same title-page head and put a printed rule over each section after the first.

The home hero plays the 59-second Dzbanek ad (`src/js/film.js`). Its first frame is `kitchen-hero.jpg` and so is its last, so the photo seems to start moving and the ad hands back to the hero without a jump. On the first visit of a browser session it starts muted, since browsers only allow sound after a click; "Turn on sound" restarts it with the voice-over and captions. It skips the autoplay for `prefers-reduced-motion` and data saver, and the round sticker plays it with sound. `assets/ad/` holds a 1080p and a 720p H.264 encode (phones get the 720p) and EN / CS captions. `og:video` on the home page points at the 720p file, so a pasted link plays the ad in Discord. The ad's source, and how to rebuild it, is in `ad/` (see `ad/README.md`). The radio section on the home page and on `radio.html` also has a 46-second radio ad about the seven stations and Kitchen FM (`assets/ad/dzbanek-radio-*.mp4`, `src/js/radio-film.js`): an ordinary video with controls, with captions in the page language. Whichever plays with sound, the live radio, the hero ad or the radio ad, the others go quiet. Its source is `ad/radio/`.

A pasted link to an inner page shows that page's own picture: its title beside a real piece of it (the demo's Now Playing card, the tuner, the receipt…), in English (`assets/og/<page>.jpg`) and Czech (`<page>-cs.jpg`), with `og.<page>` from the locales as its alt text. The build uses one when it's there and the kitchen photo otherwise. `node scripts/share-images.mjs` makes them again from a fresh `dist/` (it needs the ad tools' puppeteer-core and Chrome), so run it after a page's title or that piece of it changes.

`scripts/build.mjs` stitches `src/partials/` and `src/pages/` into `dist/`. That folder is what you open, and what GitHub Pages publishes.

The invite uses application id `923262419923513445` and permission bitfield `3263568` (Connect, Speak, View Channel, Send Messages, Embed Links, Attach Files, Read Message History, Add Reactions, and Manage Channels for `/textroom` and `/voiceroom`), the same as the bot's `INSTALL_PERMISSIONS` in `src/core/links.ts` and the install link in the Developer Portal.

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
src/partials/          head, header, footer, icons (inline SVG sprite), back-cover (the invite that ends a page)
src/pages/             page content only
src/css/site.css       the cookbook in wood, cream, and clay: fonts, tokens, running head, chapters, plates, Discord cards, pages, motion
src/js/i18n.js         EN / CS strings for what scripts draw, the language switch, localStorage dzbanek_lang
src/js/theme-boot.js   the right language copy and the theme before first paint, adds html.js, and html.film-soon when the ad will autoplay
src/js/theme.js        localStorage dzbanek_theme
src/js/listen.js       the live stations: one player for the page, song info from radia.cz
src/js/site.js         year, menu, nav pill, the home radio, screenshot zoom, copy buttons, command filter
src/js/reveal.js       scroll reveals ([data-reveal], [data-reveal-group])
src/js/clock.js        Europe/Prague clock, the next scheduled event, and the small clocks by the deals
src/js/contents.js     the home page contents: marks the chapter you are reading
src/js/discord-demo.js the pretend Discord server on commands.html: #kitchen takes commands (the first time it scrolls into view, it types /play by itself, unless motion is reduced or someone got there first), the other channels show the bot's posts
src/js/radio.js        tuner, on-air lines and Radio Night vote on radio.html
src/js/changes.js      the New / Better / Fix filter on changes.html
src/js/film.js         the hero ad on index.html: autoplay, sound, chapters, captions, glow
scripts/build.mjs
scripts/share-images.mjs the share pictures in assets/og/, made from dist/
dist/             generated, not committed
```

The top of `scripts/build.mjs` is the single list of public links: `SITE_URL` (where the site is served), the invite URL, and the GitHub URL. `SITE_URL` sets the canonical link, `og:url`, `og:image`, the `hreflang` links, `sitemap.xml`, the home page’s JSON-LD, and the asset paths in `404.html`, which GitHub Pages serves at any missing path.

After building, `scripts/check.mjs` checks `dist/` and fails the build (and so the deploy) when a string is in one locale file and not the other, a page or script uses a key `en.js` doesn’t have, a link points at a file or `#id` that isn’t there, or the command counts on `commands.html` (each shelf, the “All N of them”, and the demo’s menu) don’t add up. It warns when the bot has a change newer than the home page’s “What’s cooking”. Run it alone with `node scripts/check.mjs`. The build also adds `?v=` and a short hash of the file to every CSS and JS link, so a deploy reaches returning visitors at once.

Pages are HTML comments plus the unique markup. The build fills `{{invite}}`, `{{github}}`, `{{changes}}`, `{{changeCount}}` (how many changes the letter counts) and `{{backCover}}` (the invite from `src/partials/back-cover.html`, which the home page, Commands, Radio, and Setup end on; the footer drops its own two buttons on those pages) and wraps each page in the shared chrome. Script order on every page: `theme-boot.js` in `<head>`, then both locales, `i18n.js`, `listen.js`, `site.js`, `theme.js`, `reveal.js`, `clock.js`. A page can load its own scripts after those with a comment:

```html
<!-- scripts: discord-demo.js -->
```

Everything respects `prefers-reduced-motion`, and with JavaScript off the pages still read in English (the demos hide their controls).

## Deployment and hosting

`.github/workflows/pages.yml` runs on a push to `main`, and every morning so `changes.html` picks up new bot commits. The build reads them from the GitHub API (with the workflow's token), falls back to a `Dzbanek-bot 2.0` clone next to this repo, and links to GitHub if neither works. Housekeeping commits (README, Prettier, the deploy skill, the app directory listing, chores only the owner sees) are left out by `QUIET` in the build:

```yaml
- run: node scripts/build.mjs
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
- uses: actions/deploy-pages@v4
```

GitHub Pages has to be set to **GitHub Actions** for that workflow to be the source. The site lives in `KingVojtas/dzbanek-bot-website` and is served at `https://kingvojtas.github.io/dzbanek-bot-website/`, the `SITE_URL` in `scripts/build.mjs`. For a custom domain later: add a `CNAME` file with the domain to the root (the build copies it into `dist`), point the DNS `CNAME` at `kingvojtas.github.io`, set the domain under Settings → Pages, and change `SITE_URL`.

Publishing these files does not host the bot. Dzbanek-bot 2.0 stays a Node process on a home PC or a VPS, with FFmpeg and Deno available, as its own README describes.
