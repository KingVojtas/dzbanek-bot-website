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

This site talks to **one** bot HTTP API (default):

```
http://127.0.0.1:3848
```

When the bot runs next to this repo, it also **serves these HTML files** on the same port so OAuth never redirects to a dead Live Server. Prefer:

```
http://127.0.0.1:3848/admin.html
http://127.0.0.1:3848/
```

| Endpoint | Use |
|----------|-----|
| `GET /api/stats` | Servers, users, uptime (+ plays/history when available) |
| `GET /api/health` | Online / ready |
| `/api/auth/*` + `/api/admin/*` | Admin dashboard (Discord OAuth) |
| static `/admin.html`, `/`, … | Marketing site (embedded by bot when folder is found) |

**Per-guild digests (admin):** Steam min discount / min rating, news keywords, and UTC post hour for news/steam/epic. Post hours only work if the bot host cron runs at least hourly (see bot `config.json` crons).

1. In the bot repo, set `.env` (see bot `.env.example`):
   - `API_ENABLED=true`
   - `API_PORT=3848`
   - `WEBSITE_ORIGIN` including every origin you serve the site from, e.g.  
     `http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500,null`  
     (bot also allows any `localhost` / `127.0.0.1` port in dev)
   - For admin: `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`,  
     `OAUTH_REDIRECT_URI=http://127.0.0.1:3848/api/auth/callback`
2. Start the bot (`npm start` / `npm run dev`) and **restart** after `.env` or API changes.
3. Serve this site (`npx serve` or Live Server); open `admin.html` or `stats.html`.

**Override API URL in the browser** (no rebuild):

```js
localStorage.setItem('dzbanek_api_base', 'http://127.0.0.1:3848');
// then reload
```

Default is set in `js/config.js` → `window.DZBANEK.API_BASE`.

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

`js/config.js` sets `SITE_URL` (GitHub Pages default) and `OG_IMAGE`. `js/seo.js` rewrites `og:url` when the site is served.

Enable **GitHub Pages** (Settings → Pages → Deploy from `main` / root) for:

```
https://kingvojtas.github.io/dzbanek-bot-website/
```

Test link previews with [opengraph.xyz](https://www.opengraph.xyz) or by pasting the URL into Discord.

## Customize

| What | Where |
|------|--------|
| Invite link | `js/config.js` → `INVITE_URL` (also hardcoded CTAs use client id `923262419923513445`) |
| Support server | `index.html` → Support Server button `href` |
| Bot avatar | Replace `assets/bot-avatar.png` |
| API base | `js/config.js` or `localStorage.dzbanek_api_base` |

## Stack

- HTML5, Tailwind CSS (CDN), Inter (Google Fonts)
- Chart.js 4 (stats page only)
- Bot API: Website API on port **3848** (`/api/stats`, health, admin OAuth)

## Related repo

Bot source + API: https://github.com/KingVojtas/dzbanek-bot
