/**
 * Site-wide configuration.
 *
 * API_BASE — bot HTTP API (public stats + OAuth admin).
 *   Override: localStorage.setItem('dzbanek_api_base', 'https://api.example.com')
 *
 * SITE_URL — absolute site origin for Open Graph / share previews.
 *   GitHub Pages default below; set '' to skip absolute rewrites.
 *   Image fallback always uses raw.githubusercontent.com for reliable Discord embeds.
 *
 * OG_IMAGE — absolute image URL (Discord/Twitter need absolute paths).
 */
window.DZBANEK = {
  API_BASE: localStorage.getItem('dzbanek_api_base') || 'http://127.0.0.1:3848',
  INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=923262419923513445&permissions=3166376&scope=bot%20applications.commands',
  GITHUB: 'https://github.com/KingVojtas/dzbanek-bot',
  GITHUB_SITE: 'https://github.com/KingVojtas/dzbanek-bot-website',
  SITE_URL: 'https://kingvojtas.github.io/dzbanek-bot-website',
  OG_IMAGE:
    'https://raw.githubusercontent.com/KingVojtas/dzbanek-bot-website/main/assets/bot-avatar.png',
};
