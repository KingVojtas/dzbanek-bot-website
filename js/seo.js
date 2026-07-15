/**
 * Ensure Open Graph / Twitter meta use absolute URLs when possible.
 * Crawlers that don't run JS still benefit from static absolute tags in HTML.
 */
(function () {
  const cfg = window.DZBANEK || {};
  const site = (cfg.SITE_URL || '').replace(/\/$/, '');
  const image = cfg.OG_IMAGE || '';

  function setMeta(attr, key, value) {
    if (!value) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  if (image) {
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:image', image);
  }

  if (site) {
    const path = location.pathname.split('/').pop() || 'index.html';
    const page =
      path === '' || path === 'index.html' ? site + '/' : site + '/' + path;
    setMeta('property', 'og:url', page);
  }
})();
