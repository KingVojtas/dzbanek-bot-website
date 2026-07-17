/**
 * FOUC-safe theme bootstrap — load synchronously in <head> before paint.
 *
 * Mirrors js/theme.js resolve rules:
 *   localStorage.dzbanek_theme → prefers-color-scheme → dark
 *
 * Sets `dark` on <html> immediately; theme.js copies to <body> on init.
 *
 * Usage:
 *   <script src="js/theme-boot.js"></script>
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
    var dark;
    if (stored === 'dark') dark = true;
    else if (stored === 'light') dark = false;
    else {
      dark =
        !window.matchMedia ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
