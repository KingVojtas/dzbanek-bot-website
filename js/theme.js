/**
 * Light / dark theme controller — paints theme by injecting a runtime <style>
 * so light mode always wins over Tailwind utilities.
 *
 * Storage: localStorage.dzbanek_theme = "light" | "dark"
 * Toggle:  [data-theme-toggle]
 */
(function (global) {
  if (global.DzbanekTheme && global.DzbanekTheme.__ready) return;

  var KEY = 'dzbanek_theme';
  var STYLE_ID = 'dzbanek-theme-runtime';
  var bound = false;

  function readStored() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark') return v;
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function writeStored(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {
      /* ignore */
    }
  }

  function systemTheme() {
    try {
      if (global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      /* ignore */
    }
    return 'dark';
  }

  function resolve() {
    return readStored() || systemTheme();
  }

  /**
   * Runtime CSS that fully owns light mode colors.
   * Dark mode clears this and relies on the normal dark stylesheet.
   */
  function lightModeCss() {
    return [
      '/* dzbanek light theme — runtime override */',
      'html[data-theme="light"], html.light {',
      '  color-scheme: light !important;',
      '  --discord-bg: 245 246 250;',
      '  --discord-darker: 232 235 242;',
      '  --discord-card: 255 255 255;',
      '  --discord-elevated: 228 232 240;',
      '  --discord-muted: 75 82 96;',
      '  --discord-embed: 245 246 250;',
      '  --discord-blurple: 88 101 242;',
      '  --discord-blurple-hover: 71 82 196;',
      '  --discord-green: 35 165 89;',
      '  --color-fg: 24 26 32;',
      '  --color-fg-strong: 15 16 20;',
      '  --color-muted: 75 82 96;',
      '  --hex-bg: #f5f6fa;',
      '  --hex-darker: #e8ebf2;',
      '  --hex-card: #ffffff;',
      '  --hex-elevated: #e4e8f0;',
      '  --hex-fg: #181a20;',
      '  --hex-fg-strong: #0f1014;',
      '  --hex-muted: #4b5260;',
      '  --hero-glow-1: rgba(88, 101, 242, 0.12);',
      '  --hero-glow-2: rgba(88, 101, 242, 0.06);',
      '  --shadow-card: 0 10px 36px -12px rgba(15, 16, 20, 0.12);',
      '  --shadow-glow: 0 0 40px -10px rgba(88, 101, 242, 0.28);',
      '  --now-card-bg: #ffffff;',
      '  --now-card-border: rgba(15, 16, 20, 0.1);',
      '  --now-album-bg: #e8ebf2;',
      '  --status-strip-bg: #eef0f6;',
      '  --mock-tab-bg: #eef0f6;',
      '  --mock-tab-color: #4b5260;',
      '  --faq-open-color: #0f1014;',
      '  --chip-active-color: #0f1014;',
      '  --lang-corner-bg: rgba(255,255,255,0.95);',
      '  --lang-corner-border: rgba(15,16,20,0.1);',
      '  --lang-btn-color: #4b5260;',
      '  --lang-btn-hover-color: #0f1014;',
      '  --lang-btn-hover-bg: rgba(15,16,20,0.06);',
      '  --scrollbar-track: #e6e9f0;',
      '  --scrollbar-thumb: #b4b9c6;',
      '  --color-surface-border: rgba(15,16,20,0.1);',
      '}',
      'html[data-theme="light"] body,',
      'html.light body,',
      'html[data-theme="light"] body.bg-discord-bg,',
      'html.light body.bg-discord-bg {',
      '  background-color: #f5f6fa !important;',
      '  background-image: none !important;',
      '  color: #0f1014 !important;',
      '}',
      'html[data-theme="light"] .bg-discord-bg,',
      'html[data-theme="light"] [class*="bg-discord-bg"],',
      'html.light .bg-discord-bg,',
      'html.light [class*="bg-discord-bg"] {',
      '  background-color: #f5f6fa !important;',
      '}',
      'html[data-theme="light"] .bg-discord-darker,',
      'html[data-theme="light"] [class*="bg-discord-darker"],',
      'html.light .bg-discord-darker {',
      '  background-color: #e8ebf2 !important;',
      '}',
      'html[data-theme="light"] .bg-discord-card,',
      'html[data-theme="light"] [class*="bg-discord-card"],',
      'html.light .bg-discord-card {',
      '  background-color: #ffffff !important;',
      '}',
      'html[data-theme="light"] .bg-discord-elevated,',
      'html[data-theme="light"] [class*="bg-discord-elevated"],',
      'html.light .bg-discord-elevated {',
      '  background-color: #e4e8f0 !important;',
      '}',
      'html[data-theme="light"] .text-white,',
      'html[data-theme="light"] [class*="text-white"],',
      'html.light .text-white,',
      'html.light [class*="text-white"] {',
      '  color: #0f1014 !important;',
      '}',
      'html[data-theme="light"] .text-discord-muted,',
      'html.light .text-discord-muted {',
      '  color: #4b5260 !important;',
      '}',
      'html[data-theme="light"] .text-theme-strong,',
      'html.light .text-theme-strong {',
      '  color: #0f1014 !important;',
      '}',
      'html[data-theme="light"] .hover\\:text-white:hover,',
      'html.light .hover\\:text-white:hover {',
      '  color: #0f1014 !important;',
      '}',
      'html[data-theme="light"] h1,',
      'html[data-theme="light"] h2,',
      'html[data-theme="light"] h3,',
      'html[data-theme="light"] h4,',
      'html[data-theme="light"] p,',
      'html[data-theme="light"] li,',
      'html[data-theme="light"] span,',
      'html[data-theme="light"] label,',
      'html[data-theme="light"] td,',
      'html[data-theme="light"] th,',
      'html[data-theme="light"] dt,',
      'html[data-theme="light"] dd,',
      'html[data-theme="light"] strong,',
      'html[data-theme="light"] summary {',
      '  color: inherit;',
      '}',
      'html[data-theme="light"] main,',
      'html[data-theme="light"] section,',
      'html[data-theme="light"] article,',
      'html[data-theme="light"] footer,',
      'html.light main,',
      'html.light section {',
      '  color: #181a20;',
      '}',
      'html[data-theme="light"] .text-discord-blurple,',
      'html[data-theme="light"] a.text-discord-blurple,',
      'html.light .text-discord-blurple {',
      '  color: #5865f2 !important;',
      '}',
      'html[data-theme="light"] .bg-discord-blurple,',
      'html[data-theme="light"] a.bg-discord-blurple,',
      'html[data-theme="light"] button.bg-discord-blurple,',
      'html[data-theme="light"] .btn-shine.bg-discord-blurple,',
      'html[data-theme="light"] #toast,',
      'html.light .bg-discord-blurple {',
      '  background-color: #5865f2 !important;',
      '  color: #ffffff !important;',
      '}',
      'html[data-theme="light"] .bg-discord-blurple *,',
      'html[data-theme="light"] #toast,',
      'html[data-theme="light"] .lang-corner-btn.is-lang-active,',
      'html[data-theme="light"] .lang-corner-btn[aria-pressed="true"] {',
      '  color: #ffffff !important;',
      '}',
      'html[data-theme="light"] .border-white\\/5,',
      'html[data-theme="light"] .border-white\\/10,',
      'html[data-theme="light"] .border-white\\/15,',
      'html[data-theme="light"] .border-white\\/20,',
      'html[data-theme="light"] [class*="border-white/"] {',
      '  border-color: rgba(15, 16, 20, 0.12) !important;',
      '}',
      'html[data-theme="light"] header.sticky,',
      'html.light header.sticky {',
      '  background-color: rgba(245, 246, 250, 0.95) !important;',
      '  border-bottom-color: rgba(15, 16, 20, 0.1) !important;',
      '}',
      'html[data-theme="light"] .hero-glow,',
      'html.light .hero-glow {',
      '  background:',
      '    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88,101,242,0.12), transparent),',
      '    radial-gradient(ellipse 50% 40% at 100% 30%, rgba(88,101,242,0.06), transparent) !important;',
      '}',
      'html[data-theme="light"] .from-white {',
      '  --tw-gradient-from: #0f1014 var(--tw-gradient-from-position) !important;',
      '  --tw-gradient-to: rgb(15 16 20 / 0) var(--tw-gradient-to-position) !important;',
      '  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;',
      '}',
      'html[data-theme="light"] .via-white {',
      '  --tw-gradient-stops: var(--tw-gradient-from), #0f1014 var(--tw-gradient-via-position), var(--tw-gradient-to) !important;',
      '}',
      'html[data-theme="light"] .bg-clip-text {',
      '  -webkit-text-fill-color: #0f1014;',
      '  color: #0f1014 !important;',
      '}',
      'html[data-theme="light"] .now-card {',
      '  background: #ffffff !important;',
      '  border-color: rgba(15,16,20,0.1) !important;',
      '  color: #0f1014 !important;',
      '  box-shadow: 0 10px 36px -12px rgba(15,16,20,0.12) !important;',
      '}',
      'html[data-theme="light"] .status-strip {',
      '  background: #eef0f6 !important;',
      '  border-bottom-color: rgba(15,16,20,0.1) !important;',
      '  color: #4b5260 !important;',
      '}',
      'html[data-theme="light"] .mock-tab {',
      '  background: #eef0f6 !important;',
      '  color: #4b5260 !important;',
      '  border-color: rgba(15,16,20,0.12) !important;',
      '}',
      'html[data-theme="light"] .mock-tab.is-active {',
      '  background: rgba(88,101,242,0.12) !important;',
      '  color: #5865f2 !important;',
      '  border-color: rgba(88,101,242,0.45) !important;',
      '}',
      'html[data-theme="light"] input,',
      'html[data-theme="light"] select,',
      'html[data-theme="light"] textarea {',
      '  background-color: #e4e8f0 !important;',
      '  color: #0f1014 !important;',
      '  border-color: rgba(15,16,20,0.12) !important;',
      '}',
      'html[data-theme="light"] code {',
      '  color: #0f1014 !important;',
      '}',
      '/* Discord mock embeds stay dark */',
      'html[data-theme="light"] [class*="bg-[#2"],',
      'html[data-theme="light"] [class*="bg-[#3"],',
      'html[data-theme="light"] [class*="bg-[#1"] {',
      '  color: #dbdee1;',
      '}',
      'html[data-theme="light"] [class*="bg-[#2"] .text-white,',
      'html[data-theme="light"] [class*="bg-[#3"] .text-white,',
      'html[data-theme="light"] [class*="bg-[#1"] .text-white,',
      'html[data-theme="light"] [class*="bg-[#2"] [class*="text-white"],',
      'html[data-theme="light"] [class*="bg-[#3"] [class*="text-white"] {',
      '  color: #dbdee1 !important;',
      '}',
      'html[data-theme="light"] .theme-toggle {',
      '  color: #4b5260 !important;',
      '}',
      'html[data-theme="light"] .theme-toggle:hover {',
      '  color: #0f1014 !important;',
      '  background: #e4e8f0 !important;',
      '}',
    ].join('\n');
  }

  function ensureRuntimeStyle() {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      // Append at end of head so it beats other stylesheets
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }

  function paint(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    var isDark = theme === 'dark';
    var root = document.documentElement;
    var body = document.body;

    [root, body].forEach(function (el) {
      if (!el) return;
      el.setAttribute('data-theme', theme);
      el.classList.remove('dark', 'light');
      el.classList.add(theme);
    });

    root.style.colorScheme = theme;

    var styleEl = ensureRuntimeStyle();
    styleEl.textContent = isDark ? '' : lightModeCss();

    // Direct body paint as extra insurance
    if (body) {
      if (isDark) {
        body.style.removeProperty('background-color');
        body.style.removeProperty('color');
      } else {
        body.style.setProperty('background-color', '#f5f6fa', 'important');
        body.style.setProperty('color', '#0f1014', 'important');
      }
    }

    var label = isDark
      ? labelText('theme.to_light', 'Switch to light mode')
      : labelText('theme.to_dark', 'Switch to dark mode');

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      fillButton(btn, theme, label, isDark);
    });

    try {
      document.dispatchEvent(
        new CustomEvent('dzbanek:theme', { detail: { theme: theme } }),
      );
    } catch (e) {
      /* ignore */
    }

    return theme;
  }

  function labelText(key, fallback) {
    try {
      if (global.DZBANEK_I18N && typeof global.DZBANEK_I18N.t === 'function') {
        var v = global.DZBANEK_I18N.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {
      /* ignore */
    }
    return fallback;
  }

  var SUN =
    '<svg class="theme-toggle-icon theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    '</svg>';
  var MOON =
    '<svg class="theme-toggle-icon theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>' +
    '</svg>';

  function fillButton(btn, theme, label, isDark) {
    if (!btn.getAttribute('data-theme-ready')) {
      btn.innerHTML = SUN + MOON;
      btn.setAttribute('data-theme-ready', '1');
      btn.type = 'button';
    }
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('data-theme-state', theme);
  }

  function apply(theme, persist) {
    if (persist) writeStored(theme);
    return paint(theme);
  }

  function toggle() {
    var cur = document.documentElement.getAttribute('data-theme') || resolve();
    var next = cur === 'light' ? 'dark' : 'light';
    return apply(next, true);
  }

  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var btn = t.closest('[data-theme-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  function init() {
    apply(resolve(), false);
    if (!bound) {
      bound = true;
      document.addEventListener('click', onClick, true);
      document.addEventListener('dzbanek:lang', function () {
        paint(document.documentElement.getAttribute('data-theme') || resolve());
      });
      try {
        var mq = global.matchMedia('(prefers-color-scheme: dark)');
        var onMedia = function () {
          if (readStored()) return;
          apply(resolve(), false);
        };
        if (mq.addEventListener) mq.addEventListener('change', onMedia);
        else if (mq.addListener) mq.addListener(onMedia);
      } catch (e) {
        /* ignore */
      }
    }
  }

  global.DzbanekTheme = {
    __ready: true,
    STORAGE_KEY: KEY,
    resolve: resolve,
    apply: function (theme) {
      return apply(theme === 'light' ? 'light' : 'dark', true);
    },
    toggle: toggle,
    set: function (theme) {
      return apply(theme === 'light' ? 'light' : 'dark', true);
    },
    get current() {
      return document.documentElement.getAttribute('data-theme') || resolve();
    },
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  if (document.body) {
    paint(resolve());
  }
})(typeof window !== 'undefined' ? window : globalThis);
