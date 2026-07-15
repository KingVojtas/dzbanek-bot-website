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

## Preview locally

```bash
# From this folder — serves on http://localhost:3000 by default
npx --yes serve .
```

Or open HTML files directly (API admin cookies need a real origin; prefer `serve`).

### With the bot API (live stats + admin)

1. In the bot repo, set `.env` (see bot `.env.example`):
   - `API_ENABLED=true`
   - `API_PORT=3847`
   - `WEBSITE_ORIGIN=http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5500,null`
   - For admin: `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `OAUTH_REDIRECT_URI`
2. Start the bot (`npm start` / `npm run dev`).
3. Serve this site; open `stats.html` or the landing stats section.

**Override API URL in the browser** (no rebuild):

```js
localStorage.setItem('dzbanek_api_base', 'http://127.0.0.1:3847');
// then reload
```

Default is set in `js/config.js` → `window.DZBANEK.API_BASE`.

## Features

### Trust & onboarding
- Permissions table (no Administrator required; Manage Messages = bot’s own digest cleanup)
- FAQ (search history, language, permissions, music sources, invite vs self-host)

### Commands UX
- Live filter search on the landing commands section
- Click a command row → copies e.g. `/play` to the clipboard (toast confirmation)

### Live stats
- Landing mini KPIs: servers, approx. users, total plays, uptime
- `stats.html`: full KPIs + Chart.js line chart from daily snapshots
- Offline-friendly messaging when the API is down

### Admin dashboard
1. Open `admin.html` → **Login with Discord**
2. Bot redirects through Discord OAuth (`identify` + `guilds`)
3. Pick a guild you manage where the bot is present
4. Toggle news / Steam / Epic and set channel IDs → Save

**Discord Developer Portal setup**
- OAuth2 redirect: `http://127.0.0.1:3847/api/auth/callback` (or your production API URL)
- Client secret → bot `.env` as `DISCORD_CLIENT_SECRET`

**CORS / cookies:** the admin UI uses `credentials: 'include'`. The bot must list this site’s origin in `WEBSITE_ORIGIN`. For production, prefer reverse-proxying `/api` on the same site origin so cookies are first-party.

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
- Bot API: Node `http` on port **3847** (default)

## Related repo

Bot source + API: https://github.com/KingVojtas/dzbanek-bot
