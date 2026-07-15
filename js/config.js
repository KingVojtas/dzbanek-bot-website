/**
 * Site-wide configuration.
 *
 * API_BASE — bot HTTP API (public stats + OAuth admin).
 *   Override without editing files:
 *     localStorage.setItem('dzbanek_api_base', 'https://api.example.com')
 *   Production: use your public API origin, or '' if reverse-proxied as same-origin /api.
 *
 * SITE_URL — absolute site origin for Open Graph in production
 *   (e.g. https://dzbanek.example.com). Relative og:image breaks Discord previews.
 *
 * Bot must allow this site's origin in WEBSITE_ORIGIN for CORS + admin cookies.
 */
window.DZBANEK = {
  API_BASE: localStorage.getItem('dzbanek_api_base') || 'http://127.0.0.1:3847',
  INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3166376&scope=bot%20applications.commands',
  GITHUB: 'https://github.com/KingVojtas/dzbanek-bot',
  SITE_URL: '', // e.g. https://dzbanek.example.com
};
