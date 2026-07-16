/**
 * Site-wide configuration.
 *
 * API_BASE — bot HTTP API (public stats + OAuth admin).
 *   Override: localStorage.setItem('dzbanek_api_base', 'https://api.example.com')
 *
 * PRODUCTION_API_BASE — public HTTPS bot API when the site is static (GitHub Pages).
 *   Leave empty to use live API only on localhost / same-origin hosts.
 *   On GitHub Pages / custom domain without this, stats fall back to data/stats.json.
 *
 * SITE_URL — absolute site origin for Open Graph / share previews.
 */
(function () {
  /** Canonical public site. */
  var PUBLIC_SITE = 'https://dzbanek-bot.vojtas.io';

  /**
   * Public bot API (HTTPS) for GitHub Pages / custom domain.
   * Railway always-on deploy — admin + live stats without local npm start.
   * Prefer same-origin admin on Railway: https://dzbanek-bot.up.railway.app/admin.html
   */
  var PRODUCTION_API_BASE = 'https://dzbanek-bot.up.railway.app';

  function isLocalHost(hostname) {
    return (
      !hostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    );
  }

  /** Hosts that only serve static files (no Node bot). */
  function isStaticSiteHost(hostname) {
    if (!hostname) return false;
    // Railway hosts the bot API + static site together
    if (/\.up\.railway\.app$/i.test(hostname)) return false;
    if (/\.github\.io$/i.test(hostname)) return true;
    if (hostname === 'dzbanek-bot.vojtas.io') return true;
    return false;
  }

  function detectSiteUrl() {
    try {
      if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) {
        if (!isLocalHost(location.hostname)) {
          return location.origin;
        }
      }
    } catch (e) {
      /* ignore */
    }
    return PUBLIC_SITE;
  }

  function isHttpLocalApi(url) {
    try {
      var u = String(url || '');
      return /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?\/?$/i.test(u);
    } catch (e) {
      return false;
    }
  }

  function detectApiBase() {
    try {
      var stored = localStorage.getItem('dzbanek_api_base');
      if (stored) {
        var cleaned = String(stored).replace(/\/$/, '');
        // HTTPS public pages cannot call http://127.0.0.1 (mixed content + wrong machine)
        try {
          if (
            typeof location !== 'undefined' &&
            location.protocol === 'https:' &&
            !isLocalHost(location.hostname) &&
            isHttpLocalApi(cleaned)
          ) {
            try {
              localStorage.removeItem('dzbanek_api_base');
            } catch (e2) {
              /* ignore */
            }
          } else {
            return cleaned;
          }
        } catch (e) {
          return cleaned;
        }
      }
    } catch (e) {
      /* ignore */
    }

    if (PRODUCTION_API_BASE) {
      return String(PRODUCTION_API_BASE).replace(/\/$/, '');
    }

    try {
      if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) {
        if (isLocalHost(location.hostname)) {
          // Bot embeds the site on :3848 — same origin when already there
          if (String(location.port) === '3848') {
            return location.origin;
          }
          return 'http://127.0.0.1:3848';
        }
        // Pure static hosting: no live API (avoid mixed content / dead same-origin /api)
        if (isStaticSiteHost(location.hostname)) {
          return '';
        }
        // VPS / reverse-proxy co-hosting the bot
        return location.origin;
      }
    } catch (e) {
      /* ignore */
    }

    return 'http://127.0.0.1:3848';
  }

  function detectStaticHosting() {
    try {
      if (typeof location === 'undefined') return false;
      if (isLocalHost(location.hostname)) return false;
      if (PRODUCTION_API_BASE) return false;
      try {
        if (localStorage.getItem('dzbanek_api_base')) return false;
      } catch (e) {
        /* ignore */
      }
      return isStaticSiteHost(location.hostname);
    } catch (e) {
      return false;
    }
  }

  window.DZBANEK = {
    PUBLIC_SITE: PUBLIC_SITE,
    PRODUCTION_API_BASE: PRODUCTION_API_BASE,
    /** Relative path to committed stats snapshot (works on GitHub Pages). */
    STATS_SNAPSHOT: 'data/stats.json',
    API_BASE: detectApiBase(),
    IS_STATIC_HOSTING: detectStaticHosting(),
    INVITE_URL:
      'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3173376&scope=bot%20applications.commands',
    /**
     * Support Discord invite (e.g. https://discord.gg/xxxx).
     * Empty = Support buttons show “coming soon” toast instead of linking.
     */
    SUPPORT_URL: 'https://discord.gg/9CnkKWWP26',
    GITHUB: 'https://github.com/KingVojtas/dzbanek-bot',
    GITHUB_SITE: 'https://github.com/KingVojtas/dzbanek-bot-website',
    /** Optional tip jar — shown in footers */
    COFFEE_URL: 'https://buymeacoffee.com/vojtas?status=1',
    SITE_URL: detectSiteUrl(),
    OG_IMAGE:
      'https://raw.githubusercontent.com/KingVojtas/dzbanek-bot-website/main/assets/bot-avatar.png',
    refreshApiBase: function () {
      window.DZBANEK.API_BASE = detectApiBase();
      window.DZBANEK.IS_STATIC_HOSTING = detectStaticHosting();
      return window.DZBANEK.API_BASE;
    },
  };
})();
