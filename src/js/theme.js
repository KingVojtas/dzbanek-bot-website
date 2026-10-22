/**
 * Light / dark toggle. The choice is stored as dzbanek_theme.
 */
(function () {
  const root = document.documentElement;
  const button = document.querySelector('[data-theme-toggle]');

  function isLight() {
    return root.classList.contains('theme-light');
  }

  function label() {
    const t = window.t;
    if (!button) return;
    const key = isLight() ? 'theme.toDark' : 'theme.toLight';
    const text = t ? t(key) : isLight() ? 'Switch to dark mode' : 'Switch to light mode';
    button.setAttribute('aria-label', text);
  }

  function setLight(light) {
    root.classList.toggle('theme-light', light);
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', light ? '#f6f1e8' : '#120c08');
    });
    try {
      localStorage.setItem('dzbanek_theme', light ? 'light' : 'dark');
    } catch (e) {
      /* ignore */
    }
    label();
  }

  button?.addEventListener('click', () => setLight(!isLight()));
  window.addEventListener('dzbanek:lang', label);
  label();
})();
