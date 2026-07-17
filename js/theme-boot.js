/**
 * FOUC-safe theme bootstrap — load synchronously in <head> before CSS.
 *
 * Rules (same as js/theme.js):
 *   1. localStorage.dzbanek_theme = "light" | "dark"
 *   2. else prefers-color-scheme
 *   3. else dark (brand default)
 *
 * Sets data-theme + .dark/.light on <html> immediately.
 */
(function () {
  try {
    var key = 'dzbanek_theme';
    var stored = null;
    try {
      stored = localStorage.getItem(key);
    } catch (e) {
      /* ignore */
    }

    var theme;
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else {
      var prefersDark = true;
      try {
        prefersDark =
          !window.matchMedia ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e2) {
        prefersDark = true;
      }
      theme = prefersDark ? 'dark' : 'light';
    }

    var root = document.documentElement;
    var isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
