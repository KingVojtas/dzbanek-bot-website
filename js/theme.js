/**
 * Theme controller — light / dark
 *
 * - Preference: localStorage.dzbanek_theme → system → dark
 * - DOM: html + body get data-theme and .dark / .light
 * - Light styles: css/theme-light.css (enabled only in light mode)
 * - Toggle: [data-theme-toggle]
 */
(function (global) {
  if (global.DzbanekTheme && global.DzbanekTheme.__ready) return;

  var KEY = 'dzbanek_theme';
  var LINK_ID = 'dzbanek-theme-light-css';
  var CSS_HREF = 'css/theme-light.css?v=20260718a';
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

  function resolveCssHref() {
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || '';
        if (src.indexOf('theme.js') !== -1) {
          return src.replace(/\/js\/theme\.js(\?[^#]*)?(#.*)?$/i, '/css/theme-light.css?v=20260718a');
        }
      }
    } catch (e) {
      /* ignore */
    }
    try {
      return new URL(CSS_HREF, document.baseURI || location.href).href;
    } catch (e2) {
      return CSS_HREF;
    }
  }

  function getLightLink() {
    return document.getElementById(LINK_ID);
  }

  function enableLightCss() {
    var link = getLightLink();
    if (!link) {
      link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      link.href = resolveCssHref();
      document.head.appendChild(link);
    } else {
      // Re-enable if previously disabled
      link.disabled = false;
      if (!link.href || link.href.indexOf('theme-light') === -1) {
        link.href = resolveCssHref();
      }
    }
    return link;
  }

  function disableLightCss() {
    var link = getLightLink();
    if (link) {
      link.disabled = true;
    }
  }

  function t(key, fallback) {
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
    '<svg class="theme-toggle-icon theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    '</svg>';

  var MOON =
    '<svg class="theme-toggle-icon theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>' +
    '</svg>';

  function fillButton(btn, theme, isDark) {
    if (!btn.getAttribute('data-theme-ready')) {
      btn.innerHTML = SUN + MOON;
      btn.setAttribute('data-theme-ready', '1');
      if (!btn.getAttribute('type')) btn.type = 'button';
    }
    var label = isDark
      ? t('theme.to_light', 'Switch to light mode')
      : t('theme.to_dark', 'Switch to dark mode');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('data-theme-state', theme);
  }

  function paint(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    var isDark = theme === 'dark';
    var root = document.documentElement;
    var body = document.body;

    root.setAttribute('data-theme', theme);
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.style.colorScheme = theme;

    // Instant paint (before/without CSS file)
    if (isDark) {
      root.style.backgroundColor = '#0d0e12';
      root.style.color = '#ecedf0';
      disableLightCss();
    } else {
      root.style.backgroundColor = '#f5f6fa';
      root.style.color = '#0f1014';
      enableLightCss();
    }

    if (body) {
      body.setAttribute('data-theme', theme);
      body.classList.remove('dark', 'light');
      body.classList.add(theme);
      if (isDark) {
        body.style.removeProperty('background-color');
        body.style.removeProperty('color');
      } else {
        body.style.setProperty('background-color', '#f5f6fa', 'important');
        body.style.setProperty('color', '#0f1014', 'important');
      }
    }

    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      fillButton(buttons[i], theme, isDark);
    }

    try {
      document.dispatchEvent(
        new CustomEvent('dzbanek:theme', { detail: { theme: theme } }),
      );
    } catch (e) {
      /* ignore */
    }

    return theme;
  }

  function apply(theme, persist) {
    if (persist) writeStored(theme);
    return paint(theme);
  }

  function toggle() {
    var cur = document.documentElement.getAttribute('data-theme') || resolve();
    return apply(cur === 'light' ? 'dark' : 'light', true);
  }

  function onClick(e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var btn = el.closest('[data-theme-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  function init() {
    // Prefer boot value if present, else resolve
    var initial =
      (global.__DZBANEK_THEME_BOOT__ === 'light' || global.__DZBANEK_THEME_BOOT__ === 'dark'
        ? global.__DZBANEK_THEME_BOOT__
        : null) || resolve();
    // If user has stored preference, always honor it
    var stored = readStored();
    if (stored) initial = stored;

    paint(initial);

    if (!bound) {
      bound = true;
      // Capture phase so nothing can swallow the click
      document.addEventListener('click', onClick, true);

      document.addEventListener('dzbanek:lang', function () {
        paint(document.documentElement.getAttribute('data-theme') || resolve());
      });

      try {
        var mq = global.matchMedia('(prefers-color-scheme: dark)');
        var onMedia = function () {
          if (readStored()) return;
          paint(resolve());
        };
        if (mq.addEventListener) mq.addEventListener('change', onMedia);
        else if (mq.addListener) mq.addListener(onMedia);
      } catch (e) {
        /* ignore */
      }
    }
  }

  var api = {
    __ready: true,
    STORAGE_KEY: KEY,
    resolve: resolve,
    apply: function (theme) {
      return apply(theme === 'light' ? 'light' : 'dark', true);
    },
    set: function (theme) {
      return apply(theme === 'light' ? 'light' : 'dark', true);
    },
    toggle: toggle,
    get current() {
      return document.documentElement.getAttribute('data-theme') || resolve();
    },
    init: init,
  };

  global.DzbanekTheme = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // If body already exists, paint now
  if (document.body) {
    var now = readStored() || global.__DZBANEK_THEME_BOOT__ || resolve();
    paint(now === 'light' ? 'light' : now === 'dark' ? 'dark' : resolve());
  }
})(typeof window !== 'undefined' ? window : globalThis);
