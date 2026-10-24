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
  // Every page has an English copy and a Czech one under cs/ (data-href-en / data-href-cs).
  // ?lang= from an old link, a saved choice, or a Czech or Slovak browser picks the copy before anything paints.
  try {
    var root = document.documentElement;
    var here = root.lang === 'cs' ? 'cs' : 'en';
    var asked = new URLSearchParams(location.search).get('lang');
    var saved = localStorage.getItem('dzbanek_lang');
    var want = here;
    if (asked === 'cs' || asked === 'en') want = asked;
    else if (here === 'en' && (saved === 'cs' || (!saved && /^(cs|sk)\b/i.test(navigator.language || '')))) want = 'cs';
    var other = root.getAttribute('data-href-' + want);
    if (want !== here && other) location.replace(other + location.hash);
    else if (asked) history.replaceState(null, '', location.pathname + location.hash);
  } catch (e) {
    /* stay on this copy */
  }
  // The home page's ad autoplays once a session (film.js), so lay the hero out for it from the start.
  try {
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saver = navigator.connection && navigator.connection.saveData;
    if (!calm && !saver && sessionStorage.getItem('dzbanek_film') !== '1') {
      document.documentElement.classList.add('film-soon');
    }
  } catch (e) {
    /* no storage: film.js decides */
  }
})();
