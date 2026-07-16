/**
 * Site-wide configuration.
 *
 * API_BASE — bot HTTP API (public stats + OAuth admin).
 *   Override: localStorage.setItem('dzbanek_api_base', 'https://api.example.com')
 *
 * PRODUCTION_API_BASE — set when the site host does not reverse-proxy /api to the bot.
 *   Leave '' to auto-detect:
 *     - localhost / 127.0.0.1 → http://127.0.0.1:3848 (local bot)
 *     - otherwise → same origin (bot serves site or reverse-proxy /api)
 *
 * SITE_URL — absolute site origin for Open Graph / share previews.
 *   Production default: https://dzbanek-bot.vojtas.io
 *
 * OG_IMAGE — absolute image URL (Discord/Twitter need absolute paths).
 */
(function () {
  /** Canonical public site (custom domain). */
  var PUBLIC_SITE = 'https://dzbanek-bot.vojtas.io';

  /**
   * Public bot API origin if /api is not on the same host as the site.
   * Example: 'https://bot-api.vojtas.io' or leave '' if the bot is reverse-proxied
   * at https://dzbanek-bot.vojtas.io/api/...
   */
  var PRODUCTION_API_BASE = '';

  function isLocalHost(hostname) {
    return (
      !hostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    );
  }

  function detectSiteUrl() {
    try {
      if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) {
        if (!isLocalHost(location.hostname)) {
          // Custom domain (or any non-local host) → use that origin as site root
          return location.origin;
        }
      }
    } catch (e) {
      /* ignore */
    }
    return PUBLIC_SITE;
  }

  function detectApiBase() {
    try {
      var stored = localStorage.getItem('dzbanek_api_base');
      if (stored) return String(stored).replace(/\/$/, '');
    } catch (e) {
      /* ignore */
    }

    if (PRODUCTION_API_BASE) {
      return String(PRODUCTION_API_BASE).replace(/\/$/, '');
    }

    try {
      if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) {
        if (isLocalHost(location.hostname)) {
          return 'http://127.0.0.1:3848';
        }
        // Production: same origin (bot hosts static files or reverse-proxy /api)
        return location.origin;
      }
    } catch (e) {
      /* ignore */
    }

    return 'http://127.0.0.1:3848';
  }

  window.DZBANEK = {
    PUBLIC_SITE: PUBLIC_SITE,
    PRODUCTION_API_BASE: PRODUCTION_API_BASE,
    API_BASE: detectApiBase(),
    INVITE_URL:
      'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3173376&scope=bot%20applications.commands',
    GITHUB: 'https://github.com/KingVojtas/dzbanek-bot',
    GITHUB_SITE: 'https://github.com/KingVojtas/dzbanek-bot-website',
    SITE_URL: detectSiteUrl(),
    OG_IMAGE:
      'https://raw.githubusercontent.com/KingVojtas/dzbanek-bot-website/main/assets/bot-avatar.png',
    /** Recompute API base after localStorage change */
    refreshApiBase: function () {
      window.DZBANEK.API_BASE = detectApiBase();
      return window.DZBANEK.API_BASE;
    },
  };
})();
