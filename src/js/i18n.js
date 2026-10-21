/**
 * EN / CS. English HTML is the fallback when a key is missing.
 * ?lang=cs wins over localStorage.dzbanek_lang.
 */
(function () {
  const STORAGE = 'dzbanek_lang';

  function current() {
    try {
      const query = new URLSearchParams(location.search).get('lang');
      if (query === 'cs' || query === 'en') return query;
      const stored = localStorage.getItem(STORAGE);
      if (stored === 'cs' || stored === 'en') return stored;
    } catch (e) {
      /* ignore */
    }
    return 'en';
  }

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

  let lang = current();
  window.t = t;
  window.currentLang = () => lang;

  function apply() {
    document.documentElement.lang = lang === 'cs' ? 'cs' : 'en';
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

    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-lang') === lang));
    });

    try {
      localStorage.setItem(STORAGE, lang);
    } catch (e) {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('dzbanek:lang', { detail: { lang } }));
  }

  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.getAttribute('data-lang');
      if (next !== 'en' && next !== 'cs') return;
      lang = next;
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
      apply();
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
