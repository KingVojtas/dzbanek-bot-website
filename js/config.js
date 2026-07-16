/**
 * Site-wide configuration.
 *
 * API_BASE — bot HTTP API (public stats + OAuth admin).
 *   Override: localStorage.setItem('dzbanek_api_base', 'https://api.example.com')
 *
 * PRODUCTION_API_BASE — set when the site host does not reverse-proxy /api to the bot.
 *   Required for GitHub Pages (static host cannot serve /api/stats).
 *   Example: 'https://your-vps.example.com' or a tunnel URL (HTTPS preferred).
 *
 * SITE_URL — absolute site origin for Open Graph / share previews.
 */
(function () {
  /** Canonical public site (custom domain, if configured). */
  var PUBLIC_SITE = 'https://dzbanek-bot.vojtas.io';

  /**
   * Bot API origin when the website is not co-hosted with the bot.
   * Temporary: localhost while developing. Replace with a public HTTPS URL later
   * (GitHub Pages over HTTPS may block http://localhost as mixed content).
   */
  var PRODUCTION_API_BASE = 'http://127.0.0.1:3848';

  function isLocalHost(hostname) {
    return (
      !hostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    );
  }

  /** GitHub Pages cannot run the Node bot — never treat it as the API host. */
  function isGitHubPagesHost(hostname) {
    return /\.github\.io$/i.test(hostname || '');
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
        // Static hosts (GitHub Pages): no bot process — leave unset until PRODUCTION_API_BASE
        if (isGitHubPagesHost(location.hostname)) {
          return '';
        }
        // Custom domain / VPS that reverse-proxies /api or co-hosts the bot
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
      return isGitHubPagesHost(location.hostname);
    } catch (e) {
      return false;
    }
  }

  window.DZBANEK = {
    PUBLIC_SITE: PUBLIC_SITE,
    PRODUCTION_API_BASE: PRODUCTION_API_BASE,
    API_BASE: detectApiBase(),
    /** True when site is on GitHub Pages with no API base configured. */
    IS_STATIC_HOSTING: detectStaticHosting(),
    INVITE_URL:
      'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3173376&scope=bot%20applications.commands',
    GITHUB: 'https://github.com/KingVojtas/dzbanek-bot',
    GITHUB_SITE: 'https://github.com/KingVojtas/dzbanek-bot-website',
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
