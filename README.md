# dzbanek-bot website

Marketing site + live stats dashboard + admin UI for **[dzbanek-bot](https://github.com/KingVojtas/dzbanek-bot)**.

Dark Discord-inspired UI: HTML + Tailwind CDN + Inter + vanilla JS. Live data comes from the bot’s HTTP API.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Landing: hero mock carousel, status strip, features, commands, stats, FAQ |
| `stats.html` | Live dashboard (KPIs + Chart.js growth chart) |
| `permissions.html` | Why each Discord permission is requested |
| `changelog.html` | Project milestones / what’s new |
| `admin.html` | Discord OAuth admin: per-guild news / Steam / Epic channel settings |
| `terms.html` / `privacy.html` | Legal (same dark theme) |
| `assets/bot-avatar.png` | Logo / favicon / OG image asset |
| `css/site.css` | Shared motion + utility styles |
| `js/config.js` | `API_BASE`, invite URL |
| `js/site.js` | Nav, toast, clipboard helpers |
| `js/permissions-calc.js` | Invite bitfield calculator |
| `js/command-playground.js` | Slash command mock embed playground |
| `js/stats-card.js` | Canvas share card export |

## Preview locally

```bash
# From this folder — serves on http://localhost:3000 by default
npx --yes serve .
```

Or open HTML files directly (API admin cookies need a real origin; prefer `serve`).

### With the bot API (live stats + admin)

`js/config.js` **auto-detects** the API base:

| Where you open the site | API base used |
|-------------------------|----------------|
| `localhost` / `127.0.0.1` | `http://127.0.0.1:3848` (local bot) |
| Production domain / bot host | **Same origin** (bot serves the site or reverse-proxy `/api`) |
| GitHub Pages + remote bot | Set `PRODUCTION_API_BASE` in `js/config.js` to your public API URL |

**Public site (custom domain):**

```
https://dzbanek-bot.vojtas.io/
```

(GitHub Pages fallback: `https://kingvojtas.github.io/dzbanek-bot-website/`)

| Endpoint | Use |
|----------|-----|
| `GET /api/stats` | Servers, users, uptime (+ plays/history when available) |
| `GET /api/health` | Online / ready |
| `/api/auth/*` + `/api/admin/*` | Admin dashboard (Discord OAuth) |
| static `/admin.html`, `/`, … | Marketing site (when bot serves files or GitHub Pages) |

**Production bot `.env` (not localhost):**

```env
PUBLIC_BASE_URL=https://dzbanek-bot.vojtas.io
WEBSITE_ORIGIN=https://dzbanek-bot.vojtas.io,https://kingvojtas.github.io
OAUTH_REDIRECT_URI=https://dzbanek-bot.vojtas.io/api/auth/callback
DISCORD_CLIENT_SECRET=…
SESSION_SECRET=long-random-string
```

If only the **static** site is on `dzbanek-bot.vojtas.io` and the bot API is elsewhere, set `PRODUCTION_API_BASE` in `js/config.js` to that API origin and use that origin in `OAUTH_REDIRECT_URI` / Discord redirects instead.

Add the OAuth callback URL under Discord Developer Portal → OAuth2 → Redirects.

**Local development:**

```env
OAUTH_REDIRECT_URI=http://127.0.0.1:3848/api/auth/callback
```

Then open `http://127.0.0.1:3848/admin.html` (bot serves the site) or set `localStorage.dzbanek_api_base`.

**Override API URL in the browser** (no rebuild):

```js
localStorage.setItem('dzbanek_api_base', 'https://bot.yourdomain.com');
// then reload
```

Default logic is in `js/config.js` → `window.DZBANEK.API_BASE`.

### Public stats (works without a public bot API)

GitHub Pages / `dzbanek-bot.vojtas.io` cannot reach your PC. The site reads **`data/stats.json`** on those hosts.

Refresh numbers for friends (bot running):

```bash
node scripts/export-stats.mjs
git add data/stats.json
git commit -m "Update public stats snapshot"
git push
```

For **true live** stats later, host the bot on HTTPS and set `PRODUCTION_API_BASE` in `js/config.js`.

## Features

### Trust & onboarding
- Permissions table (no Administrator required; Manage Messages = bot’s own digest cleanup)
- **Permissions calculator** — toggle Music / Digest cleanup packs → live bitfield + custom invite URL
- FAQ (search history, language, permissions, music sources, invite vs self-host)

### Commands UX
- Live filter search on the landing commands section
- Click a command row → copies e.g. `/play` to the clipboard (toast confirmation)
- **Command playground** — category chips + mock Discord embed preview for each slash command

### Live stats
- Landing mini KPIs: servers, approx. users, total plays, uptime
- `stats.html`: full KPIs + Chart.js line chart from daily snapshots
- **Shareable stats card** — download or copy a 1200×630 PNG of current KPIs
- Offline-friendly messaging when the API is down

### Admin dashboard
1. Open `admin.html` → **Login with Discord**
2. Bot redirects through Discord OAuth (`identify` + `guilds`)
3. Pick a guild you manage where the bot is present
4. Toggle news / Steam / Epic and set channel IDs → Save

**Discord Developer Portal setup**
- OAuth2 redirect: `http://127.0.0.1:3848/api/auth/callback` (or your production API URL)
- Client secret → bot `.env` as `DISCORD_CLIENT_SECRET`

**CORS / cookies:** the admin UI uses `credentials: 'include'`. The bot must list this site’s origin in `WEBSITE_ORIGIN` (or allow localhost ports in dev). For production, prefer reverse-proxying `/api` on the same site origin so cookies are first-party.

If admin shows “Could not reach the admin API” while stats used to work: an old stats-only process may still own `:3848`. Fully stop and restart the bot so the Website API (stats + admin) is listening.

## SEO / Open Graph

Pages ship with **absolute** `og:image` / `twitter:image` pointing at:

```
https://raw.githubusercontent.com/KingVojtas/dzbanek-bot-website/main/assets/bot-avatar.png
```

`js/config.js` sets `SITE_URL` (`https://dzbanek-bot.vojtas.io`) and `OG_IMAGE`. `js/seo.js` rewrites `og:url` when the site is served.

### Custom domain (GitHub Pages)

1. Repo **Settings → Pages → Custom domain**: `dzbanek-bot.vojtas.io` (or rely on the `CNAME` file in this repo).
2. DNS at your domain host (for `vojtas.io`):
   - **Type:** `CNAME`
   - **Name / host:** `dzbanek-bot`
   - **Value / target:** `kingvojtas.github.io`
3. Wait for DNS + GitHub HTTPS certificate (can take minutes to hours).
4. Open **https://dzbanek-bot.vojtas.io/**

Fallback without custom domain:

```
https://kingvojtas.github.io/dzbanek-bot-website/
```

Test link previews with [opengraph.xyz](https://www.opengraph.xyz) or by pasting the URL into Discord.

## Customize

| What | Where |
|------|--------|
| Invite link | `js/config.js` → `INVITE_URL` (also hardcoded CTAs use client id `923262419923513445`) |
| Support server | `index.html` → Support Server button `href` |
| Buy me a coffee | `js/config.js` → `COFFEE_URL` (also linked in page footers) |
| Bot avatar | Replace `assets/bot-avatar.png` |
| API base | `js/config.js` or `localStorage.dzbanek_api_base` |

## Stack

- HTML5, Tailwind CSS (CDN), Inter (Google Fonts)
- Chart.js 4 (stats page only)
- Bot API: Website API on port **3848** (`/api/stats`, health, admin OAuth)

## Related repo

Bot source + API: https://github.com/KingVojtas/dzbanek-bot
