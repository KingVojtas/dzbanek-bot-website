/**
 * Accessible light / dark theme manager for dzbanek-bot website.
 *
 * Behaviour
 * ─────────
 * • Preference: localStorage → prefers-color-scheme → dark (brand default)
 * • Applies data-theme + .dark / .light on <html> and <body>
 * • Persists explicit "light" | "dark" under localStorage key dzbanek_theme
 * • Follows OS scheme only when no stored preference
 *
 * Header integration
 * ──────────────────
 *   <button type="button" data-theme-toggle class="theme-toggle"
 *           aria-label="Toggle color theme"></button>
 *
 *   <script src="js/theme-boot.js"></script>  <!-- in <head>, before CSS -->
 *   <script src="js/theme.js"></script>
 */
(function (global) {
  var STORAGE_KEY = 'dzbanek_theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === DARK || v === LIGHT) return v;
    } catch (e) {
      /* private mode */
    }
    return null;
  }

  function writeStored(value) {
    try {
      if (value == null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* ignore */
    }
  }

  function systemPrefersDark() {
    try {
      if (!global.matchMedia) return true;
      return global.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return true;
    }
  }

  /** @returns {'dark'|'light'} */
  function resolveTheme() {
    var stored = readStored();
    if (stored) return stored;
    return systemPrefersDark() ? DARK : LIGHT;
  }

  /**
   * Apply theme to html + body (class, data-theme, color-scheme).
   * @param {'dark'|'light'} theme
   * @param {{ persist?: boolean, source?: string }} [opts]
   */
  function applyTheme(theme, opts) {
    opts = opts || {};
    theme = theme === LIGHT ? LIGHT : DARK;
    var isDark = theme === DARK;
    var root = document.documentElement;
    var body = document.body;

    function paint(el) {
      if (!el) return;
      el.classList.toggle(DARK, isDark);
      el.classList.toggle(LIGHT, !isDark);
      el.setAttribute('data-theme', theme);
    }

    paint(root);
    paint(body);
    root.style.colorScheme = theme;

    if (opts.persist) writeStored(theme);

    syncToggleButtons();
    dispatchChange(theme, opts.source || (opts.persist ? 'user' : 'system'));
  }

  function dispatchChange(theme, source) {
    try {
      document.dispatchEvent(
        new CustomEvent('dzbanek:theme', {
          detail: { theme: theme, source: source || 'unknown' },
        }),
      );
    } catch (e) {
      /* ignore */
    }
  }

  function toggleTheme() {
    var next = resolveTheme() === DARK ? LIGHT : DARK;
    applyTheme(next, { persist: true, source: 'toggle' });
    return next;
  }

  function setTheme(theme) {
    theme = theme === LIGHT ? LIGHT : DARK;
    applyTheme(theme, { persist: true, source: 'set' });
    return theme;
  }

  function clearPreference() {
    writeStored(null);
    applyTheme(resolveTheme(), { persist: false, source: 'clear' });
  }

  // ── Toggle UI ──────────────────────────────────────────────────────────

  var ICON_SUN =
    '<svg class="theme-toggle-icon theme-toggle-icon--sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    '</svg>';

  var ICON_MOON =
    '<svg class="theme-toggle-icon theme-toggle-icon--moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>' +
    '</svg>';

  function t(key, fallback) {
    if (global.DZBANEK_I18N && typeof global.DZBANEK_I18N.t === 'function') {
      var v = global.DZBANEK_I18N.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function labelFor(theme) {
    if (theme === DARK) return t('theme.to_light', 'Switch to light mode');
    return t('theme.to_dark', 'Switch to dark mode');
  }

  function ensureToggleContent(btn) {
    if (!btn.querySelector('.theme-toggle-icon')) {
      btn.innerHTML =
        ICON_SUN +
        ICON_MOON +
        '<span class="theme-toggle-sr" data-theme-label></span>';
    }
  }

  function syncToggleButtons() {
    var theme = resolveTheme();
    var isDark = theme === DARK;
    var label = labelFor(theme);

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      ensureToggleContent(btn);
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('data-theme-state', theme);
      var sr = btn.querySelector('[data-theme-label]');
      if (sr) sr.textContent = label;
    });
  }

  function bindToggles() {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
      if (!btn) return;
      e.preventDefault();
      toggleTheme();
    });
  }

  function bindSystemListener() {
    try {
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      var handler = function () {
        if (readStored()) return;
        applyTheme(resolveTheme(), { persist: false, source: 'media' });
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handler);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(handler);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function init() {
    applyTheme(resolveTheme(), { persist: false, source: 'init' });
    bindToggles();
    bindSystemListener();
    document.addEventListener('dzbanek:lang', function () {
      syncToggleButtons();
    });
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    resolve: resolveTheme,
    apply: applyTheme,
    toggle: toggleTheme,
    set: setTheme,
    clear: clearPreference,
    get stored() {
      return readStored();
    },
    get current() {
      return resolveTheme();
    },
    init: init,
    syncToggleButtons: syncToggleButtons,
  };

  global.DzbanekTheme = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
