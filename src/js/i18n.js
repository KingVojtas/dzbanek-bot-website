/**
 * EN / CS. The build writes every page twice, English at the root and Czech
 * under cs/, so the page language is <html lang>. These strings are for what
 * scripts draw later; English is the fallback when a key is missing.
 * theme-boot.js sends ?lang= and the saved choice (localStorage.dzbanek_lang) to the right copy.
 */
(function () {
  const STORAGE = 'dzbanek_lang';

  function lookup(lang, key) {
    const table = (window.DZBANEK_LOCALES && window.DZBANEK_LOCALES[lang]) || null;
    if (!table) return null;
    let node = table;
    for (const part of key.split('.')) {
      if (!node || typeof node !== 'object' || !(part in node)) return null;
      node = node[part];
    }
    return typeof node === 'string' ? node : null;
  }

  function t(key) {
    return lookup(lang, key) ?? lookup('en', key);
  }

  // 404.html has one copy for both languages, so it follows the saved choice.
  const root = document.documentElement;
  const single = !root.hasAttribute('data-href-cs');
  let lang = root.lang === 'cs' ? 'cs' : 'en';
  try {
    if (single && localStorage.getItem(STORAGE) === 'cs') lang = 'cs';
  } catch (e) {
    /* ignore */
  }
  window.t = t;
  window.currentLang = () => lang;

  function apply() {
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = t(el.getAttribute('data-i18n'));
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const value = t(el.getAttribute('data-i18n-aria'));
      if (value != null) el.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const value = t(el.getAttribute('data-i18n-alt'));
      if (value != null) el.setAttribute('alt', value);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const value = t(el.getAttribute('data-i18n-placeholder'));
      if (value != null) el.setAttribute('placeholder', value);
    });

    const page = document.body?.dataset.page || 'home';
    const title = t('meta.' + page + 'Title');
    const description = t('meta.' + page + 'Description');
    if (title) document.title = title;
    const descEl = document.querySelector('meta[name="description"]');
    if (description && descEl) descEl.setAttribute('content', description);

    document.querySelectorAll('[data-lang]').forEach((link) => {
      link.setAttribute('aria-current', String(link.getAttribute('data-lang') === lang));
    });

    if (!single) {
      try {
        localStorage.setItem(STORAGE, lang);
      } catch (e) {
        /* ignore */
      }
    }
    window.dispatchEvent(new CustomEvent('dzbanek:lang', { detail: { lang } }));
  }

  // The switch is a pair of links to the other copy. Remember the choice and keep the place on the page.
  document.querySelectorAll('[data-lang]').forEach((link) => {
    link.addEventListener('click', (event) => {
      try {
        localStorage.setItem(STORAGE, link.getAttribute('data-lang'));
      } catch (e) {
        /* ignore */
      }
      if (!location.hash || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      location.href = link.href.split('#')[0] + location.hash;
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
