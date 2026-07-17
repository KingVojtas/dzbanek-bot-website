/**
 * FOUC-safe theme bootstrap — put in <head> before CSS.
 * Sets html[data-theme] + .dark/.light before first paint.
 */
(function () {
  var KEY = 'dzbanek_theme';
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
})();
