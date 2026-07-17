/**
 * Light / dark theme controller.
 *
 * Storage key: localStorage.dzbanek_theme = "light" | "dark"
 * DOM: html + body get data-theme, .dark / .light classes
 * Toggle: any [data-theme-toggle] button
 */
(function (global) {
  if (global.DzbanekTheme && global.DzbanekTheme.__ready) return;

  var KEY = 'dzbanek_theme';
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

  function paint(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    var isDark = theme === 'dark';
    var nodes = [document.documentElement, document.body];

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el) continue;
      el.setAttribute('data-theme', theme);
      el.classList.remove('dark', 'light');
      el.classList.add(theme);
    }

    document.documentElement.style.colorScheme = theme;

    // Keep icons / aria in sync
    var label =
      theme === 'dark'
        ? labelText('theme.to_light', 'Switch to light mode')
        : labelText('theme.to_dark', 'Switch to dark mode');

    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var b = 0; b < buttons.length; b++) {
      fillButton(buttons[b], theme, label, isDark);
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
    var cur =
      document.documentElement.getAttribute('data-theme') || resolve();
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

  var api = {
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

  global.DzbanekTheme = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Also paint immediately if body already exists (script at end of body)
  if (document.body) {
    paint(resolve());
  }
})(typeof window !== 'undefined' ? window : globalThis);
