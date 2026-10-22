/**
 * Apply the saved theme before first paint.
 * Default is the night kitchen. "light" and the system preference opt into paper.
 */
(function () {
  // Reveal animations and demos only hide content when scripts run.
  document.documentElement.classList.add('js');
  try {
    var stored = localStorage.getItem('dzbanek_theme');
    var light =
      stored === 'light' ||
      (stored !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches);
    if (light) document.documentElement.classList.add('theme-light');
    // The browser bar follows the chosen theme, not only the system one.
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i += 1) metas[i].setAttribute('content', light ? '#f6f1e8' : '#120c08');
  } catch (e) {
    /* keep the night theme */
  }
})();
