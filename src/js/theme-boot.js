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
  } catch (e) {
    /* keep the night theme */
  }
})();
