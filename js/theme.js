/**
 * Accessible light / dark theme manager for dzbanek-bot website.
 *
 * Behaviour
 * ─────────
 * • Preference order: localStorage ("light"|"dark") → prefers-color-scheme
 * • Applies `dark` class on <body> (mirrored on <html> for FOUC + CSS)
 * • Persists explicit choice in localStorage under key "dzbanek_theme"
 * • Follows OS scheme changes only while the user has no stored preference
 *
 * Integration (existing header)
 * ─────────────────────────────
 * 1. FOUC boot in <head> (before site.css):
 *      <script src="js/theme-boot.js"></script>
 *
 * 2. Full controller near other scripts:
 *      <script src="js/theme.js"></script>
 *
 * 3. Toggle control in the header actions row:
 *
 *      <button
 *        type="button"
 *        data-theme-toggle
 *        class="theme-toggle"
 *        aria-label="Toggle color theme"
 *      ></button>
 *
 *    theme.js injects sun/moon icons, aria-label / aria-pressed, and click handling.
 *    Multiple [data-theme-toggle] buttons are supported.
 */
(function (global) {
  var STORAGE_KEY = 'dzbanek_theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  /** Safe localStorage read */
  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === DARK || v === LIGHT) return v;
    } catch (e) {
      /* private mode / blocked storage */
    }
    return null;
  }

  /** Safe localStorage write (null = clear → follow system again) */
  function writeStored(value) {
    try {
      if (value == null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* ignore */
    }
  }

  /** System preference via prefers-color-scheme */
  function systemPrefersDark() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return true; // brand-safe fallback for this Discord-themed site
    }
  }

  /**
   * Resolve effective theme.
   * @returns {'dark'|'light'}
   */
  function resolveTheme() {
    var stored = readStored();
    if (stored) return stored;
    return systemPrefersDark() ? DARK : LIGHT;
  }

  /**
   * Apply theme classes to body (+ html mirror for FOUC / selectors).
   * @param {'dark'|'light'} theme
   * @param {{ persist?: boolean }} [opts]
   */
  function applyTheme(theme, opts) {
    opts = opts || {};
    var isDark = theme === DARK;
    var body = document.body;
    var root = document.documentElement;

    if (body) {
      body.classList.toggle(DARK, isDark);
      body.setAttribute('data-theme', theme);
    }
    // Mirror on <html> so FOUC boot + CSS work before body exists
    if (root) {
      root.classList.toggle(DARK, isDark);
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    }

    if (opts.persist) writeStored(theme);

    syncToggleButtons();
    dispatchChange(theme, opts.persist ? 'user' : 'system');
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

  /** Toggle between light and dark; always persists explicit choice */
  function toggleTheme() {
    var next = resolveTheme() === DARK ? LIGHT : DARK;
    applyTheme(next, { persist: true });
    return next;
  }

  /** Set explicit theme and persist */
  function setTheme(theme) {
    theme = theme === LIGHT ? LIGHT : DARK;
    applyTheme(theme, { persist: true });
    return theme;
  }

  /** Clear stored preference and re-apply system preference */
  function clearPreference() {
    writeStored(null);
    applyTheme(resolveTheme(), { persist: false });
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
    // Button announces the action: “switch to light” when currently dark
    if (theme === DARK) {
      return t('theme.to_light', 'Switch to light mode');
    }
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

    // Space / Enter already activate <button>; no extra key handler needed.
  }

  /** Watch OS preference when user has not chosen explicitly */
  function bindSystemListener() {
    try {
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      var handler = function () {
        if (readStored()) return; // respect explicit choice
        applyTheme(resolveTheme(), { persist: false });
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
    applyTheme(resolveTheme(), { persist: false });
    bindToggles();
    bindSystemListener();
    // Re-sync labels after i18n applies
    document.addEventListener('dzbanek:lang', function () {
      syncToggleButtons();
    });
  }

  // Public API
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

  // Auto-init when DOM is ready (body must exist for class toggle)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // If FOUC boot already set html.dark, re-apply to body as soon as possible
  if (document.body) {
    applyTheme(resolveTheme(), { persist: false });
  }
})(typeof window !== 'undefined' ? window : globalThis);
