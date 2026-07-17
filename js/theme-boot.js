/**
 * FOUC-safe theme bootstrap — load in <head> BEFORE any CSS.
 *
 * 1. Read localStorage / system preference
 * 2. Set html[data-theme] + .dark|.light
 * 3. If light: inject css/theme-light.css immediately so first paint is bright
 */
(function () {
  var KEY = 'dzbanek_theme';
  var LINK_ID = 'dzbanek-theme-light-css';
  var theme = 'dark';

  try {
    var stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else if (window.matchMedia) {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
  } catch (e) {
    theme = 'dark';
  }

  var root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.style.colorScheme = theme;

  // Instant background so even unloaded CSS doesn't flash wrong
  if (theme === 'light') {
    root.style.backgroundColor = '#f5f6fa';
    root.style.color = '#0f1014';
  } else {
    root.style.backgroundColor = '#0d0e12';
    root.style.color = '#ecedf0';
  }

  function lightHref() {
    // Resolve relative to this script when possible
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || '';
        if (src.indexOf('theme-boot') !== -1) {
          return src.replace(/js\/theme-boot\.js.*$/i, 'css/theme-light.css?v=20260718a');
        }
      }
    } catch (e2) {
      /* ignore */
    }
    return 'css/theme-light.css?v=20260718a';
  }

  if (theme === 'light') {
    var existing = document.getElementById(LINK_ID);
    if (!existing) {
      var link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      link.href = lightHref();
      // Insert as early as possible
      var head = document.head || document.getElementsByTagName('head')[0];
      if (head) {
        if (head.firstChild) head.insertBefore(link, head.firstChild);
        else head.appendChild(link);
      }
    }
  }

  // Expose for theme.js
  window.__DZBANEK_THEME_BOOT__ = theme;
})();
