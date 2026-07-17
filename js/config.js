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

  /** Old Railway hostnames that 404 — never use for OAuth/API. */
  var DEAD_API_HOSTS = [
    'bot-production-c393.up.railway.app',
  ];

  function isDeadApiBase(url) {
    try {
      var h = new URL(String(url || '')).hostname.toLowerCase();
      return DEAD_API_HOSTS.some(function (d) {
        return h === d || h.endsWith('.' + d);
      });
    } catch (e) {
      return false;
    }
  }

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
        // Drop dead Railway hosts (old OAuth 404) and localhost overrides on HTTPS public pages
        if (isDeadApiBase(cleaned)) {
          try {
            localStorage.removeItem('dzbanek_api_base');
          } catch (e0) {
            /* ignore */
          }
        } else {
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
      }
    } catch (e) {
      /* ignore */
    }

    if (PRODUCTION_API_BASE) {
      var prod = String(PRODUCTION_API_BASE).replace(/\/$/, '');
      if (!isDeadApiBase(prod)) return prod;
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
    /** Canonical OAuth callback the Discord app must allow */
    OAUTH_CALLBACK_URL: PRODUCTION_API_BASE.replace(/\/$/, '') + '/api/auth/callback',
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
    isDeadApiBase: isDeadApiBase,
    refreshApiBase: function () {
      window.DZBANEK.API_BASE = detectApiBase();
      window.DZBANEK.IS_STATIC_HOSTING = detectStaticHosting();
      return window.DZBANEK.API_BASE;
    },
  };
})();
